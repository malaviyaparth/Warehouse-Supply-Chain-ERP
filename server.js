const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./Config/db");

// Import models to register with Mongoose
const Brand = require("./Models/Brand");
const Category = require("./Models/Category");
const Product = require("./Models/Product");
const Vendor = require("./Models/Vendor");

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

app.use(express.json());

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
  res.json({message: "Hello from Node.js API"});
});

app.get("/developers", (req, res) => {
  const developers = [
    { id: 1, name: "Parth" },
    { id: 2, name: "Jeel" },
  ];

  res.json(developers);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
