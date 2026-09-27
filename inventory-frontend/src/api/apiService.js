import api from "./axios";

// 1. Employees & Auth
export const authApi = {
  login: (credentials) => api.post("/api/auth/login", credentials).then((r) => r.data),
  register: (userData) => api.post("/api/auth/register", userData).then((r) => r.data),
  me: () => api.get("/api/auth/me").then((r) => r.data),
  logout: () => api.post("/api/auth/logout").then((r) => r.data),
};

export const employeesApi = {
  list: (params) => api.get("/api/employees", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/employees/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/employees", data).then((r) => r.data),
  update: (id, data) => api.put(`/api/employees/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/api/employees/${id}`).then((r) => r.data),
};

export const rolesApi = {
  list: () => api.get("/api/roles").then((r) => r.data),
  get: (id) => api.get(`/api/roles/${id}`).then((r) => r.data),
};

export const permissionsApi = {
  list: () => api.get("/api/permissions").then((r) => r.data),
};

// 2. Master Data
export const productsApi = {
  list: (params) => api.get("/api/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/products/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/products", data).then((r) => r.data),
  update: (id, data) => api.put(`/api/products/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/api/products/${id}`).then((r) => r.data),
};

export const categoriesApi = {
  list: () => api.get("/api/categories").then((r) => r.data),
  create: (data) => api.post("/api/categories", data).then((r) => r.data),
  delete: (id) => api.delete(`/api/categories/${id}`).then((r) => r.data),
};

export const brandsApi = {
  list: () => api.get("/api/brands").then((r) => r.data),
  create: (data) => api.post("/api/brands", data).then((r) => r.data),
  delete: (id) => api.delete(`/api/brands/${id}`).then((r) => r.data),
};

export const variantsApi = {
  list: (params) => api.get("/api/product-variants", { params }).then((r) => r.data),
  byProduct: (productId) => api.get(`/api/product-variants/product/${productId}`).then((r) => r.data),
  create: (data) => api.post("/api/product-variants", data).then((r) => r.data),
  delete: (id) => api.delete(`/api/product-variants/${id}`).then((r) => r.data),
};

export const vendorsApi = {
  list: (params) => api.get("/api/vendors", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/vendors/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/vendors", data).then((r) => r.data),
  update: (id, data) => api.put(`/api/vendors/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/api/vendors/${id}`).then((r) => r.data),
};

export const customersApi = {
  list: (params) => api.get("/api/customers", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/customers/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/customers", data).then((r) => r.data),
  update: (id, data) => api.put(`/api/customers/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/api/customers/${id}`).then((r) => r.data),
};

export const warehousesApi = {
  list: (params) => api.get("/api/warehouses", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/warehouses/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/warehouses", data).then((r) => r.data),
  update: (id, data) => api.put(`/api/warehouses/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/api/warehouses/${id}`).then((r) => r.data),
};

// 3. Inventory & Operations
export const inventoryApi = {
  list: (params) => api.get("/api/inventory", { params }).then((r) => r.data),
  getByWarehouse: (warehouseId) => api.get(`/api/inventory/warehouse/${warehouseId}`).then((r) => r.data),
  stockIn: (data) => api.post("/api/inventory/stock-in", data).then((r) => r.data),
  stockOut: (data) => api.post("/api/inventory/stock-out", data).then((r) => r.data),
  adjust: (data) => api.post("/api/inventory/adjust", data).then((r) => r.data),
  recordDamaged: (data) => api.post("/api/inventory/damaged", data).then((r) => r.data),
};

export const stockMovementsApi = {
  list: (params) => api.get("/api/stock-movements", { params }).then((r) => r.data),
};

export const stockTransfersApi = {
  list: (params) => api.get("/api/stock-transfers", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/stock-transfers/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/stock-transfers", data).then((r) => r.data),
  approve: (id) => api.put(`/api/stock-transfers/${id}/approve`).then((r) => r.data),
  dispatch: (id) => api.put(`/api/stock-transfers/${id}/dispatch`).then((r) => r.data),
  complete: (id) => api.put(`/api/stock-transfers/${id}/complete`).then((r) => r.data),
};

// 4. Procurement
export const purchaseRequestsApi = {
  list: (params) => api.get("/api/purchase-requests", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/purchase-requests/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/purchase-requests", data).then((r) => r.data),
  approve: (id) => api.put(`/api/purchase-requests/${id}/approve`).then((r) => r.data),
  reject: (id, remarks) => api.put(`/api/purchase-requests/${id}/reject`, { remarks }).then((r) => r.data),
  cancel: (id) => api.put(`/api/purchase-requests/${id}/cancel`).then((r) => r.data),
};

export const purchaseOrdersApi = {
  list: (params) => api.get("/api/purchases", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/purchases/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/purchases", data).then((r) => r.data),
  approve: (id) => api.put(`/api/purchases/${id}/approve`).then((r) => r.data),
  cancel: (id) => api.put(`/api/purchases/${id}/cancel`).then((r) => r.data),
};

export const goodsReceiptsApi = {
  list: (params) => api.get("/api/goods-receipts", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/goods-receipts/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/goods-receipts", data).then((r) => r.data),
};

// 5. Sales & Delivery
export const salesOrdersApi = {
  list: (params) => api.get("/api/sales-orders", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/sales-orders/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/sales-orders", data).then((r) => r.data),
  reserve: (id) => api.put(`/api/sales-orders/${id}/reserve`).then((r) => r.data),
  fulfill: (id) => api.put(`/api/sales-orders/${id}/fulfill`).then((r) => r.data),
  cancel: (id) => api.put(`/api/sales-orders/${id}/cancel`).then((r) => r.data),
  invoice: (id) => api.post(`/api/sales-orders/${id}/invoice`).then((r) => r.data),
  checkAvailability: (id, warehouseId) =>
    api.get(`/api/sales-orders/${id}/availability`, { params: { warehouse: warehouseId } }).then((r) => r.data),
};

export const invoicesApi = {
  list: (params) => api.get("/api/invoices", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/invoices/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/invoices", data).then((r) => r.data),
  updatePayment: (id, data) => api.put(`/api/invoices/${id}/payment`, data).then((r) => r.data),
};

export const deliveriesApi = {
  list: (params) => api.get("/api/deliveries", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/deliveries/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/deliveries", data).then((r) => r.data),
  assign: (id, assignedEmployee) => api.put(`/api/deliveries/${id}/assign`, { assignedEmployee }).then((r) => r.data),
  updateStatus: (id, data) => api.put(`/api/deliveries/${id}/status`, data).then((r) => r.data),
  history: (params) => api.get("/api/deliveries/history", { params }).then((r) => r.data),
  assignedToMe: () => api.get("/api/deliveries/assigned-to-me").then((r) => r.data),
};

export const returnsApi = {
  list: (params) => api.get("/api/returns", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/returns/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/returns", data).then((r) => r.data),
  updateStatus: (id, status, remarks) => api.put(`/api/returns/${id}/status`, { status, remarks }).then((r) => r.data),
  inspect: (id, items, remarks) => api.put(`/api/returns/${id}/inspect`, { items, remarks }).then((r) => r.data),
  complete: (id) => api.put(`/api/returns/${id}/complete`).then((r) => r.data),
};

// 6. Analytics, Logs & System Settings
export const dashboardApi = {
  get: () => api.get("/api/dashboard").then((r) => r.data),
};

export const reportsApi = {
  get: (type) => api.get(`/api/reports/${type}`).then((r) => r.data),
};

export const auditLogsApi = {
  list: (params) => api.get("/api/audit-logs", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/audit-logs/${id}`).then((r) => r.data),
};

export const settingsApi = {
  get: () => api.get("/api/settings").then((r) => r.data),
  updateCompany: (data) => api.put("/api/settings", data).then((r) => r.data),
  updateConfig: (data) => api.put("/api/settings/config", data).then((r) => r.data),
  triggerLowStock: () => api.post("/api/settings/trigger-low-stock-scan").then((r) => r.data),
  triggerOverdueScan: () => api.post("/api/settings/trigger-overdue-scan").then((r) => r.data),
};
