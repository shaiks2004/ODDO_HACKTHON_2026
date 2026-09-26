from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.repositories.category_repository import CategoryRepository
class CategoryService:
 def __init__(self):self.repo=CategoryRepository()
 def get(self,db,id):
  x=self.repo.get(db,id)
  if not x:raise ResourceNotFoundError('Category not found')
  return x
 def create(self,db,data):
  if self.repo.exists(db,data['name']):raise ConflictError(f"Category '{data['name']}' already exists")
  return self.repo.create(db,data)
 def update(self,db,id,data):
  x=self.get(db,id)
  if 'name' in data and self.repo.exists(db,data['name'],id):raise ConflictError(f"Category '{data['name']}' already exists")
  for k,v in data.items():setattr(x,k,v)
  return x
