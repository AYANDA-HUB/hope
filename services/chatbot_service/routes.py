import os
import base64
import io
import matplotlib.pyplot as plt
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from google import genai
from google.genai import types
from services.database import get_db
from .models import ChatbotMessage
from .schemas import ChatbotRequest, ChatbotResponse
from .language_detect import detect_language

router = APIRouter(
    prefix="/chatbot",
    tags=["Chatbot"]
)

# 🔥 UPDATED SYSTEM PROMPT FOR MATHJAX/LATEX
SYSTEM_PROMPT = """
ROLE: Expert Tutor (Maths, Physics, Chemistry) and General Knowledge Assistant

STRICT RULES:
- No unnecessary greetings or introductions.
- Be direct and clear.
- USE LATEX for all mathematical expressions and formulas. 
- Wrap inline math in single dollar signs like $E=mc^2$.
- Wrap block equations in double dollar signs like $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$.
- For Chemistry, use \\ce{} for chemical formulas, e.g., $\\ce{H2O}$.

FORMAT:
- For calculations: show FULL step-by-step workings using LaTeX.
- For definitions: provide concise explanations with examples.

STYLE:
Step 1: ...
Step 2: ...
Step 3: ...

Final Answer: ...

FOR PHYSICS:
Given:
Formula:
Substitution:
Answer:

FOR CHEMISTRY:
Balanced Equation:
Steps:
Final Answer:
"""

FORBIDDEN_PHRASES = [
    "okay", "here is", "here's", "let us", "let's",
    "definition", "in simple terms"
]

# -------------------- CLEAN AI RESPONSE (FIXED) --------------------
def clean_response(text: str) -> str:
    text = text.replace("<paper>", "")
    text = text.replace("</paper>", "")

    lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            lines.append("")
            continue
        if any(p in line.lower() for p in FORBIDDEN_PHRASES):
            continue
        lines.append(line)
    return "\n".join(lines)

# -------------------- SEND TEXT MESSAGE --------------------
@router.post("/send", response_model=ChatbotResponse)
def send_message(request: ChatbotRequest, db: Session = Depends(get_db)):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API Key not found")

    client = genai.Client(api_key=api_key)
    user_text = request.text.strip()
    detected_lang = detect_language(user_text)

    if not user_text:
        ai_response = "Please enter a specific question or topic."
    else:
        past_messages = (
            db.query(ChatbotMessage)
            .filter(ChatbotMessage.user_id == request.user_id)
            .order_by(ChatbotMessage.id.desc())
            .limit(5)
            .all()
        )

        history = []
        for msg in reversed(past_messages):
            history.append({"role": "user", "parts": [{"text": msg.text}]})
            history.append({"role": "model", "parts": [{"text": msg.response}]})

        # --- FIX: Removed hardcoded generic definitions to allow high-accuracy AI responses ---
        lower_text = user_text.lower()
        
        # If it's a math/calculation query
        if any(k in lower_text for k in ["calculate", "solve", "find", "derivative", "integral"]):
            prompt = f"{SYSTEM_PROMPT}\nLanguage: {detected_lang}\nQuestion:\n{user_text}"
        # If it's a definition/explanation query
        elif any(k in lower_text for k in ["define", "explain", "types of", "kinds of", "what is"]):
            prompt = f"{SYSTEM_PROMPT}\nProvide a detailed scientific definition with LaTeX formulas. Language: {detected_lang}\nQuestion:\n{user_text}"
        # For everything else
        else:
            prompt = f"{SYSTEM_PROMPT}\nAnswer concisely. Language: {detected_lang}\nQuestion:\n{user_text}"

        try:
            chat = client.chats.create(model="models/gemma-3-27b-it", history=history)
            response = chat.send_message(
                prompt,
                config=types.GenerateContentConfig(max_output_tokens=800)
            )
            ai_response = clean_response(response.text)
        except Exception:
            ai_response = "Sorry, I'm unable to process your request at the moment."

    new_msg = ChatbotMessage(
        user_id=request.user_id,
        text=user_text,
        response=ai_response,
        language=detected_lang
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

# -------------------- IMAGE UPLOAD --------------------
@router.post("/send-image", response_model=ChatbotResponse)
async def send_image_message(
    user_id: int = Form(...),
    text: str = Form("Solve this."),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API Key not found")

    client = genai.Client(api_key=api_key)
    detected_lang = detect_language(text)

    try:
        image_bytes = await file.read()
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=file.content_type),
            f"{SYSTEM_PROMPT}\nLanguage: {detected_lang}\nQuestion:\n{text}"
        ]

        response = client.models.generate_content(
            model="models/gemma-3-27b-it",
            contents=contents,
            config=types.GenerateContentConfig(max_output_tokens=800)
        )

        ai_response = clean_response(response.text)

        new_msg = ChatbotMessage(
            user_id=user_id,
            text=f"[Image] {text}",
            response=ai_response,
            language=detected_lang
        )

        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        return new_msg

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Vision Error: {str(e)}")

# -------------------- DRAW GRAPHS --------------------
@router.post("/draw", response_model=ChatbotResponse)
async def draw_graph(
    user_id: int = Form(...),
    text: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        text_lower = text.lower()
        plt.figure(figsize=(6, 4))
        plt.tight_layout()

        if "cos" in text_lower:
            x = np.linspace(0, 2 * np.pi, 400)
            y = np.cos(x)
            plt.plot(x, y)
            plt.title("y = cos(x)")
            plt.grid(True)
        elif "sin" in text_lower:
            x = np.linspace(0, 2 * np.pi, 400)
            y = np.sin(x)
            plt.plot(x, y)
            plt.title("y = sin(x)")
            plt.grid(True)
        elif "parabola" in text_lower:
            x = np.linspace(-10, 10, 400)
            y = x**2
            plt.plot(x, y)
            plt.title("y = x^2")
            plt.grid(True)
        else:
            plt.text(0.5, 0.5, "Graph not available", ha="center")
            plt.axis("off")

        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        plt.close()
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode("utf-8")

        new_msg = ChatbotMessage(
            user_id=user_id,
            text=f"[Draw] {text}",
            response="Graph generated",
            language="en"
        )

        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        return ChatbotResponse(response="Graph generated", image=img_base64)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Draw Error: {str(e)}")
