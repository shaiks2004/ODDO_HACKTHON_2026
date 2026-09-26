from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.authorization import require_inventory_management
from app.api.v1.dependencies import db_session, error
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import CategoryService
from app.utils.pagination import Page, pagination
router=APIRouter(prefix='/categories',tags=['Categories']); service=CategoryService()
@router.get('',response_model=Page[CategoryResponse],summary='List categories')
def list_categories(search:str|None=None, page_data:tuple[int,int]=Depends(pagination), db:Session=Depends(db_session)):
 p,s=page_data; items,total=service.repo.list(db,p,s,search); return {'items':items,'page':p,'page_size':s,'total':total}
@router.get('/{category_id}',response_model=CategoryResponse,summary='Get category')
def get_category(category_id:UUID,db:Session=Depends(db_session)):
 try:return service.get(db,category_id)
 except Exception as e:error(e)
@router.post('',response_model=CategoryResponse,status_code=status.HTTP_201_CREATED,summary='Create category',dependencies=[Depends(require_inventory_management)])
def create_category(payload:CategoryCreate,db:Session=Depends(db_session)):
 try:
  x=service.create(db,payload.model_dump());db.commit();db.refresh(x);return x
 except Exception as e:db.rollback();error(e)
@router.patch('/{category_id}',response_model=CategoryResponse,summary='Update category',dependencies=[Depends(require_inventory_management)])
def update_category(category_id:UUID,payload:CategoryUpdate,db:Session=Depends(db_session)):
 try:
  x=service.update(db,category_id,payload.model_dump(exclude_unset=True));db.commit();db.refresh(x);return x
 except Exception as e:db.rollback();error(e)
