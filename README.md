# Warehouse & Supply Chain ERP — Enterprise System

Enterprise Inventory Management, Multi-Warehouse Operations, and Supply Chain ERP system.
Built with **Node.js + Express + MongoDB + Mongoose** on the backend and **React + Vite + Redux + Vanilla CSS** on the frontend.

---

## 1. System Architecture & Tech Stack

- **Backend**:
  - Runtime: Node.js (v18+) & Express
  - Database: MongoDB with Mongoose ODM
  - Authentication: JWT (15-min Access Tokens) + Auto-Rotating Refresh Tokens in MongoDB TTL
  - Scheduling: `node-cron` for 4-hour multi-warehouse low-stock scan & daily overdue purchase monitors
  - Audit Trail: Structured audit logging for all critical operations (omitting secrets)
- **Frontend**:
  - Framework: React 18 + Vite (Vanilla CSS design system, no Tailwind)
  - State Management: Redux Toolkit as single source of truth for Auth
  - HTTP Client: Axios with automatic request interception, token rotation, and 401 retry queue
  - Roles & Permissions: Granular RBAC + UI action gates (`hasPermission`, `hasAnyPermission`)

---

## 2. Environment Configuration

### Backend `.env`
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/inventory_management
JWT_SECRET=super_secret_jwt_key_inventory_erp_2026_enterprise
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env` (`inventory-frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
```

---

## 3. Getting Started & Running Locally

### Backend Setup:
```bash
# In root directory
npm install
node seed.js             # Seeds initial super admin, roles, permissions, warehouses, products
npm run dev              # Starts Express on http://localhost:3000
```

### Frontend Setup:
```bash
# In inventory-frontend directory
cd inventory-frontend
npm install
npm run dev              # Starts Vite on http://localhost:5173
```

### Building for Production:
```bash
cd inventory-frontend
npm run build            # Compiles static bundle to dist/
```

---

## 4. Default Development Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@example.com` | `Admin@123` |

*(Note: Treated strictly as development-only seed credentials. Change immediately in production).*

---

## 5. Multi-Warehouse Inventory Architecture

Inventory is strictly isolated per warehouse using a compound unique index:
```javascript
inventorySchema.index({ warehouse: 1, product: 1 }, { unique: true });
```
- Stock operations (Stock In, Stock Out, Adjustments, Transfers, Reservations, Fulfillments, and Goods Receipts) always require both `product` and `warehouse`.
- Fulfillments deduct exclusively from the designated order fulfillment facility.
- Low-stock cron scans compute Available-to-Promise (`quantity - reservedStock`) independently per warehouse and generate low-stock purchase requests for affected facilities only.

---

## 6. End-to-End Core Workflows

1. **Purchase Workflow**:
   - `Purchase Request` &rarr; Manager Approval &rarr; `Purchase Order` &rarr; Order Approval &rarr; `Goods Receipt (GRN)` &rarr; Warehouse Stock Increment & `StockMovement` (STOCK_IN) & PO Status Update & Audit Log.
2. **Sales & Multi-Warehouse Fulfillment**:
   - `Sales Order` &rarr; Stock Reservation check against facility ATP &rarr; `Order Fulfillment` (atomically decrements `quantity` and `reservedStock`, logs `STOCK_OUT`) &rarr; Auto-generates `Invoice` &rarr; `Delivery Waybill` dispatch.
3. **Inter-Facility Stock Transfers**:
   - `Transfer Request` (Source vs Destination) &rarr; Facility Approval &rarr; Dispatch &rarr; Completion (atomically transfers inventory from source to destination with `TRANSFER_OUT` and `TRANSFER_IN` movements).
4. **Customer RMA Returns**:
   - `Return Request` &rarr; Inspection & Restocking Disposition (`RESTOCKABLE` increments active inventory / `DAMAGED` quarantines to damaged stock) &rarr; Audit logged.

---

## 7. Automated Background Cron Jobs (`jobs/inventoryJobs.js`)

1. **Multi-Warehouse Low-Stock Scanner**:
   - Runs every 4 hours (`0 */4 * * *`).
   - Calculates ROP per product-warehouse: `ROP = (averageDailyDemand * leadTimeDays) + safetyStock`.
   - If available stock &le; ROP and no pending `LOW_STOCK` request exists, idempotently creates a purchase request for that warehouse.
2. **Overdue Purchase Order Monitor**:
   - Runs daily at midnight (`0 0 * * *`).
   - Identifies non-received POs where `expectedDeliveryDate < now` and flags them with audit warnings.

---

## 8. Complete API Directory

| Module | Endpoint Base | Key Actions |
|---|---|---|
| Authentication | `/api/auth` | Login, Token Refresh, Logout, Profile (`/me`), Forgot/Reset Password |
| Employees | `/api/employees` | CRUD employees, department filtering |
| Roles & Permissions | `/api/roles`, `/api/permissions` | Granular permission assignments |
| Products & Catalog | `/api/products`, `/api/categories`, `/api/brands`, `/api/product-variants` | Catalog CRUD, barcode uniqueness, search |
| Warehouses | `/api/warehouses` | Multi-facility setup, location management |
| Inventory | `/api/inventory` | Multi-warehouse balances, Stock In, Stock Out, Adjustments, Damaged quarantine |
| Stock Movements | `/api/stock-movements` | Immutable audit ledger of all inventory transactions |
| Stock Transfers | `/api/stock-transfers` | Request, Approve, Dispatch, Complete multi-facility movements |
| Purchases | `/api/purchases`, `/api/purchase-requests`, `/api/goods-receipts`, `/api/vendors` | Full procurement lifecycle |
| Sales | `/api/sales-orders`, `/api/customers`, `/api/invoices`, `/api/returns` | Order intake, reservation, fulfillment, invoicing, RMAs |
| Deliveries | `/api/deliveries` | Driver dispatch, route tracking, electronic proof-of-delivery |
| Governance | `/api/audit-logs`, `/api/settings`, `/api/reports/:type`, `/api/dashboard` | Audit trails, system configuration, executive metrics |

---

## 9. MongoDB Transaction & Replica-Set Notice

Multi-document inventory operations (Fulfillment, Transfers, Goods Receipts, Returns) utilize Mongoose transactional sessions. For local development with transactions enabled, ensure MongoDB is configured with a replica set (e.g. `mongod --replSet rs0`). In standalone local MongoDB instances, transactional operations automatically fallback safely to sequential validation.
