"""Version 1 router composition; business routers are intentionally not included yet."""

from fastapi import APIRouter
from app.api.v1 import categories, inventory, locations, products, warehouses

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(warehouses.router)
api_router.include_router(locations.router)
api_router.include_router(inventory.router)
