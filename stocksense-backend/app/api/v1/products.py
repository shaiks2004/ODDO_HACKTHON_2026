"""Product route placeholders."""

from fastapi import APIRouter

router = APIRouter(prefix="/products", tags=["products"])