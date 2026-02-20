from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form,Response
from sqlalchemy.orm import Session
import os
from typing import Optional

from services.database import get_db
from services.channels_service.models import Channel, ChannelContent
from services.channels_service.schemas import (
    ChannelCreate, ChannelOut,
    ContentCreate, ContentOut
)
from services.channels_service.permissions import instructor_only
from services.auth_service.dependencies import get_current_user
from services.auth_service.models import User

router = APIRouter(prefix="/channels", tags=["Channels"])

UPLOAD_DIR = "uploads/channels"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============================
# CREATE CHANNEL (Instructor)
# ============================
@router.post("/", response_model=ChannelOut)
def create_channel(
    data: ChannelCreate,
    db: Session = Depends(get_db),
    user=Depends(instructor_only)
):
    channel = Channel(
        name=data.name,
        description=data.description,
        instructor_id=user.id
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


# ============================
# LIST CHANNELS (Everyone)
# ============================
@router.get("/", response_model=list[ChannelOut])
def list_channels(db: Session = Depends(get_db)):
    return db.query(Channel).all()


# ============================
# GET CHANNEL CONTENTS
# ============================
@router.get("/{channel_id}/contents", response_model=list[ContentOut])
def get_channel_contents(channel_id: int, db: Session = Depends(get_db)):
    return db.query(ChannelContent).filter(
        ChannelContent.channel_id == channel_id
    ).all()


# ============================
# POST TEXT CONTENT
# ============================
@router.post("/{channel_id}/text", response_model=ContentOut)
def post_text(
    channel_id: int,
    data: ContentCreate,
    db: Session = Depends(get_db),
    user=Depends(instructor_only)
):
    channel = db.query(Channel).filter(
        Channel.id == channel_id,
        Channel.instructor_id == user.id
    ).first()

    if not channel:
        raise HTTPException(status_code=403, detail="Not your channel")

    content = ChannelContent(
        channel_id=channel_id,
        content_type="text",
        title=data.title,
        text_content=data.body
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


# ============================
# UPLOAD FILE / IMAGE / VIDEO
# ============================
@router.post("/{channel_id}/upload", response_model=ContentOut)
def upload_file(
    channel_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user=Depends(instructor_only)
):
    channel = db.query(Channel).filter(
        Channel.id == channel_id,
        Channel.instructor_id == user.id
    ).first()

    if not channel:
        raise HTTPException(status_code=403, detail="Not your channel")

    # create folder for this channel if it doesn't exist
    channel_dir = os.path.join(UPLOAD_DIR, str(channel_id))
    os.makedirs(channel_dir, exist_ok=True)

    file_path = os.path.join(channel_dir, file.filename)

    # save file
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    content = ChannelContent(
        channel_id=channel_id,
        content_type="file",
        title=title,
        text_content=None,
        file_url=file_path.replace("\\", "/"),
        live_url=None
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


# ============================
# GO LIVE (LINK)
# ============================
@router.post("/{channel_id}/go-live", response_model=ContentOut)
def go_live(
    channel_id: int,
    data: ContentCreate,
    db: Session = Depends(get_db),
    user=Depends(instructor_only)
):
    channel = db.query(Channel).filter(
        Channel.id == channel_id,
        Channel.instructor_id == user.id
    ).first()

    if not channel:
        raise HTTPException(status_code=403, detail="Not your channel")

    content = ChannelContent(
        channel_id=channel_id,
        content_type="live",
        title=data.title,
        text_content=None,
        file_url=None,
        live_url=data.live_url
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    return content
# ============================
# DELETE CONTENT (Instructor or Admin)
# ============================
@router.delete("/{channel_id}/content/{content_id}", status_code=204)
def delete_content(
    channel_id: int,
    content_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user) # Get generic user first
):
    # 1. Fetch the content and the associated channel
    content = db.query(ChannelContent).filter(
        ChannelContent.id == content_id,
        ChannelContent.channel_id == channel_id
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    channel = db.query(Channel).filter(Channel.id == channel_id).first()

    # 2. Permission Check: Admin OR the specific Instructor
    is_admin = getattr(user, "is_admin", False)
    is_owner = channel.instructor_id == user.id

    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to delete this content"
        )

    # 3. Cleanup: Delete physical file if it exists
    if content.file_url and os.path.exists(content.file_url):
        try:
            os.remove(content.file_url)
        except OSError:
            pass # Handle cases where file might already be gone

    # 4. Database Deletion
    db.delete(content)
    db.commit()
    
    return Response(status_code=204)
@router.delete("/{channel_id}", status_code=204)
def delete_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    # Permission Check
    if not (getattr(user, "is_admin", False) or channel.instructor_id == user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # IMPORTANT: Delete dependent data if not using CASCADE in DB
    # db.query(ChannelContent).filter(ChannelContent.channel_id == channel_id).delete()
    # db.query(ChannelSubscription).filter(ChannelSubscription.channel_id == channel_id).delete()

    db.delete(channel)
    db.commit() # If this fails, it triggers the ROLLBACK you see in logs
    return Response(status_code=204)