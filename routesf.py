from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from services.database import get_db
from services.auth_service.dependencies import get_current_user
from .models import ChannelSubscription
from .schemas import FollowStatusResponse, FollowersCountResponse

router = APIRouter(prefix="/channels", tags=["Followers"])

@router.post("/{channel_id}/follow", status_code=status.HTTP_201_CREATED)
def follow_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    exists = db.query(ChannelSubscription).filter(
        ChannelSubscription.channel_id == channel_id,
        ChannelSubscription.user_id == current_user.id
    ).first()

    if exists:
        raise HTTPException(status_code=409, detail="Already following")

    follow = ChannelSubscription(
        channel_id=channel_id,
        user_id=current_user.id
    )

    db.add(follow)
    db.commit()
    return {"message": "Followed successfully"}

@router.delete("/{channel_id}/unfollow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = db.query(ChannelSubscription).filter(
        ChannelSubscription.channel_id == channel_id,
        ChannelSubscription.user_id == current_user.id
    ).delete()

    if deleted == 0:
        raise HTTPException(status_code=404, detail="Not following")

    db.commit()

@router.get("/{channel_id}/follow-status", response_model=FollowStatusResponse)
def follow_status(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    is_following = db.query(ChannelSubscription).filter(
        ChannelSubscription.channel_id == channel_id,
        ChannelSubscription.user_id == current_user.id
    ).first() is not None

    return {"is_following": is_following}

@router.get("/{channel_id}/followers/count", response_model=FollowersCountResponse)
def follower_count(
    channel_id: int,
    db: Session = Depends(get_db),
):
    count = db.query(ChannelSubscription).filter(
        ChannelSubscription.channel_id == channel_id
    ).count()

    return {"followers": count}
