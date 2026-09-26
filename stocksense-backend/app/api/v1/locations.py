from uuid import UUID
from fastapi import APIRouter,Depends,status
from sqlalchemy.orm import Session
from app.api.v1.dependencies import db_session,error
from app.schemas.location import LocationCreate,LocationResponse,LocationUpdate
from app.services.location_service import LocationService
from app.utils.pagination import Page,pagination
router=APIRouter(prefix='/locations',tags=['Locations']);service=LocationService()
@router.get('',response_model=Page[LocationResponse],summary='List locations')
def list_locations(search:str|None=None,warehouse_id:UUID|None=None,is_active:bool|None=None,page_data:tuple[int,int]=Depends(pagination),db:Session=Depends(db_session)):
 p,s=page_data;items,total=service.repo.list(db,p,s,search,warehouse_id,is_active);return {'items':items,'page':p,'page_size':s,'total':total}
@router.get('/{location_id}',response_model=LocationResponse,summary='Get location')
def get_location(location_id:UUID,db:Session=Depends(db_session)):
 try:return service.get(db,location_id)
 except Exception as e:error(e)
@router.post('',response_model=LocationResponse,status_code=status.HTTP_201_CREATED,summary='Create location')
def create_location(payload:LocationCreate,db:Session=Depends(db_session)):
 try:x=service.create(db,payload.model_dump());db.commit();db.refresh(x);return x
 except Exception as e:db.rollback();error(e)
@router.patch('/{location_id}',response_model=LocationResponse,summary='Update location')
def update_location(location_id:UUID,payload:LocationUpdate,db:Session=Depends(db_session)):
 try:x=service.update(db,location_id,payload.model_dump(exclude_unset=True));db.commit();db.refresh(x);return x
 except Exception as e:db.rollback();error(e)
