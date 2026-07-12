"""
Common schemas: pagination, filters, and generic response wrappers.
"""
from pydantic import BaseModel, field_serializer
from typing import Optional, List, Any, Generic, TypeVar
from uuid import UUID
from datetime import datetime

T = TypeVar("T")


class PaginatedParams(BaseModel):
    page: int = 1
    page_size: int = 20
    search: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: str = "desc"


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

    @field_serializer("items")
    def serialize_items(self, items):
        """Serialize SQLAlchemy entities without forcing every list endpoint into a duplicate schema."""
        from sqlalchemy import inspect as sa_inspect

        serialized = []
        for item in items:
            if isinstance(item, BaseModel):
                serialized.append(item.model_dump(mode="json"))
                continue
            try:
                mapper = sa_inspect(item).mapper
            except Exception:
                serialized.append(item)
                continue
            serialized.append({column.key: getattr(item, column.key) for column in mapper.column_attrs})
        return serialized


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class IDResponse(BaseModel):
    id: UUID
    message: str = "Created successfully"
