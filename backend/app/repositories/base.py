"""
Generic CRUD repository providing create, get, list, update, delete, and paginate operations.
All domain repositories inherit from this base.
"""
from typing import TypeVar, Generic, Type, Optional, List, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def create(self, **kwargs) -> ModelType:
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_by_id(self, id: UUID, options: list = None) -> Optional[ModelType]:
        query = select(self.model).where(self.model.id == id)
        if options:
            for opt in options:
                query = query.options(opt)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        filters: dict = None,
        order_by: str = "created_at",
        order_desc: bool = True,
        options: list = None,
    ) -> List[ModelType]:
        query = select(self.model)
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.where(getattr(self.model, key) == value)
        if options:
            for opt in options:
                query = query.options(opt)
        if hasattr(self.model, order_by):
            col = getattr(self.model, order_by)
            query = query.order_by(col.desc() if order_desc else col.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def paginate(
        self,
        page: int = 1,
        page_size: int = 20,
        filters: dict = None,
        search_columns: list = None,
        search_term: str = None,
        order_by: str = "created_at",
        order_desc: bool = True,
        options: list = None,
    ) -> dict:
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        # Apply filters
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.where(getattr(self.model, key) == value)
                    count_query = count_query.where(getattr(self.model, key) == value)

        # Apply search
        if search_term and search_columns:
            search_conditions = []
            for col_name in search_columns:
                if hasattr(self.model, col_name):
                    search_conditions.append(
                        getattr(self.model, col_name).ilike(f"%{search_term}%")
                    )
            if search_conditions:
                query = query.where(or_(*search_conditions))
                count_query = count_query.where(or_(*search_conditions))

        # Apply eager loading
        if options:
            for opt in options:
                query = query.options(opt)

        # Count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Order and paginate
        if hasattr(self.model, order_by):
            col = getattr(self.model, order_by)
            query = query.order_by(col.desc() if order_desc else col.asc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        }

    async def update(self, id: UUID, **kwargs) -> Optional[ModelType]:
        instance = await self.get_by_id(id)
        if not instance:
            return None
        for key, value in kwargs.items():
            if hasattr(instance, key) and value is not None:
                setattr(instance, key, value)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def delete(self, id: UUID) -> bool:
        instance = await self.get_by_id(id)
        if not instance:
            return False
        await self.db.delete(instance)
        await self.db.flush()
        return True
