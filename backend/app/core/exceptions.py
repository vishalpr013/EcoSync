"""
Custom HTTP exceptions for consistent error responses across the application.
"""
from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    def __init__(self, entity: str = "Resource", entity_id: str = ""):
        detail = f"{entity} not found" if not entity_id else f"{entity} with id '{entity_id}' not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class DuplicateError(HTTPException):
    def __init__(self, entity: str = "Resource", field: str = ""):
        detail = f"{entity} already exists" if not field else f"{entity} with this {field} already exists"
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestError(HTTPException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class InsufficientXPError(BadRequestError):
    def __init__(self, required: int, current: int):
        super().__init__(detail=f"Insufficient XP. Required: {required}, Current: {current}")


class EvidenceRequiredError(BadRequestError):
    def __init__(self):
        super().__init__(detail="Evidence/proof file is required before approval")


class OutOfStockError(BadRequestError):
    def __init__(self, reward_name: str = "Reward"):
        super().__init__(detail=f"{reward_name} is out of stock")
