from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from services.database import get_db
from services.auth_service.dependencies import get_current_user
from ..models import ChannelContent
from .models import ChannelContentReaction
from .schemas import ReactionCreate, ReactionResponse

router = APIRouter(
    prefix="/channels/react",
    tags=["Reactions"]
)

@router.post("/{content_id}/react", response_model=ReactionResponse)
def react_to_content(
    content_id: int,
    reaction: ReactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    content = db.query(ChannelContent).filter(ChannelContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    new_reaction = ChannelContentReaction(
        content_id=content_id,
        user_id=current_user.id,
        emoji=reaction.emoji
    )
    try:
        db.add(new_reaction)
        db.commit()
    except IntegrityError:
        db.rollback()  # ignore duplicates

    total = db.query(func.count(ChannelContentReaction.id)) \
        .filter(ChannelContentReaction.content_id == content_id,
                ChannelContentReaction.emoji == reaction.emoji).scalar()

    return {"content_id": content_id, "emoji": reaction.emoji, "total_reactions": total}

@router.get("/{content_id}", response_model=list[ReactionResponse])
def get_reactions_for_content(
    content_id: int,
    db: Session = Depends(get_db)
):
    reactions = db.query(
        ChannelContentReaction.emoji,
        func.count(ChannelContentReaction.id).label("total_reactions")
    ).filter(ChannelContentReaction.content_id == content_id) \
     .group_by(ChannelContentReaction.emoji).all()

    return [{"content_id": content_id, "emoji": r.emoji, "total_reactions": r.total_reactions} for r in reactions]
