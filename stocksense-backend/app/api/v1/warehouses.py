from uuid import UUID
from fastapi import APIRouter,Depends,status
from sqlalchemy.orm import Session
from app.api.v1.dependencies import db_session,error
from app.schemas.warehouse import WarehouseCreate,WarehouseResponse,WarehouseUpdate
from app.services.warehouse_service import WarehouseService
from app.utils.pagination import Page,pagination
router=APIRouter(prefix='/warehouses',tags=['Warehouses']);service=WarehouseService()
@router.get('',response_model=Page[WarehouseResponse],summary='List warehouses')
def list_warehouses(search:str|None=None,is_active:bool|None=None,page_data:tuple[int,int]=Depends(pagination),db:Session=Depends(db_session)):
 p,s=page_data;items,total=service.repo.list(db,p,s,search,is_active);return {'items':items,'page':p,'page_size':s,'total':total}
@router.get('/{warehouse_id}',response_model=WarehouseResponse,summary='Get warehouse')
def get_warehouse(warehouse_id:UUID,db:Session=Depends(db_session)):
 try:return service.get(db,warehouse_id)
 except Exception as e:error(e)
@router.post('',response_model=WarehouseResponse,status_code=status.HTTP_201_CREATED,summary='Create warehouse')
def create_warehouse(payload:WarehouseCreate,db:Session=Depends(db_session)):
 try:x=service.create(db,payload.model_dump());db.commit();db.refresh(x);return x
 except Exception as e:db.rollback();error(e)
@router.patch('/{warehouse_id}',response_model=WarehouseResponse,summary='Update warehouse')
def update_warehouse(warehouse_id:UUID,payload:WarehouseUpdate,db:Session=Depends(db_session)):
 try:x=service.update(db,warehouse_id,payload.model_dump(exclude_unset=True));db.commit();db.refresh(x);return x
 except Exception as e:db.rollback();error(e)
