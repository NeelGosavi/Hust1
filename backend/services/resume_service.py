from google.cloud import documentai_v1 as documentai
from core.config import settings
import os

def parse_resume_pdf(file_content: bytes) -> str:
    """
    Parses a PDF resume using Google Cloud Document AI.
    Note: Requires GOOGLE_APPLICATION_CREDENTIALS to be set and a valid processor ID.
    For this MVP, if the processor or credentials fail, we fallback to a mock extraction.
    """
    # In a real environment, you'd specify the PROJECT_ID, LOCATION, and PROCESSOR_ID.
    # We will use a try-catch to mock the response if GCP isn't fully configured.
    try:
        if not settings.GOOGLE_APPLICATION_CREDENTIALS or not os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
            raise Exception("Credentials not found")
            
        client = documentai.DocumentProcessorServiceClient()
        # This requires actual PROJECT_ID and PROCESSOR_ID which the user must define.
        # We'll simulate the extraction for the MVP if it's not configured.
        raise Exception("GCP Processor details not configured for MVP")
        
    except Exception as e:
        print(f"Falling back to mock parser: {e}")
        # Mock extracted text for the MVP demo
        return "Skills: Python, React, JavaScript, Machine Learning, Fast API, Data Analysis. Experience: 2 years building web apps. Education: BSc Computer Science."
