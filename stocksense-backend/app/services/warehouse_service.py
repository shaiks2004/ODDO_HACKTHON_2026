from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.repositories.warehouse_repository import WarehouseRepository
class WarehouseService:
 def __init__(self):self.repo=WarehouseRepository()
 def get(self,db,id):
  x=self.repo.get(db,id)
  if not x:raise ResourceNotFoundError('Warehouse not found')
  return x
 def create(self,db,data):
  if self.repo.code_exists(db,data['code']):raise ConflictError(f"Warehouse code '{data['code']}' already exists")
  return self.repo.create(db,data)
 def update(self,db,id,data):
  x=self.get(db,id)
  for k,v in data.items():setattr(x,k,v)
  return x
