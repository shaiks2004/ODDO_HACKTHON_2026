from decimal import Decimal
from uuid import UUID
from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.api.v1.dependencies import db_session,error
from app.schemas.inventory_views import InventoryListItem,InventoryProductSummary
from app.services.inventory_service import InventoryService
from app.utils.pagination import Page,pagination
router=APIRouter(prefix='/inventory',tags=['Inventory']);service=InventoryService()
def view(row):
 i,p,c,l,w=row;return {'product_id':p.id,'product_name':p.name,'sku':p.sku,'category_id':c.id,'category_name':c.name,'warehouse_id':w.id,'warehouse_name':w.name,'location_id':l.id,'location_name':l.name,'location_code':l.code,'on_hand':i.on_hand,'reserved':i.reserved,'free_to_use':i.on_hand-i.reserved}
@router.get('',response_model=Page[InventoryListItem],summary='List read-only inventory')
def list_inventory(product_id:UUID|None=None,warehouse_id:UUID|None=None,warehouse_name:str|None=None,warehouse_code:str|None=None,location_id:UUID|None=None,category_id:UUID|None=None,category_name:str|None=None,low_stock:bool=False,out_of_stock:bool=False,active:bool|None=None,min_stock_value:Decimal|None=None,max_stock_value:Decimal|None=None,search:str|None=None,page_data:tuple[int,int]=Depends(pagination),db:Session=Depends(db_session)):
 p,s=page_data;rows,total=service.page(db,p,s,product_id=product_id,warehouse_id=warehouse_id,warehouse_name=warehouse_name,warehouse_code=warehouse_code,location_id=location_id,category_id=category_id,category_name=category_name,low_stock=low_stock,out_of_stock=out_of_stock,active=active,min_stock_value=min_stock_value,max_stock_value=max_stock_value,search=search);return {'items':[view(x) for x in rows],'page':p,'page_size':s,'total':total}
@router.get('/{product_id}',response_model=InventoryProductSummary,summary='Inventory across locations for a product')
def product_inventory(product_id:UUID,db:Session=Depends(db_session)):
 try:
  product,rows=service.product_summary(db,product_id);items=[view(x) for x in rows];return {'product_id':product.id,'product_name':product.name,'sku':product.sku,'locations':items,'total_on_hand':sum((x['on_hand'] for x in items),Decimal('0')),'total_reserved':sum((x['reserved'] for x in items),Decimal('0')),'total_free_to_use':sum((x['free_to_use'] for x in items),Decimal('0'))}
 except Exception as e:error(e)
