# backend/services/llm_service.py

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from core.config import settings
from pydantic import BaseModel, Field
from typing import List
import logging
import traceback
import re

logger = logging.getLogger(__name__)

# Initialize the LLM using settings from config
try:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment variables")
    
    # Use gemini-pro which is widely available
    MODEL_NAME = "gemini-pro"
    
    llm = ChatGoogleGenerativeAI(
        model=MODEL_NAME,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=settings.GEMINI_TEMPERATURE,
        convert_system_message_to_human=True,
        timeout=120,  # Increased timeout for gemini-pro
        max_retries=3,
    )
    logger.info(f"✅ Gemini AI initialized successfully with model: {MODEL_NAME}")
except Exception as e:
    logger.error(f"❌ Failed to initialize Gemini AI: {e}")
    llm = None

class SlideSuggestion(BaseModel):
    title: str = Field(description="Title of the slide")
    content: str = Field(description="Bullet points or short text for the slide")
    image_suggestion: str = Field(description="A prompt to generate an image for the slide")

class QuizItem(BaseModel):
    question: str = Field(description="The quiz question")
    options: List[str] = Field(description="4 multiple choice options")
    answer: str = Field(description="The correct option")

class CourseGenerationOutput(BaseModel):
    script: str = Field(description="The complete lecture script or lesson text")
    slides: List[SlideSuggestion] = Field(description="Suggested slides for the presentation")
    quiz: List[QuizItem] = Field(description="A 5-question multiple choice quiz")

# Create parser
parser = PydanticOutputParser(pydantic_object=CourseGenerationOutput)

# Create prompt template with better structure for gemini-pro
prompt = PromptTemplate(
    template="""You are an expert professor designing a comprehensive course module.

Based on the following request, generate a complete lesson with all required components.

REQUEST: {request}

INSTRUCTIONS:
1. Write a detailed lecture script (at least 500 words) that covers the topic comprehensively
2. Create 8-10 slides with clear titles, bullet points, and image generation prompts
3. Generate a 5-question multiple choice quiz with 4 options each
4. Return your response in valid JSON format matching the schema

FORMAT REQUIREMENTS:
{format_instructions}

IMPORTANT: 
- Respond ONLY with valid JSON
- Do not include any markdown formatting
- Do not include any text outside the JSON
- Ensure all strings are properly escaped

Make the content educational, engaging, and well-structured for students.""",
    input_variables=["request"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

async def generate_course_content(request_text: str) -> CourseGenerationOutput:
    """
    Generate course content using Gemini AI
    
    Args:
        request_text (str): The course generation prompt
        
    Returns:
        CourseGenerationOutput: Structured course content
        
    Raises:
        Exception: If content generation fails
    """
    if llm is None:
        raise Exception("LLM not initialized. Please check your API key and configuration.")
    
    try:
        logger.info(f"🔄 Generating course content for: {request_text[:100]}...")
        logger.info(f"Prompt length: {len(request_text)} characters")
        
        # Format the prompt
        try:
            _input = prompt.format_prompt(request=request_text)
            logger.info("✅ Prompt formatted successfully")
        except Exception as e:
            logger.error(f"❌ Failed to format prompt: {e}")
            raise Exception(f"Failed to format prompt: {e}")
        
        # Invoke the LLM
        try:
            logger.info("⏳ Calling Gemini API with model: gemini-pro...")
            response = llm.invoke(_input.to_string())
            logger.info(f"✅ LLM response received ({len(response.content)} characters)")
        except Exception as e:
            logger.error(f"❌ Gemini API call failed: {e}")
            logger.error(traceback.format_exc())
            raise Exception(f"Gemini API call failed: {e}")
        
        # Parse the output
        try:
            parsed = parser.parse(response.content)
            logger.info(f"✅ Course content parsed: {len(parsed.slides)} slides, {len(parsed.quiz)} quiz questions")
            return parsed
        except Exception as parse_error:
            logger.error(f"❌ Failed to parse LLM response: {parse_error}")
            logger.debug(f"Raw response preview: {response.content[:500]}...")
            
            # Try to clean and parse again
            try:
                content = response.content
                
                # Remove markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                # Find JSON content using regex
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group()
                
                # Remove any leading/trailing whitespace
                content = content.strip()
                
                # Try parsing with the cleaned content
                parsed = parser.parse(content)
                logger.info("✅ Successfully parsed after cleaning")
                return parsed
            except Exception as retry_error:
                logger.error(f"❌ Failed to parse even after cleaning: {retry_error}")
                
                # Try one more time with a more aggressive approach
                try:
                    import json
                    content = response.content
                    # Try to find JSON-like structure
                    start = content.find('{')
                    end = content.rfind('}') + 1
                    if start != -1 and end != 0:
                        json_str = content[start:end]
                        # Try to fix common JSON issues
                        json_str = re.sub(r'(\w+):', r'"\1":', json_str)  # Add quotes to keys
                        json_str = re.sub(r':\s*([^"]\w+[^"])(,|})', r': "\1"\2', json_str)  # Add quotes to values
                        data = json.loads(json_str)
                        
                        # Convert dict to CourseGenerationOutput
                        return CourseGenerationOutput(
                            script=data.get("script", f"This is a course about {request_text[:50]}..."),
                            slides=[
                                SlideSuggestion(
                                    title=s.get("title", f"Slide {i+1}"),
                                    content=s.get("content", "Course content"),
                                    image_suggestion=s.get("image_suggestion", "Educational concept")
                                )
                                for i, s in enumerate(data.get("slides", []))
                            ],
                            quiz=[
                                QuizItem(
                                    question=q.get("question", f"Question {i+1}"),
                                    options=q.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                                    answer=q.get("answer", "Option A")
                                )
                                for i, q in enumerate(data.get("quiz", []))
                            ]
                        )
                except Exception as final_error:
                    logger.error(f"❌ All parsing attempts failed: {final_error}")
                    # Return fallback response
                    return get_fallback_response(request_text)
        
    except Exception as e:
        logger.error(f"❌ Failed to generate course content: {str(e)}", exc_info=True)
        raise Exception(f"Failed to generate course content: {str(e)}")

def get_fallback_response(request_text: str) -> CourseGenerationOutput:
    """Return a fallback response when parsing fails"""
    logger.warning("⚠️ Returning fallback response")
    return CourseGenerationOutput(
        script=f"""
This is a course about: {request_text}

Welcome to this comprehensive course! We will cover all the essential topics 
and help you master the subject with practical examples.

The course is designed for beginners and intermediate learners who want to 
gain a solid understanding of the subject matter.

Throughout this course, you will learn:
- Core concepts and principles
- Practical applications
- Real-world examples
- Best practices
- Common pitfalls to avoid

By the end of this course, you will have a strong foundation in this subject.
""",
        slides=[
            SlideSuggestion(
                title="Introduction",
                content="Welcome to this course\nOverview of topics\nLearning objectives\nCourse structure",
                image_suggestion="Educational background with books and technology"
            ),
            SlideSuggestion(
                title="Key Concepts",
                content="Main concepts explained\nPractical applications\nReal-world examples\nCommon use cases",
                image_suggestion="Technology and learning concepts"
            ),
            SlideSuggestion(
                title="Getting Started",
                content="Prerequisites\nRequired tools\nSetup instructions\nFirst steps",
                image_suggestion="Setup and configuration"
            ),
            SlideSuggestion(
                title="Core Principles",
                content="Fundamental principles\nBest practices\nIndustry standards\nKey takeaways",
                image_suggestion="Core concepts visualization"
            ),
            SlideSuggestion(
                title="Practical Applications",
                content="Real-world applications\nCase studies\nExample scenarios\nHands-on practice",
                image_suggestion="Practical application examples"
            )
        ],
        quiz=[
            QuizItem(
                question=f"What is the main focus of this course?",
                options=[
                    "Understanding key concepts",
                    "Practical applications",
                    "Real-world examples",
                    "All of the above"
                ],
                answer="All of the above"
            ),
            QuizItem(
                question="What will you learn in this course?",
                options=[
                    "Core concepts",
                    "Best practices",
                    "Real-world applications",
                    "All of the above"
                ],
                answer="All of the above"
            ),
            QuizItem(
                question="Who is this course designed for?",
                options=[
                    "Beginners",
                    "Intermediate learners",
                    "Advanced learners",
                    "All levels"
                ],
                answer="All levels"
            ),
            QuizItem(
                question="What is the main benefit of this course?",
                options=[
                    "Theoretical knowledge",
                    "Practical skills",
                    "Real-world experience",
                    "Comprehensive understanding"
                ],
                answer="Comprehensive understanding"
            ),
            QuizItem(
                question="How will this course help you?",
                options=[
                    "Build foundation",
                    "Apply concepts",
                    "Solve problems",
                    "All of the above"
                ],
                answer="All of the above"
            )
        ]
    )