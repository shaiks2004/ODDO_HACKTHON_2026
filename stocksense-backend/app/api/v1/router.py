"""Version 1 router composition for master data and inventory workflows."""

from fastapi import APIRouter
from app.api.v1 import (
	adjustments,
	auth,
	categories,
	dashboard,
	deliveries,
	inventory,
	locations,
	products,
	receipts,
	stock_ledger,
	transfers,
	warehouses,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(warehouses.router)
api_router.include_router(locations.router)
api_router.include_router(inventory.router)
api_router.include_router(receipts.router)
api_router.include_router(deliveries.router)
api_router.include_router(transfers.router)
api_router.include_router(adjustments.router)
api_router.include_router(stock_ledger.router)
api_router.include_router(dashboard.router)
