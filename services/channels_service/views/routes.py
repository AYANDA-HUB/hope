from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from services.database import get_db
from services.auth_service.dependencies import get_current_user


from ..models import ChannelContent

from .models import ChannelContentView
from .schemas import ContentViewResponse

router = APIRouter(
    prefix="/contents",
    tags=["Content Views"]
)
@router.post("/{content_id}/view", response_model=ContentViewResponse)
def register_view(
    content_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # ... logic ...
    view = ChannelContentView(
        content_id=content_id,
        user_id=current_user.id  # <-- CHANGE THIS from ["id"] to .id
    )
    # ... rest of code ...

    # Check content exists
    content = db.query(ChannelContent).filter(ChannelContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    view = ChannelContentView(
    content_id=content_id,
    user_id=current_user.id
    )

    try:
        db.add(view)
        db.commit()
    except IntegrityError:
        # View already exists → ignore
        db.rollback()

    total_views = db.query(func.count(ChannelContentView.id)) \
        .filter(ChannelContentView.content_id == content_id) \
        .scalar()

    return {
        "content_id": content_id,
        "total_views": total_views
    }
