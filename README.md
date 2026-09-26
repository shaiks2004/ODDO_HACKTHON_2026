# StockSense — Enterprise Inventory Management System

> **Smart Inventory. Simple Operations.**

StockSense is an enterprise-grade Inventory & Warehouse Management System (ERP) frontend built with React, TypeScript, Tailwind CSS, and React Router.

It features an **authentication-first routing architecture**, high-density operational workbenches for inbound receipts, outbound customer deliveries, internal stock relocations, multi-facility rack mapping, and a traceable audit ledger.

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│                   React UI Layer                       │
│    (Pages: Dashboard, Stock, Receipts, Delivery, etc.) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                Hooks & Context Layer                   │
│         (useAuth, useStock, useWarehouses, etc.)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Services Layer                      │
│     (authService, stockService, receiptService, etc.)  │
└───────────────────────────┬────────────────────────────┘
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
   ┌───────────────────┐         ┌───────────────────┐
   │ Mock Data / Local │         │    Backend API    │
   │   Storage Cache   │         │ (FastAPI, Express,│
   │(VITE_DATA_SOURCE= │         │ Django, Go, etc.) │
   │      "mock")      │         │(VITE_DATA_SOURCE= │
   │                   │         │      "api")       │
   └───────────────────┘         └───────────────────┘
```

The frontend is architected so the backend engineering team can connect a real REST API **without rewriting any UI components**.

---

## Authentication Flow

Every user session begins at the authentication gate:

```text
User opens application
        │
        ▼
        /
        │
   [Auth Check]
   ┌────┴───────────────────────────┐
   │                                │
Unauthenticated                 Authenticated
   │                                │
   ▼                                ▼
 /login                         /dashboard
```

- **Unauthenticated access**: Any attempt to access protected routes (`/dashboard`, `/stock`, `/warehouse`, `/location`, `/receipts`, `/delivery`, `/move-history`, `/settings`, `/profile`) is immediately intercepted and redirected to `/login`.
- **Public routes**: `/login`, `/register`.
- **Session storage**: Handled in `src/lib/storage.ts` using JWT/Bearer tokens and user session records.
- **Logout**: Clears the session token and redirects directly to `/login`.

---

## Backend Integration Guide

Connecting your backend API requires **zero UI rewrites**. Follow these 5 steps:

### 1. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:8000
```

| Variable | Default | Options | Description |
|---|---|---|---|
| `VITE_DATA_SOURCE` | `mock` | `mock` \| `api` | Switch between local mock state and backend REST API |
| `VITE_API_BASE_URL` | `http://localhost:8000` | URL string | Base URL of your backend server |

### 2. Expected REST Endpoints

Your backend should implement the following endpoints (all secured with `Authorization: Bearer <token>` except `/auth/*`):

#### Authentication
- `POST /auth/login` — Body: `{ email, password }` → Returns: `{ user, token }`
- `POST /auth/register` — Body: `{ name, email, password }` → Returns: `{ user, token }`
- `POST /auth/logout` — Header: `Bearer <token>` → Returns: `204 No Content`

#### Stock & Products
- `GET /products` — Returns: `Product[]`
- `GET /products/:id` — Returns: `Product`
- `POST /products` — Body: `CreateProductDTO` → Returns: `Product`
- `PUT /products/:id` — Body: `UpdateProductDTO` → Returns: `Product`
- `DELETE /products/:id` — Returns: `204 No Content`
- `POST /stock/transfer` — Body: `{ productId, fromWarehouse, fromLocation, toWarehouse, toLocation, quantity, notes }` → Returns: `{ success, message }`

#### Warehouses & Locations
- `GET /warehouses` — Returns: `Warehouse[]`
- `POST /warehouses` — Body: `CreateWarehouseDTO` → Returns: `Warehouse`
- `PUT /warehouses/:id` — Body: `UpdateWarehouseDTO` → Returns: `Warehouse`
- `DELETE /warehouses/:id` — Returns: `204 No Content`
- `GET /locations` — Returns: `Location[]`
- `POST /locations` — Body: `CreateLocationDTO` → Returns: `Location`
- `PUT /locations/:id` — Body: `UpdateLocationDTO` → Returns: `Location`
- `DELETE /locations/:id` — Returns: `204 No Content`

#### Receipts (Inbound Operations)
- `GET /receipts` — Returns: `Receipt[]`
- `POST /receipts` — Body: `CreateReceiptDTO` → Returns: `Receipt`
- `PUT /receipts/:id` — Body: `UpdateReceiptDTO` → Returns: `Receipt`
- `POST /receipts/:id/validate` — Increases physical stock balances → Returns: `{ success, message }`
- `POST /receipts/:id/cancel` — Returns: `Receipt`

#### Deliveries (Outbound Operations)
- `GET /deliveries` — Returns: `Delivery[]`
- `POST /deliveries` — Body: `CreateDeliveryDTO` → Returns: `Delivery`
- `PUT /deliveries/:id` — Body: `UpdateDeliveryDTO` → Returns: `Delivery`
- `POST /deliveries/:id/validate` — Decreases physical stock balances (validates stock availability) → Returns: `{ success, message }`
- `POST /deliveries/:id/cancel` — Returns: `Delivery`

#### Movement History
- `GET /movements` — Returns: `MoveHistoryEntry[]`
- `POST /movements` — Body: `Omit<MoveHistoryEntry, 'id'>` → Returns: `MoveHistoryEntry`

### 3. Centralized API Client

All HTTP requests automatically pass through `src/lib/apiClient.ts`. It handles:
- Authorization header injection (`Bearer <token>`)
- JSON request and response serialization
- Typed error handling (`ApiError`)

### 4. Removing / Replacing Mock Data

When you are ready to remove the mock datasets entirely:
1. Set `VITE_DATA_SOURCE=api`
2. Remove or archive the `src/data/mock/` folder
3. The UI components will continue running without modifications because they consume hooks and services, never mock data arrays directly!

---

## Directory Structure

```text
src/
├── config/
│   └── dataSource.ts          # Central data source configuration (mock vs api)
├── lib/
│   ├── apiClient.ts           # Central HTTP client with auth token injection
│   └── storage.ts             # Isolated browser storage abstraction
├── types/
│   ├── auth.ts                # User, session, and credential types
│   ├── product.ts             # Product & stock unit types
│   ├── stock.ts               # Stock transfer and balance models
│   ├── warehouse.ts           # Facility and warehouse models
│   ├── location.ts            # Rack, bay, and sub-location models
│   ├── receipt.ts             # Inbound goods receipt models
│   ├── delivery.ts            # Outbound delivery models
│   ├── movement.ts            # Audit trail and ledger models
│   └── index.ts               # Unified type exports
├── data/
│   └── mock/                  # ALL dummy data strictly centralized here
│       ├── products.ts
│       ├── warehouses.ts
│       ├── locations.ts
│       ├── stock.ts
│       ├── receipts.ts
│       ├── deliveries.ts
│       ├── movements.ts
│       ├── users.ts
│       └── index.ts
├── services/                  # Clean service layer (API / Mock abstraction)
│   ├── auth/authService.ts
│   ├── stock/stockService.ts
│   ├── warehouse/warehouseService.ts
│   ├── location/locationService.ts
│   ├── receipts/receiptService.ts
│   ├── delivery/deliveryService.ts
│   ├── movements/movementService.ts
│   └── index.ts
├── context/
│   ├── AuthContext.tsx        # Pure session and auth state
│   └── InventoryContext.tsx   # Domain state connected to services
├── hooks/
│   ├── useAuth.ts
│   ├── useStock.ts
│   ├── useWarehouses.ts
│   ├── useLocations.ts
│   ├── useReceipts.ts
│   ├── useDeliveries.ts
│   ├── useMovements.ts
│   └── index.ts
├── routes/
│   ├── ProtectedRoute.tsx     # Route protection guard
│   ├── PublicRoute.tsx        # Guest-only route guard
│   ├── AuthRedirect.tsx       # Root (/) smart redirector
│   └── AppRoutes.tsx          # Central application routing table
├── components/
│   ├── common/                # KpiCard, StatusBadge, PageHeader, Modal, etc.
│   └── layout/                # Sidebar, Topbar, AppLayout, etc.
├── pages/
│   ├── auth/                  # LoginPage, RegisterPage
│   ├── dashboard/             # Operational Dashboard Cockpit
│   ├── stock/                 # Stock Availability Table & Move Modal
│   ├── warehouse/             # Facilities Hierarchy Management
│   ├── location/              # Sub-location Rack/Bay Management
│   ├── receipts/              # Inbound Shipments & Goods Receipts
│   ├── delivery/              # Outbound Orders & Freight Dispatches
│   ├── ledger/                # Move History & Audit Trail
│   ├── settings/              # System & Development Configuration
│   └── profile/               # Operator Profile & Permissions
├── App.tsx                    # Root provider composition
└── main.tsx                   # Application entry point
```

---

## Development Scripts

```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Run TypeScript checks
npm run lint

# Compile production build
npm run build
```

---

## Resetting Demo Data

During frontend testing, you can reset the prototype demo data at any time via:
- **Settings** → **Development & Data Source** → **Reset Demo Data**
- Or click the **Reset Data** button in the navigation sidebar footer.
