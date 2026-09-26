from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.auth_dependencies import require_role
from app.api.v1.dependencies import db_session, error
from app.models import User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService
from app.utils.enums import UserRole
from app.utils.pagination import Page, pagination

router = APIRouter(prefix="/products", tags=["Products"])
service = ProductService()


@router.get("", response_model=Page[ProductResponse], summary="List products")
def list_products(
    search: str | None = None,
    category_id: UUID | None = None,
    is_active: bool | None = None,
    page_data: tuple[int, int] = Depends(pagination),
    db: Session = Depends(db_session),
):
    p, s = page_data
    items, total = service.repo.list(db, p, s, search, category_id, is_active)
    return {"items": items, "page": p, "page_size": s, "total": total}


@router.get("/{product_id}", response_model=ProductResponse, summary="Get product")
def get_product(product_id: UUID, db: Session = Depends(db_session)):
    try:
        return service.get(db, product_id)
    except Exception as e:
        error(e)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Create product")
def create_product(
    payload: ProductCreate,
    db: Session = Depends(db_session),
    _user: User = Depends(require_role(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)),
):
    try:
        x = service.create(db, payload.model_dump())
        db.commit()
        db.refresh(x)
        return x
    except Exception as e:
        db.rollback()
        error(e)


@router.patch("/{product_id}", response_model=ProductResponse, summary="Update product")
def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    db: Session = Depends(db_session),
    _user: User = Depends(require_role(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)),
):
    try:
        x = service.update(db, product_id, payload.model_dump(exclude_unset=True))
        db.commit()
        db.refresh(x)
        return x
    except Exception as e:
        db.rollback()
        error(e)
