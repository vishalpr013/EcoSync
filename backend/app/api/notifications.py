"""
Notifications API routes: listing user notifications, marking them read.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import Optional
from uuid import UUID

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.core import User, Notification
from app.schemas.core import NotificationResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.repositories.base import BaseRepository

router = APIRouter()

@router.get("", response_model=PaginatedResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve paginated notifications list for the logged-in user."""
    repo = BaseRepository(Notification, db)
    result = await repo.paginate(
        page=page,
        page_size=page_size,
        filters={"user_id": current_user.id},
        order_by="created_at",
        order_desc=True
    )
    result["items"] = [NotificationResponse.model_validate(item) for item in result["items"]]
    return result

@router.put("/{notification_id}/read", response_model=MessageResponse)
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    repo = BaseRepository(Notification, db)
    notif = await repo.get_by_id(notification_id)
    if not notif or notif.user_id != current_user.id:
        raise NotFoundError("Notification", str(notification_id))
        
    await repo.update(notification_id, is_read=True)
    return MessageResponse(message="Notification marked as read")

@router.put("/read-all", response_model=MessageResponse)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications of the current user as read."""
    query = update(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).values(is_read=True)
    await db.execute(query)
    await db.flush()
    return MessageResponse(message="All notifications marked as read")

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the count of unread notifications for the user."""
    query = select(func.count(Notification.id)).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )
    res = await db.execute(query)
    count = res.scalar() or 0
    return {"unread_count": count}
