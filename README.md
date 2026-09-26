
# 📦 StockSense

### Enterprise Multi-Location Inventory Management System

> **StockSense** is a full-stack Inventory Management System designed to provide real-time visibility, controlled stock movement, multi-warehouse management, inventory auditing, reporting, and secure role-based access.

StockSense follows an **ERP-style architecture** where the backend acts as the single source of truth for inventory, reservations, stock movements, ledger history, and operational state transitions.

---

## 🚀 Overview

StockSense solves the core problems faced by organizations managing inventory across multiple warehouses and storage locations.

It provides:

- 🔐 Secure authentication with OTP verification
- 👥 Role-Based Access Control
- 📦 Product & category management
- 🏭 Multi-warehouse management
- 📍 Multi-location inventory
- 📥 Incoming receipts
- 📤 Outgoing deliveries
- 🔄 Internal stock transfers
- 🧮 Stock adjustments
- 📊 Real-time inventory dashboard
- 📒 Immutable stock ledger
- 🚨 Low-stock & out-of-stock alerts
- 📈 Inventory analytics & reports
- 📄 Printable warehouse documents
- 📥 CSV report exports
- 🔄 Refresh-token rotation
- 🛡️ Authentication rate limiting
- 📱 Responsive SaaS-style frontend

---

# 🏗️ System Architecture

StockSense follows a **modular full-stack architecture**:

```mermaid
flowchart TB

    USER["👤 User"]

    FE["🖥️ React + TypeScript Frontend
    Vite
    Responsive SaaS UI"]

    AUTH["🔐 Authentication Layer
    JWT
    OTP
    Refresh Tokens
    Rate Limiting"]

    API["⚡ FastAPI REST API
    /api/v1"]

    RBAC["🛡️ RBAC & Authorization
    ADMIN
    INVENTORY_MANAGER
    WAREHOUSE_STAFF"]

    SERVICES["⚙️ Service Layer
    Business Logic
    Validation
    Workflows"]

    REPOS["🗂️ Repository Layer
    Database Queries"]

    DB[("🐘 PostgreSQL
    Oddo_Hackthon")]

    LEDGER["📒 Stock Ledger
    Immutable Movement Audit"]

    REPORTS["📊 Reporting Engine
    Valuation
    Movement
    Slow Moving"]

    CSV["📥 CSV Export"]

    ALERTS["🚨 Alert Engine
    Low Stock
    Out of Stock"]

    PRINT["📄 Printable Documents
    Receipt
    Delivery"]

    USER --> FE
    FE --> AUTH
    FE --> API

    API --> RBAC
    API --> SERVICES

    SERVICES --> REPOS
    REPOS --> DB

    SERVICES --> LEDGER
    SERVICES --> REPORTS
    SERVICES --> ALERTS
    SERVICES --> PRINT

    REPORTS --> DB
    REPORTS --> CSV

    DB --> SERVICES
    SERVICES --> API
    API --> FE
