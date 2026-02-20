import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)
models = response.json()

if "models" in models:
    for m in models["models"]:
        print(f"AVAILABLE MODEL: {m['name']}")
else:
    print(f"ERROR: {models}")