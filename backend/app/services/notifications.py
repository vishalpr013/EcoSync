"""Notification helpers shared by ESG business workflows."""
from typing import Iterable

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core import Notification, NotificationType


async def notify_user(
    db: AsyncSession,
    user_id,
    title: str,
    message: str,
    notification_type: NotificationType,
    link: str | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        link=link,
    )
    db.add(notification)
    await db.flush()
    return notification


async def notify_many(
    db: AsyncSession,
    user_ids: Iterable,
    title: str,
    message: str,
    notification_type: NotificationType,
    link: str | None = None,
) -> None:
    for user_id in set(user_ids):
        await notify_user(db, user_id, title, message, notification_type, link)
