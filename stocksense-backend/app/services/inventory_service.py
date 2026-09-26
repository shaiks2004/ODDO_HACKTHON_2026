from app.core.exceptions import ResourceNotFoundError
from app.models import Product
from app.repositories.inventory_repository import InventoryRepository
class InventoryService:
 def __init__(self):self.repo=InventoryRepository()
 def list(self,db,**filters):return self.repo.rows(db,**filters)
 def page(self,db,page,page_size,**filters):return self.repo.page_rows(db,page,page_size,**filters)
 def product_summary(self,db,product_id):
  product=db.get(Product,product_id)
  if not product:raise ResourceNotFoundError('Product not found')
  return product,self.repo.rows(db,product_id=product_id)
