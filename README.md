# Warehouse & Supply Chain ERP — Backend

Backend-only implementation for the Inventory/Warehouse/Supply-Chain project. The frontend is intentionally not included.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- REST APIs

## Modules
Authentication/RBAC, employees, roles/permissions, products, categories, brands, variants, warehouses, inventory, stock movements, vendors, customers, purchase requests, purchase orders/goods receipt, reorder-point automation, sales orders/reservation/fulfillment, stock transfers, invoices/payments, dashboard and reports.

## Setup
1. Install Node.js 18+ and MongoDB.
2. Copy `.env.example` to `.env`.
3. Set a strong `JWT_SECRET` and your MongoDB URI.
4. Run `npm install`.
5. Run `npm run dev`.
6. Optional: run `node seed.js` to create an admin account.

Default seeded account:
`admin@example.com` / `Admin@123` — change it immediately in a real deployment.

## Authentication
For protected operations, send:
`Authorization: Bearer <token>`

Login:
`POST /api/auth/login`

Register:
`POST /api/auth/register`

Current user:
`GET /api/auth/me`

## Main endpoints

| Module | Base |
|---|---|
| Auth | `/api/auth` |
| Employees | `/api/employees` |
| Roles & permissions | `/api/roles` |
| Categories | `/api/categories` |
| Brands | `/api/brands` |
| Products | `/api/products` |
| Product variants | `/api/product-variants` |
| Warehouses | `/api/warehouses` |
| Inventory | `/api/inventory` |
| Stock movements | `/api/stock-movements` |
| Vendors | `/api/vendors` |
| Customers | `/api/customers` |
| Purchase requests | `/api/purchase-requests` |
| Purchase orders | `/api/purchases` |
| Reorder point | `/api/reorder-point` |
| Sales orders | `/api/sales-orders` |
| Stock transfers | `/api/stock-transfers` |
| Invoices | `/api/invoices` |
| Reports | `/api/reports/:type` |
| Dashboard | `/api/dashboard` |
| Health | `/health` |

## Important workflows

### Purchase
Create purchase request → approve request → create purchase order → approve PO → receive goods → inventory increases → stock movement is recorded.

### Sales
Create customer → create sales order → reserve stock → confirm → fulfill → inventory decreases → stock movement is recorded → generate invoice.

### Reorder
`GET /api/reorder-point/:productId/:warehouseId` calculates:
`ROP = averageDailyDemand × leadTimeDays + safetyStock`.

When stock is at/below ROP, `POST /api/reorder-point/:productId/:warehouseId/purchase-request` creates a LOW_STOCK purchase request unless one is already pending.

### Stock transfer
Create transfer → approve → complete. Completion deducts source inventory, adds destination inventory, and records TRANSFER_OUT/TRANSFER_IN movements.

## Notes
- The API uses consistent `{ success, data, message }` responses.
- Validation and duplicate-key errors are handled centrally.
- Product `brand` is optional because the service previously treated it as optional.
- Inventory has one record per product per warehouse.
- For production, use a replica set/managed MongoDB if multi-document ACID transactions are required, add rate limiting, HTTPS, secret management, audit logging, and stronger authorization policies.
