import os
from google import genai
from google.genai import types

# Ensure this matches the variable in your .env
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") 

def solve_question(prompt: str, language: str = "en") -> str:
    if not GEMINI_API_KEY:
        return "AI API key not set."

    try:
        # 1. Initialize the modern Client
        client = genai.Client(api_key=GEMINI_API_KEY)

        # 2. Use the same model as your quizzes (Gemma 3)
        # It has a high free quota (14,400+ requests/day)
        model_id = "models/gemma-3-27b-it" 

        # 3. Generate content with an 'Educational Assistant' persona
        response = client.models.generate_content(
            model=model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=f"You are a helpful educational assistant. Please answer in {language}.",
                temperature=0.7
            )
        )

        return response.text

    except Exception as e:
        print(f"DEBUG: AI Service Error: {e}")
        return "Sorry, I'm having trouble connecting to my brain right now."