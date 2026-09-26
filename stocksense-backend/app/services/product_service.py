from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.models import Category
from app.repositories.product_repository import ProductRepository
class ProductService:
 def __init__(self):self.repo=ProductRepository()
 def get(self,db,id):
  x=self.repo.get(db,id)
  if not x:raise ResourceNotFoundError('Product not found')
  return x
 def create(self,db,data):
  if not db.get(Category,data['category_id']):raise ResourceNotFoundError('Category not found')
  if self.repo.sku_exists(db,data['sku']):raise ConflictError(f"Product with SKU '{data['sku']}' already exists")
  return self.repo.create(db,data)
 def update(self,db,id,data):
  x=self.get(db,id)
  if 'category_id' in data and not db.get(Category,data['category_id']):raise ResourceNotFoundError('Category not found')
  if 'sku' in data and self.repo.sku_exists(db,data['sku'],id):raise ConflictError(f"Product with SKU '{data['sku']}' already exists")
  for k,v in data.items():setattr(x,k,v)
  return x
