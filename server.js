//  product -> product varient , category , brand , roles , warehouse

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





// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());

connectDB();



app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/warehouses", warehouseRoutes);



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




