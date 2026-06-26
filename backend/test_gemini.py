# backend/test_gemini_langchain.py

from langchain_google_genai import ChatGoogleGenerativeAI
from core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_gemini_langchain():
    """Test Gemini using LangChain (already installed)"""
    try:
        print("🔑 Testing Gemini via LangChain...")
        print(f"API Key: {settings.GEMINI_API_KEY[:15]}...")
        
        # Try different models
        models_to_try = [
            "gemini-1.5-pro",
            "gemini-1.5-flash", 
            "gemini-pro",
            "gemini-1.0-pro"
        ]
        
        for model_name in models_to_try:
            try:
                print(f"\n🔄 Trying model: {model_name}")
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=settings.GEMINI_API_KEY,
                    temperature=0.7,
                    timeout=30,
                )
                response = llm.invoke("Say 'Hello, this is a test!'")
                print(f"✅ SUCCESS with {model_name}!")
                print(f"Response: {response.content[:100]}")
                return True, model_name
            except Exception as e:
                error_msg = str(e)
                if "404" in error_msg or "NOT_FOUND" in error_msg:
                    print(f"❌ Model {model_name} not found")
                elif "403" in error_msg or "PERMISSION_DENIED" in error_msg:
                    print(f"❌ Permission denied for {model_name}")
                else:
                    print(f"❌ Failed with {model_name}: {error_msg[:100]}")
                continue
        
        print("\n❌ All models failed!")
        print("\n💡 This usually means:")
        print("1. The Generative Language API is not enabled in your Google Cloud project")
        print("2. Your API key doesn't have permission to access Gemini")
        print("3. Billing is not enabled for your project")
        return False, None
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None

if __name__ == "__main__":
    success, model = test_gemini_langchain()
    
    if success:
        print(f"\n🎉 Gemini is working with model: {model}")
    else:
        print("\n" + "="*60)
        print("🔧 TO FIX THIS:")
        print("="*60)
        print("1. Go to: https://console.cloud.google.com/apis/library")
        print("2. Search for 'Generative Language API'")
        print("3. Click 'Enable'")
        print("4. Go to: https://console.cloud.google.com/apis/credentials")
        print("5. Create a new API key")
        print("6. Update your .env file with the new key")
        print("7. Restart your backend")
        print("="*60)