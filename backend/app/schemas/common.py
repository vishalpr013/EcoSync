"""
Common schemas: pagination, filters, and generic response wrappers.
"""
from pydantic import BaseModel
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


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class IDResponse(BaseModel):
    id: UUID
    message: str = "Created successfully"
