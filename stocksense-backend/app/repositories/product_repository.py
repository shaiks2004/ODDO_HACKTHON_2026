from sqlalchemy import func, or_, select
from sqlalchemy.orm import joinedload
from app.models import Product
class ProductRepository:
 def get(self,db,id): return db.scalar(select(Product).options(joinedload(Product.category)).where(Product.id==id))
 def list(self,db,page,size,search=None,category_id=None,is_active=None):
  q=select(Product).options(joinedload(Product.category))
  if search:q=q.where(or_(Product.name.ilike(f"%{search}%"),Product.sku.ilike(f"%{search}%"),Product.barcode.ilike(f"%{search}%")))
  if category_id:q=q.where(Product.category_id==category_id)
  if is_active is not None:q=q.where(Product.is_active==is_active)
  return list(db.scalars(q.order_by(Product.sku).offset((page-1)*size).limit(size))),db.scalar(select(func.count()).select_from(q.subquery())) or 0
 def sku_exists(self,db,sku,exclude=None):return db.scalar(select(Product.id).where(Product.sku==sku,Product.id != exclude if exclude else True)) is not None
 def create(self,db,data):x=Product(**data);db.add(x);return x
