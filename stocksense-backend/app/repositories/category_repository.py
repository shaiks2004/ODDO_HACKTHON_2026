from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models import Category

class CategoryRepository:
    def get(self, db, id): return db.get(Category, id)
    def list(self, db, page, size, search=None):
        q = select(Category)
        if search: q = q.where(Category.name.ilike(f"%{search}%"))
        return list(db.scalars(q.order_by(Category.name).offset((page-1)*size).limit(size))), db.scalar(select(func.count()).select_from(q.subquery())) or 0
    def exists(self, db, name, exclude=None): return db.scalar(select(Category.id).where(func.lower(Category.name)==name.lower(), Category.id != exclude if exclude else True)) is not None
    def create(self, db, data): x=Category(**data); db.add(x); return x
