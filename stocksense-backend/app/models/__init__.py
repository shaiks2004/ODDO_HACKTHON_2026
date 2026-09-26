"""SQLAlchemy mappings for the existing database; importing registers all models."""
from app.models.all_models import Adjustment, Category, Delivery, DeliveryItem, Inventory, Location, OtpCode, Product, Receipt, ReceiptItem, StockLedger, Transfer, TransferItem, User, Warehouse

__all__ = ["Adjustment", "Category", "Delivery", "DeliveryItem", "Inventory", "Location", "OtpCode", "Product", "Receipt", "ReceiptItem", "StockLedger", "Transfer", "TransferItem", "User", "Warehouse"]
