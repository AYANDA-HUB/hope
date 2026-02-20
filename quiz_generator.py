import os
import requests
import json
import re
from sqlalchemy.orm import Session
from . import models 
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY") 

def generate_quiz(quiz_id: int, topic: str, db: Session):
    num_questions = 5
    # Using Gemma 3 because it has a higher free quota on your account
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key={API_KEY}"
    
    prompt = (
        f"Generate a {num_questions} question multiple-choice quiz about {topic}. "
        "Return ONLY a JSON array. Each object must have: "
        "\"question\", \"options\" (as an object with keys A, B, C, D), and \"answer\" (the letter). "
        "Do not include any markdown or extra text."
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3
        }
    }

    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        
        if response.status_code != 200:
            print(f"DEBUG: Status {response.status_code} - {response.text}")
            return False

        data = response.json()
        raw_text = data['candidates'][0]['content']['parts'][0]['text']
        
        # Robust JSON cleaning for Gemma
        clean_json = re.sub(r'^```json\s*|```$', '', raw_text.strip(), flags=re.MULTILINE)
        questions = json.loads(clean_json)

        # Database saving logic moved here (after parsing JSON)
        if questions:
            for q_data in questions:
                new_question = models.GeneratedQuestion(
                    quiz_id=quiz_id,
                    question=q_data["question"],
                    option_a=q_data["options"]["A"],
                    option_b=q_data["options"]["B"],
                    option_c=q_data["options"]["C"],
                    option_d=q_data["options"]["D"],
                    correct_answer=q_data["answer"]
                )
                db.add(new_question)
            
            db.commit()
            return True
            
    except Exception as e:
        print(f"DEBUG: Error: {e}")
        return False
        
    return False