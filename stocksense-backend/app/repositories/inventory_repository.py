from sqlalchemy import select
from app.models import Category, Inventory, Location, Product, Warehouse
class InventoryRepository:
 def rows(self,db,**f):
  q=select(Inventory,Product,Category,Location,Warehouse).select_from(Inventory).join(Product,Inventory.product_id==Product.id).join(Category,Product.category_id==Category.id).join(Location,Inventory.location_id==Location.id).join(Warehouse,Location.warehouse_id==Warehouse.id)
  for key,col in [('product_id',Product.id),('warehouse_id',Warehouse.id),('location_id',Location.id),('category_id',Category.id)]:
   if f.get(key):q=q.where(col==f[key])
  if f.get('low_stock'):q=q.where(Inventory.on_hand>0,Inventory.on_hand<=Product.reorder_level)
  if f.get('out_of_stock'):q=q.where(Inventory.on_hand==0)
  if f.get('search'):q=q.where((Product.name.ilike(f"%{f['search']}%"))|(Product.sku.ilike(f"%{f['search']}%")))
  return list(db.execute(q.order_by(Product.sku,Location.code)).all())
