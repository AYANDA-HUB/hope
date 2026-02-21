from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from services.database import get_db
from services.auth_service.dependencies import get_current_user
from services.channels_service.comments.models import ChannelContentComment
from .models import CommentReaction
from .schemas import CommentReactionCreate, CommentReactionResponse

router = APIRouter(
    prefix="/contents/comments",
    tags=["Comment Reactions"]
)

@router.post("/{comment_id}/react", response_model=CommentReactionResponse)
def react_to_comment(
    comment_id: int,
    reaction: CommentReactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    comment = db.query(ChannelContentComment).filter(
        ChannelContentComment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    new_reaction = CommentReaction(
        comment_id=comment_id,
        user_id=current_user.id,
        emoji=reaction.emoji
    )

    try:
        db.add(new_reaction)
        db.commit()
    except IntegrityError:
        db.rollback()  # duplicate reaction → ignore

    total = db.query(func.count(CommentReaction.id)) \
        .filter(
            CommentReaction.comment_id == comment_id,
            CommentReaction.emoji == reaction.emoji
        ).scalar()

    return {
        "comment_id": comment_id,
        "emoji": reaction.emoji,
        "total_reactions": total
    }
@router.get("/{comment_id}/reactions")
def get_comment_reactions(
    comment_id: int,
    db: Session = Depends(get_db)
):
    # Query to group by emoji and count total reactions
    results = db.query(
        CommentReaction.emoji,
        func.count(CommentReaction.id).label("total_reactions")
    ).filter(
        CommentReaction.comment_id == comment_id
    ).group_by(
        CommentReaction.emoji
    ).all()

    # Format the response as a list of objects
    return [
        {"comment_id": comment_id, "emoji": r.emoji, "total_reactions": r.total_reactions}
        for r in results
    ]
