"""Atomic, service-owned stock movement workflows used by Phase 2 routers."""
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.models import Adjustment, Delivery, DeliveryItem, Inventory, Product, Receipt, ReceiptItem, StockLedger, Transfer, TransferItem, User
from app.utils.enums import MovementType, OperationStatus

class MovementEngine:
 def actor(self,db):
  if not settings.stocksense_system_user_id: raise ConflictError('STOCKSENSE_SYSTEM_USER_ID is not configured')
  user=db.get(User,settings.stocksense_system_user_id)
  if not user: raise ConflictError('Configured system user does not exist')
  return user.id
 def inventory(self,db,product_id,location_id,create=False):
  x=db.scalar(select(Inventory).where(Inventory.product_id==product_id,Inventory.location_id==location_id).with_for_update())
  if not x and create: x=Inventory(product_id=product_id,location_id=location_id,on_hand=Decimal('0'),reserved=Decimal('0'));db.add(x);db.flush()
  return x
 def validate_receipt(self,db,id):
  r=db.scalar(select(Receipt).where(Receipt.id==id).with_for_update())
  if not r:raise ResourceNotFoundError('Receipt not found')
  if r.status==OperationStatus.DONE:raise ConflictError('Receipt is already completed')
  if r.status not in (OperationStatus.DRAFT,OperationStatus.READY):raise ConflictError('Receipt cannot be validated in its current status')
  items=list(db.scalars(select(ReceiptItem).where(ReceiptItem.receipt_id==id)))
  if not items:raise ConflictError('Receipt must contain at least one item')
  actor=self.actor(db)
  for item in items:
   inv=self.inventory(db,item.product_id,r.destination_location_id,True);inv.on_hand+=item.quantity
   db.add(StockLedger(product_id=item.product_id,destination_location_id=r.destination_location_id,movement_type=MovementType.RECEIPT,quantity=item.quantity,reference_type='receipt',reference_id=r.id,created_by=actor))
  r.status=OperationStatus.DONE
 def validate_delivery(self,db,id):
  d=db.scalar(select(Delivery).where(Delivery.id==id).with_for_update())
  if not d:raise ResourceNotFoundError('Delivery not found')
  if d.status==OperationStatus.DONE:raise ConflictError('Delivery is already completed')
  if d.status not in (OperationStatus.DRAFT,OperationStatus.READY,OperationStatus.WAITING):raise ConflictError('Delivery cannot be validated in its current status')
  items=list(db.scalars(select(DeliveryItem).where(DeliveryItem.delivery_id==id)))
  locked=[]
  for i in items:
   inv=self.inventory(db,i.product_id,d.source_location_id)
   if not inv or inv.on_hand-inv.reserved<i.quantity: d.status=OperationStatus.WAITING;raise ConflictError('Insufficient free stock')
   locked.append((i,inv))
  actor=self.actor(db)
  for i,inv in locked: inv.on_hand-=i.quantity;db.add(StockLedger(product_id=i.product_id,source_location_id=d.source_location_id,movement_type=MovementType.DELIVERY,quantity=-i.quantity,reference_type='delivery',reference_id=d.id,created_by=actor))
  d.status=OperationStatus.DONE
 def validate_transfer(self,db,id):
  t=db.scalar(select(Transfer).where(Transfer.id==id).with_for_update())
  if not t:raise ResourceNotFoundError('Transfer not found')
  if t.status==OperationStatus.DONE:raise ConflictError('Transfer is already completed')
  if t.source_location_id==t.destination_location_id:raise ConflictError('Transfer source and destination must be different')
  items=list(db.scalars(select(TransferItem).where(TransferItem.transfer_id==id)));locked=[]
  for i in items:
   src=self.inventory(db,i.product_id,t.source_location_id)
   if not src or src.on_hand-src.reserved<i.quantity:raise ConflictError('Insufficient free stock')
   locked.append((i,src,self.inventory(db,i.product_id,t.destination_location_id,True)))
  actor=self.actor(db)
  for i,s,d in locked:
   s.on_hand-=i.quantity;d.on_hand+=i.quantity;db.add_all([StockLedger(product_id=i.product_id,source_location_id=t.source_location_id,movement_type=MovementType.TRANSFER_OUT,quantity=-i.quantity,reference_type='transfer',reference_id=t.id,created_by=actor),StockLedger(product_id=i.product_id,destination_location_id=t.destination_location_id,movement_type=MovementType.TRANSFER_IN,quantity=i.quantity,reference_type='transfer',reference_id=t.id,created_by=actor)])
  t.status=OperationStatus.DONE
 def validate_adjustment(self,db,id):
  a=db.scalar(select(Adjustment).where(Adjustment.id==id).with_for_update())
  if not a:raise ResourceNotFoundError('Adjustment not found')
  if a.status==OperationStatus.DONE:raise ConflictError('Adjustment is already completed')
  inv=self.inventory(db,a.product_id,a.location_id)
  if not inv or inv.on_hand!=a.system_quantity:raise ConflictError('Inventory changed since this adjustment was created')
  inv.on_hand=a.physical_quantity;a.status=OperationStatus.DONE;kw={'source_location_id':a.location_id} if a.difference<0 else {'destination_location_id':a.location_id};db.add(StockLedger(product_id=a.product_id,movement_type=MovementType.ADJUSTMENT,quantity=a.difference,reference_type='adjustment',reference_id=a.id,created_by=self.actor(db),**kw))
