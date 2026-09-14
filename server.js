require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./Config/db");
const errorHandler = require("./Middleware/errorMiddleware");
const authenticate = require("./Middleware/authMiddleware");
const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (req, res) =>
  res.json({
    success: true,
    status: "ok",
    service: "inventory-management-api",
    timestamp: new Date().toISOString(),
  }),
);

app.use("/api/auth", require("./Routes/authRoutes"));
app.use("/api", authenticate);

const routes = {
  "/api/employees": require("./Routes/employeeRoutes"),
  "/api/roles": require("./Routes/roleRoutes"),
  "/api/categories": require("./Routes/categoryRoutes"),
  "/api/brands": require("./Routes/brandRoutes"),
  "/api/products": require("./Routes/productRoutes"),
  "/api/product-variants": require("./Routes/productVariantRoutes"),
  "/api/warehouses": require("./Routes/warehouseRoutes"),
  "/api/inventory": require("./Routes/inventoryRoutes"),
  "/api/stock-movements": require("./Routes/stockMovementRoutes"),
  "/api/vendors": require("./Routes/vendorRoutes"),
  "/api/customers": require("./Routes/customerRoutes"),
  "/api/purchases": require("./Routes/purchaseRoutes"),
  "/api/purchase-requests": require("./Routes/purchaseRequestRoutes"),
  "/api/reorder-point": require("./Routes/reoderPointRoutes"),
  "/api/sales-orders": require("./Routes/salesOrderRoutes"),
  "/api/stock-transfers": require("./Routes/stockTransferRoutes"),
  "/api/invoices": require("./Routes/invoiceRoutes"),
  "/api/reports": require("./Routes/reportRoutes"),
  "/api/dashboard": require("./Routes/dashboardRoutes"),
};
Object.entries(routes).forEach(([path, router]) => app.use(path, router));

app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () =>
      console.log(`API running on http://localhost:${PORT}`),
    );
  } catch (e) {
    console.error("Startup failed:", e.message);
    process.exit(1);
  }
};
if (require.main === module) start();
module.exports = { app, start };
