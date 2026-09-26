"""Shared query parameter validation and paginated response construction."""
from typing import Generic, TypeVar
from fastapi import Query
from pydantic import BaseModel

T = TypeVar("T")

class Page(BaseModel, Generic[T]):
    items: list[T]
    page: int
    page_size: int
    total: int

def pagination(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)) -> tuple[int, int]:
    return page, page_size
