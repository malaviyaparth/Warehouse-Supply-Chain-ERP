const mongoose = require("mongoose");
const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
};
module.exports = connectDB;
