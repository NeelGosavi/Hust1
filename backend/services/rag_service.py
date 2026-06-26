from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from core.config import settings

# Global dictionary to cache FAISS vector stores in memory for MVP (isolated per course)
course_vector_stores = {}

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.GEMINI_API_KEY)
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=settings.GEMINI_API_KEY)

# Define the prompt template for the AI Tutor
system_prompt = (
    "You are a helpful AI Tutor for a student studying this course.\n"
    "Use the following pieces of retrieved context to answer the student's question.\n"
    "If you don't know the answer, just say that you don't know, and don't make up information.\n"
    "Be encouraging and educational in your tone.\n"
    "\n"
    "Context from the course material:\n"
    "{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

async def initialize_course_rag(course_id: str, script_text: str):
    """
    Initializes a FAISS vector store for a specific course using its script.
    """
    if course_id in course_vector_stores:
        return # Already initialized
        
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.create_documents([script_text])
    
    # Create the vector store
    vectorstore = FAISS.from_documents(chunks, embeddings)
    course_vector_stores[course_id] = vectorstore

async def ask_ai_tutor(course_id: str, question: str, script_text: str = None) -> str:
    """
    Retrieves relevant chunks and asks Gemini the question.
    """
    # Ensure vector store is initialized (lazy load if restarting server)
    if course_id not in course_vector_stores:
        if not script_text:
            return "I'm sorry, the course context is not loaded."
        await initialize_course_rag(course_id, script_text)
        
    vectorstore = course_vector_stores[course_id]
    docs = vectorstore.similarity_search(question, k=3)
    context = "\n\n".join([doc.page_content for doc in docs])
    
    formatted_prompt = prompt.format_messages(context=context, input=question)
    response = llm.invoke(formatted_prompt)
    
    return response.content

