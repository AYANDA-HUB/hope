from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from services.database import get_db
from services.auth_service.dependencies import get_current_user
from services.auth_service.models import User
from .models import ChannelContentComment # Ensure local import to avoid ImportError
from ..models import ChannelContent
from .schemas import CommentCreate, CommentResponse, CommentUpdate

router = APIRouter(prefix="/contents", tags=["Content Comments"])

# POST comment
@router.post("/{content_id}/comment", response_model=CommentResponse)
def add_comment(
    content_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    content = db.query(ChannelContent).filter(ChannelContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    new_comment = ChannelContentComment(
        content_id=content_id,
        user_id=current_user.id,
        comment_text=comment.comment,
        parent_comment_id=comment.parent_comment_id
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Attach names for the immediate response
    new_comment.fullname = current_user.fullname
    new_comment.username = current_user.username
    
    return new_comment

# GET all comments
@router.get("/{content_id}/comments", response_model=list[CommentResponse])
def get_comments(content_id: int, db: Session = Depends(get_db)):
    comments = db.query(ChannelContentComment)\
        .options(joinedload(ChannelContentComment.user))\
        .filter(ChannelContentComment.content_id == content_id)\
        .order_by(ChannelContentComment.created_at.desc())\
        .all()
    
    for c in comments:
        c.fullname = c.user.fullname if c.user else "Unknown User"
        c.username = c.user.username if c.user else "unknown"
        
    return comments

# Delete comment
@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    comment = db.query(ChannelContentComment).filter(ChannelContentComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id and getattr(current_user, 'role', None) != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(comment)
    db.commit()
    return {"detail": "Comment deleted"}

# Pin / unpin
@router.patch("/comments/{comment_id}/pin")
def pin_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if getattr(current_user, 'role', None) not in ["admin", "instructor"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    comment = db.query(ChannelContentComment).filter(ChannelContentComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.is_pinned = not comment.is_pinned
    db.commit()
    return {"pinned": comment.is_pinned}
