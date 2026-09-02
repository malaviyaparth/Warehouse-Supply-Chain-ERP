//  product -> product varient , category , brand , roles , warehouse
app.use(express.json());

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./Config/db");
const Brand = require("./Models/Brand");
const Category = require("./Models/Category");
const Product = require("./Models/Product");
const Vendor = require("./Models/Vendor");
const categoryRoutes = require( "./Routes/CategoryRoutes");
const productRoutes = require("./Routes/productRoutes");
const productVariantRoutes = require("./Routes/productVariantRoutes");
const warehouseRoutes = require("./Routes/warehouseRoutes");
const stockMovementRoutes = require("./Routes/stockMovementRoutes");
const purchaseRoutes = require("./Routes/purchaseRoutes");





// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());

connectDB();



app.use(
    "/api/purchases",
    purchaseRoutes
);
app.use( "/api/stock-movements", stockMovementRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/warehouses", warehouseRoutes);



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




/*

const express = require("express");

const app = express();


// Middleware
app.use(express.json());


// Existing routes

const employeeRoutes =
    require("./routes/employeeRoutes");

const roleRoutes =
    require("./routes/roleRoutes");

const permissionRoutes =
    require("./routes/permissionRoutes");

const categoryRoutes =
    require("./routes/categoryRoutes");

const brandRoutes =
    require("./routes/brandRoutes");

const productRoutes =
    require("./routes/productRoutes");

const productVariantRoutes =
    require("./routes/productVariantRoutes");

const warehouseRoutes =
    require("./routes/warehouseRoutes");

const inventoryRoutes =
    require("./routes/inventoryRoutes");

const stockMovementRoutes =
    require("./routes/stockMovementRoutes");

const vendorRoutes =
    require("./routes/vendorRoutes");

const purchaseRoutes =
    require("./routes/purchaseRoutes");


// Phase 10
const reorderPointRoutes =
    require("./routes/reorderPointRoutes");

const purchaseRequestRoutes =
    require("./routes/purchaseRequestRoutes");


// Phase 11
const salesOrderRoutes =
    require("./routes/salesOrderRoutes");


// Phase 12
const reservationRoutes =
    require("./routes/reservationRoutes");


// Phase 13
const dashboardRoutes =
    require("./routes/dashboardRoutes");


// Routes

app.use(
    "/api/employees",
    employeeRoutes
);

app.use(
    "/api/roles",
    roleRoutes
);

app.use(
    "/api/permissions",
    permissionRoutes
);

app.use(
    "/api/categories",
    categoryRoutes
);

app.use(
    "/api/brands",
    brandRoutes
);

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/product-variants",
    productVariantRoutes
);

app.use(
    "/api/warehouses",
    warehouseRoutes
);

app.use(
    "/api/inventory",
    inventoryRoutes
);

app.use(
    "/api/stock-movements",
    stockMovementRoutes
);

app.use(
    "/api/vendors",
    vendorRoutes
);

app.use(
    "/api/purchases",
    purchaseRoutes
);


// Phase 10

app.use(
    "/api/reorder-point",
    reorderPointRoutes
);

app.use(
    "/api/purchase-requests",
    purchaseRequestRoutes
);


// Phase 11

app.use(
    "/api/sales-orders",
    salesOrderRoutes
);


// Phase 12

app.use(
    "/api/reservations",
    reservationRoutes
);


// Phase 13

app.use(
    "/api/dashboard",
    dashboardRoutes
);

*/