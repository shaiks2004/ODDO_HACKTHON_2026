from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.dependencies import db_session, error
from app.schemas.inventory_views import InventoryListItem, InventoryProductSummary
from app.services.inventory_service import InventoryService
from app.utils.pagination import Page, pagination

router = APIRouter(prefix="/inventory", tags=["Inventory"])
service = InventoryService()


def view(row) -> dict:
    i, p, c, l, w = row
    return {
        "product_id": p.id,
        "product_name": p.name,
        "sku": p.sku,
        "category_id": c.id,
        "category_name": c.name,
        "warehouse_id": w.id,
        "warehouse_name": w.name,
        "location_id": l.id,
        "location_name": l.name,
        "location_code": l.code,
        "on_hand": i.on_hand,
        "reserved": i.reserved,
        "free_to_use": i.on_hand - i.reserved,
        "stock_value": round(i.on_hand * p.unit_cost, 2),
    }


@router.get("", response_model=Page[InventoryListItem], summary="List read-only inventory with advanced filters")
def list_inventory(
    product_id: UUID | None = None,
    warehouse_id: UUID | None = None,
    warehouse: str | None = None,
    location_id: UUID | None = None,
    category_id: UUID | None = None,
    category: str | None = None,
    min_value: Decimal | None = None,
    max_value: Decimal | None = None,
    min_stock_value: Decimal | None = None,
    max_stock_value: Decimal | None = None,
    low_stock: bool = False,
    out_of_stock: bool = False,
    search: str | None = None,
    page_data: tuple[int, int] = Depends(pagination),
    db: Session = Depends(db_session),
):
    p, s = page_data
    resolved_min = min_stock_value if min_stock_value is not None else min_value
    resolved_max = max_stock_value if max_stock_value is not None else max_value
    rows = service.list(
        db,
        product_id=product_id,
        warehouse_id=warehouse_id,
        warehouse=warehouse,
        location_id=location_id,
        category_id=category_id,
        category=category,
        min_stock_value=resolved_min,
        max_stock_value=resolved_max,
        low_stock=low_stock,
        out_of_stock=out_of_stock,
        search=search,
    )
    return {
        "items": [view(x) for x in rows[(p - 1) * s : p * s]],
        "page": p,
        "page_size": s,
        "total": len(rows),
    }


@router.get("/{product_id}", response_model=InventoryProductSummary, summary="Inventory across locations for a product")
def product_inventory(product_id: UUID, db: Session = Depends(db_session)):
    try:
        product, rows = service.product_summary(db, product_id)
        items = [view(x) for x in rows]
        return {
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "locations": items,
            "total_on_hand": sum((x["on_hand"] for x in items), Decimal("0")),
            "total_reserved": sum((x["reserved"] for x in items), Decimal("0")),
            "total_free_to_use": sum((x["free_to_use"] for x in items), Decimal("0")),
        }
    except Exception as e:
        error(e)
