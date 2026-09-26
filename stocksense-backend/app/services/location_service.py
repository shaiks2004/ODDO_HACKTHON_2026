from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.models import Warehouse
from app.repositories.location_repository import LocationRepository
class LocationService:
 def __init__(self):self.repo=LocationRepository()
 def get(self,db,id):
  x=self.repo.get(db,id)
  if not x:raise ResourceNotFoundError('Location not found')
  return x
 def create(self,db,data):
  if not db.get(Warehouse,data['warehouse_id']):raise ResourceNotFoundError('Warehouse not found')
  if self.repo.code_exists(db,data['warehouse_id'],data['code']):raise ConflictError(f"Location code '{data['code']}' already exists in this warehouse")
  return self.repo.create(db,data)
 def update(self,db,id,data):
  x=self.get(db,id)
  if 'code' in data and self.repo.code_exists(db,x.warehouse_id,data['code'],id):raise ConflictError(f"Location code '{data['code']}' already exists in this warehouse")
  for k,v in data.items():setattr(x,k,v)
  return x
