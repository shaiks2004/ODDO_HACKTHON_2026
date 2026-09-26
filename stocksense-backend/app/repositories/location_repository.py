from sqlalchemy import func, or_, select
from sqlalchemy.orm import joinedload
from app.models import Location
class LocationRepository:
 def get(self,db,id):return db.scalar(select(Location).options(joinedload(Location.warehouse)).where(Location.id==id))
 def list(self,db,page,size,search=None,warehouse_id=None,is_active=None):
  q=select(Location).options(joinedload(Location.warehouse))
  if search:q=q.where(or_(Location.name.ilike(f"%{search}%"),Location.code.ilike(f"%{search}%")))
  if warehouse_id:q=q.where(Location.warehouse_id==warehouse_id)
  if is_active is not None:q=q.where(Location.is_active==is_active)
  return list(db.scalars(q.order_by(Location.code).offset((page-1)*size).limit(size))),db.scalar(select(func.count()).select_from(q.subquery())) or 0
 def code_exists(self,db,warehouse_id,code,exclude=None):return db.scalar(select(Location.id).where(Location.warehouse_id==warehouse_id,Location.code==code,Location.id != exclude if exclude else True)) is not None
 def create(self,db,data):x=Location(**data);db.add(x);return x
