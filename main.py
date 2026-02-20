from fastapi import FastAPI, Depends # Added Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import the guard you created
from services.auth_service.dependencies import global_subscription_guard

# Routers
from services.auth_service.routes import router as auth_router
from services.quizzes_service.routes import router as quizzes_router
from services.chat_message_service.routes import router as chat_router
from services.schools_service.routes import router as schools_router
from services.channels_service.routes import router as channels_router
from services.channels_service.views.routes import router as content_views_router
from services.channels_service.reactions.routes import router as content_reactions_router
from services.channels_service.comments.routes import router as content_comments_router
from services.channels_service.comments.reactions.routes import router as comment_reactions_router
from services.channels_service.followers.routes import router as followers_router
from services.competitions_service.routes import router as competitions_router
from services.chatbot_service.routes import router as chatbot_router
from services.system_subscription_service.routes import router as subscription_router
from services.subjects_service.routes import router as subjects_router
from services.sms_service.routes import router as sms_router

load_dotenv()

app = FastAPI(title="EduSA API")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- UNRESTRICTED ROUTERS (Everyone can access) ---
app.include_router(auth_router)
app.include_router(subscription_router) # Must be open so they can pay!
app.include_router(schools_router)
app.include_router(sms_router)

# --- RESTRICTED ROUTERS (Students must be subscribed) ---
# We apply the guard to all these routers at once
locked_deps = [Depends(global_subscription_guard)]

app.include_router(chat_router)
app.include_router(channels_router, dependencies=locked_deps)
app.include_router(chatbot_router, dependencies=locked_deps)
app.include_router(subjects_router, dependencies=locked_deps)
app.include_router(competitions_router, dependencies=locked_deps)
app.include_router(quizzes_router, dependencies=locked_deps)

# Channel sub-features (Also restricted)
app.include_router(content_views_router, dependencies=locked_deps)
app.include_router(content_reactions_router, dependencies=locked_deps)
app.include_router(content_comments_router, dependencies=locked_deps)
app.include_router(comment_reactions_router, dependencies=locked_deps)
app.include_router(followers_router, dependencies=locked_deps)

@app.get("/")
def root():
    return {"message": "EduSA backend running 🚀"}