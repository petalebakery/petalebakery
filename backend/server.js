import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ===== Import Routes =====
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";

// 🧁 NEW Pre-Order System
import preorderRoutes from "./routes/preorderRoutes.js";            
import adminPreorderRoutes from "./routes/adminPreorderRoutes.js";  
import checkoutRoutes from "./routes/checkoutRoutes.js";            

// ===== Config =====
dotenv.config();

// ===== Resolve __dirname =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Create Express App =====
const app = express();

// ===== Middleware =====
app.use(
  cors({
    origin: [
      "http://localhost:5173",             
      "https://petalebakery.com",          // your live frontend
      "https://www.petalebakery.com",      // optional www
    ],
    credentials: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Static Folder (for uploads like product images) =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== API Routes =====
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/finance", financeRoutes);

// ===== 🧁 Pre-Order Routes =====
app.use("/api/preorder", preorderRoutes);
app.use("/api/admin/preorder", adminPreorderRoutes);
app.use("/api/checkout", checkoutRoutes);

// ===== Serve Frontend (React Build) =====
const buildPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(buildPath));

// ===== React Fallback for Non-API Routes =====
app.get("*", (req, res) => {
  // serve index.html for any non-API route (so refreshes work)
  res.sendFile(path.join(buildPath, "index.html"));
});

// ===== MongoDB Connection =====
const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error("Mongo connection error:", err));
