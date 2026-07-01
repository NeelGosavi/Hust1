"""AI Tutor.

NaraRouter (our LLM provider) is chat-only — it has no embeddings endpoint — so
this tutor doesn't use a vector store. Course scripts are short, so we pass the
(cached) script directly to the model as grounding context.
"""

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from core.config import settings
import logging

logger = logging.getLogger(__name__)

try:
    llm = ChatOpenAI(
        model=settings.NARA_MODEL,
        api_key=settings.NARA_API_KEY,
        base_url=settings.NARA_BASE_URL,
        temperature=settings.GEMINI_TEMPERATURE,
        timeout=60,
        max_retries=2,
    )
    logger.info(f"✅ Tutor LLM initialized: {settings.NARA_MODEL} (NaraRouter)")
except Exception as e:
    logger.error(f"❌ Failed to initialize tutor LLM: {e}")
    llm = None

# In-memory cache of course scripts, keyed by course_id.
course_scripts: dict[str, str] = {}

# Cap the context so a very long script can't blow past the model's window.
MAX_CONTEXT_CHARS = 12000

system_prompt = (
    "You are a helpful AI Tutor for a student studying this course.\n"
    "Use the following course material to answer the student's question.\n"
    "If the answer is not in the material, say you don't know rather than making it up.\n"
    "Be encouraging and educational in your tone.\n\n"
    "Course material:\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])


async def initialize_course_rag(course_id: str, script_text: str):
    """Cache a course's script so the tutor can ground answers in it."""
    course_scripts[course_id] = script_text or ""


async def ask_ai_tutor(course_id: str, question: str, script_text: str = None) -> str:
    """Answer a student question grounded in the course script."""
    if llm is None:
        return "The AI tutor is not available right now."

    context = course_scripts.get(course_id) or script_text or ""
    if not context:
        return "I'm sorry, the course context is not loaded."

    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS]

    messages = prompt.format_messages(context=context, input=question)
    response = llm.invoke(messages)
    return response.content
