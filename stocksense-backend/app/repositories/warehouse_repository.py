from sqlalchemy import func, or_, select
from app.models import Warehouse
class WarehouseRepository:
 def get(self,db,id):return db.get(Warehouse,id)
 def list(self,db,page,size,search=None,is_active=None):
  q=select(Warehouse)
  if search:q=q.where(or_(Warehouse.name.ilike(f"%{search}%"),Warehouse.code.ilike(f"%{search}%")))
  if is_active is not None:q=q.where(Warehouse.is_active==is_active)
  return list(db.scalars(q.order_by(Warehouse.code).offset((page-1)*size).limit(size))),db.scalar(select(func.count()).select_from(q.subquery())) or 0
 def code_exists(self,db,code,exclude=None):return db.scalar(select(Warehouse.id).where(Warehouse.code==code,Warehouse.id != exclude if exclude else True)) is not None
 def create(self,db,data):x=Warehouse(**data);db.add(x);return x
