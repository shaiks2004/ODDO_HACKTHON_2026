"""SQLAlchemy 2.x mappings for the existing StockSense PostgreSQL schema."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.utils.enums import MovementType, OperationStatus, UnitOfMeasure, UserRole

def uuid_pk(): return mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
def created_at_col(): return mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
def updated_at_col(): return mapped_column(DateTime(timezone=True), nullable=False, server_default=text("now()"))


class User(Base):
    __tablename__ = "users"
    id: Mapped[UUID] = uuid_pk(); name: Mapped[str] = mapped_column(String(150)); email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(Text); role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role", native_enum=True))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true")); created_at: Mapped[datetime] = created_at_col(); updated_at: Mapped[datetime] = updated_at_col()
    otp_codes: Mapped[list[OtpCode]] = relationship(back_populates="user")
    receipts: Mapped[list[Receipt]] = relationship(back_populates="creator")
    deliveries: Mapped[list[Delivery]] = relationship(back_populates="creator")
    transfers: Mapped[list[Transfer]] = relationship(back_populates="creator")
    adjustments: Mapped[list[Adjustment]] = relationship(back_populates="creator")
    ledger_entries: Mapped[list[StockLedger]] = relationship(back_populates="creator")


class OtpCode(Base):
    __tablename__ = "otp_codes"
    id: Mapped[UUID] = uuid_pk(); user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id")); otp_code: Mapped[str] = mapped_column(String(20))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True)); is_used: Mapped[bool] = mapped_column(Boolean, server_default=text("false")); created_at: Mapped[datetime] = created_at_col()
    user: Mapped[User] = relationship(back_populates="otp_codes")


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[UUID] = uuid_pk(); name: Mapped[str] = mapped_column(String(100), unique=True); description: Mapped[Optional[str]] = mapped_column(Text); created_at: Mapped[datetime] = created_at_col()
    products: Mapped[list[Product]] = relationship(back_populates="category")


class Warehouse(Base):
    __tablename__ = "warehouses"
    id: Mapped[UUID] = uuid_pk(); name: Mapped[str] = mapped_column(String(150)); code: Mapped[str] = mapped_column(String(50), unique=True); address: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true")); created_at: Mapped[datetime] = created_at_col(); updated_at: Mapped[datetime] = updated_at_col()
    locations: Mapped[list[Location]] = relationship(back_populates="warehouse")


class Location(Base):
    __tablename__ = "locations"; __table_args__ = (UniqueConstraint("warehouse_id", "code"),)
    id: Mapped[UUID] = uuid_pk(); warehouse_id: Mapped[UUID] = mapped_column(ForeignKey("warehouses.id")); name: Mapped[str] = mapped_column(String(150)); code: Mapped[str] = mapped_column(String(80))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true")); created_at: Mapped[datetime] = created_at_col()
    warehouse: Mapped[Warehouse] = relationship(back_populates="locations"); inventory_records: Mapped[list[Inventory]] = relationship(back_populates="location")
    receipt_destinations: Mapped[list[Receipt]] = relationship(back_populates="destination_location")
    delivery_sources: Mapped[list[Delivery]] = relationship(back_populates="source_location")
    transfer_sources: Mapped[list[Transfer]] = relationship(back_populates="source_location", foreign_keys="Transfer.source_location_id")
    transfer_destinations: Mapped[list[Transfer]] = relationship(back_populates="destination_location", foreign_keys="Transfer.destination_location_id")


class Product(Base):
    __tablename__ = "products"
    id: Mapped[UUID] = uuid_pk(); name: Mapped[str] = mapped_column(String(200)); sku: Mapped[str] = mapped_column(String(100), unique=True); category_id: Mapped[UUID] = mapped_column(ForeignKey("categories.id"))
    unit_of_measure: Mapped[UnitOfMeasure] = mapped_column(Enum(UnitOfMeasure, name="unit_of_measure", native_enum=True)); unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), server_default=text("0"))
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(14, 3), server_default=text("0")); reorder_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), server_default=text("0")); barcode: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true")); created_at: Mapped[datetime] = created_at_col(); updated_at: Mapped[datetime] = updated_at_col()
    category: Mapped[Category] = relationship(back_populates="products"); inventory_records: Mapped[list[Inventory]] = relationship(back_populates="product")
    receipt_items: Mapped[list[ReceiptItem]] = relationship(back_populates="product"); delivery_items: Mapped[list[DeliveryItem]] = relationship(back_populates="product"); transfer_items: Mapped[list[TransferItem]] = relationship(back_populates="product")
    adjustments: Mapped[list[Adjustment]] = relationship(back_populates="product"); ledger_entries: Mapped[list[StockLedger]] = relationship(back_populates="product")


class Inventory(Base):
    __tablename__ = "inventory"; __table_args__ = (UniqueConstraint("product_id", "location_id"),)
    id: Mapped[UUID] = uuid_pk(); product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id")); location_id: Mapped[UUID] = mapped_column(ForeignKey("locations.id"))
    on_hand: Mapped[Decimal] = mapped_column(Numeric(14, 3), server_default=text("0")); reserved: Mapped[Decimal] = mapped_column(Numeric(14, 3), server_default=text("0")); created_at: Mapped[datetime] = created_at_col(); updated_at: Mapped[datetime] = updated_at_col()
    product: Mapped[Product] = relationship(back_populates="inventory_records"); location: Mapped[Location] = relationship(back_populates="inventory_records")


class Receipt(Base):
    __tablename__ = "receipts"
    id: Mapped[UUID] = uuid_pk(); reference: Mapped[str] = mapped_column(String(50), unique=True); supplier_name: Mapped[str] = mapped_column(String(200)); destination_location_id: Mapped[UUID] = mapped_column(ForeignKey("locations.id"))
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True)); status: Mapped[OperationStatus] = mapped_column(Enum(OperationStatus, name="operation_status", native_enum=True), server_default=text("'DRAFT'")); created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id")); created_at: Mapped[datetime] = created_at_col(); updated_at: Mapped[datetime] = updated_at_col()
    destination_location: Mapped[Location] = relationship(back_populates="receipt_destinations"); creator: Mapped[User] = relationship(back_populates="receipts"); items: Mapped[list[ReceiptItem]] = relationship(back_populates="receipt", cascade="all, delete-orphan")


class ReceiptItem(Base):
    __tablename__ = "receipt_items"; __table_args__ = (UniqueConstraint("receipt_id", "product_id"),)
    id: Mapped[UUID] = uuid_pk(); receipt_id: Mapped[UUID] = mapped_column(ForeignKey("receipts.id", ondelete="CASCADE")); product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id")); quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3)); created_at: Mapped[datetime] = created_at_col()
    receipt: Mapped[Receipt] = relationship(back_populates="items"); product: Mapped[Product] = relationship(back_populates="receipt_items")


class Delivery(Base):
    __tablename__ = "deliveries"
    id: Mapped[UUID] = uuid_pk(); reference: Mapped[str] = mapped_column(String(50), unique=True); customer_name: Mapped[str] = mapped_column(String(200)); source_location_id: Mapped[UUID] = mapped_column(ForeignKey("locations.id"))
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True)); status: Mapped[OperationStatus] = mapped_column(Enum(OperationStatus, name="operation_status", native_enum=True), server_default=text("'DRAFT'")); created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id")); created_at: Mapped[datetime] = created_at_col(); updated_at: Mapped[datetime] = updated_at_col()
    source_location: Mapped[Location] = relationship(back_populates="delivery_sources"); creator: Mapped[User] = relationship(back_populates="deliveries"); items: Mapped[list[DeliveryItem]] = relationship(back_populates="delivery", cascade="all, delete-orphan")


class DeliveryItem(Base):
    __tablename__ = "delivery_items"; __table_args__ = (UniqueConstraint("delivery_id", "product_id"),)
    id: Mapped[UUID] = uuid_pk(); delivery_id: Mapped[UUID] = mapped_column(ForeignKey("deliveries.id", ondelete="CASCADE")); product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id")); quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3)); created_at: Mapped[datetime] = created_at_col()
    delivery: Mapped[Delivery] = relationship(back_populates="items"); product: Mapped[Product] = relationship(back_populates="delivery_items")


class Transfer(Base):
    __tablename__ = "transfers"
    id: Mapped[UUID] = uuid_pk(); reference: Mapped[str] = mapped_column(String(50), unique=True); source_location_id: Mapped[UUID] = mapped_column(ForeignKey("locations.id")); destination_location_id: Mapped[UUID] = mapped_column(ForeignKey("locations.id"))
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True)); status: Mapped[OperationStatus] = mapped_column(Enum(OperationStatus, name="operation_status", native_enum=True), server_default=text("'DRAFT'")); created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id")); created_at: Mapped[datetime] = created_at_col(); updated_at: Mapped[datetime] = updated_at_col()
    source_location: Mapped[Location] = relationship(back_populates="transfer_sources", foreign_keys=[source_location_id]); destination_location: Mapped[Location] = relationship(back_populates="transfer_destinations", foreign_keys=[destination_location_id]); creator: Mapped[User] = relationship(back_populates="transfers"); items: Mapped[list[TransferItem]] = relationship(back_populates="transfer", cascade="all, delete-orphan")


class TransferItem(Base):
    __tablename__ = "transfer_items"; __table_args__ = (UniqueConstraint("transfer_id", "product_id"),)
    id: Mapped[UUID] = uuid_pk(); transfer_id: Mapped[UUID] = mapped_column(ForeignKey("transfers.id", ondelete="CASCADE")); product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id")); quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3)); created_at: Mapped[datetime] = created_at_col()
    transfer: Mapped[Transfer] = relationship(back_populates="items"); product: Mapped[Product] = relationship(back_populates="transfer_items")


class Adjustment(Base):
    __tablename__ = "adjustments"
    id: Mapped[UUID] = uuid_pk(); reference: Mapped[str] = mapped_column(String(50), unique=True); product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id")); location_id: Mapped[UUID] = mapped_column(ForeignKey("locations.id")); system_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3)); physical_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3)); difference: Mapped[Decimal] = mapped_column(Numeric(14, 3)); reason: Mapped[str] = mapped_column(Text); status: Mapped[OperationStatus] = mapped_column(Enum(OperationStatus, name="operation_status", native_enum=True), server_default=text("'DRAFT'")); created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id")); created_at: Mapped[datetime] = created_at_col(); updated_at: Mapped[datetime] = updated_at_col()
    product: Mapped[Product] = relationship(back_populates="adjustments"); location: Mapped[Location] = relationship(); creator: Mapped[User] = relationship(back_populates="adjustments")


class StockLedger(Base):
    __tablename__ = "stock_ledger"
    id: Mapped[UUID] = uuid_pk(); product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id")); source_location_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("locations.id")); destination_location_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("locations.id")); movement_type: Mapped[MovementType] = mapped_column(Enum(MovementType, name="movement_type", native_enum=True)); quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3)); reference_type: Mapped[str] = mapped_column(String(50)); reference_id: Mapped[Optional[UUID]] = mapped_column(PG_UUID(as_uuid=True)); created_by: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id")); created_at: Mapped[datetime] = created_at_col()
    product: Mapped[Product] = relationship(back_populates="ledger_entries"); source_location: Mapped[Optional[Location]] = relationship(foreign_keys=[source_location_id]); destination_location: Mapped[Optional[Location]] = relationship(foreign_keys=[destination_location_id]); creator: Mapped[Optional[User]] = relationship(back_populates="ledger_entries")
