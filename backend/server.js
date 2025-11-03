// ====== Imports ======
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ====== Import Routes ======
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import preorderRoutes from "./routes/preorderRoutes.js";
import adminPreorderRoutes from "./routes/adminPreorderRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";

// ====== Config ======
dotenv.config();

// ====== Resolve __dirname for ES Modules ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== Create Express App ======
const app = express();

// ====== Middleware ======
app.use(
  cors({
    origin: [
      "http://localhost:5173",        // Local development
      "https://petalebakery.com",     // Live domain
      "https://www.petalebakery.com", // Optional www
    ],
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== Static Folder (for image uploads, etc.) ======
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ====== API Routes ======
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/preorder", preorderRoutes);
app.use("/api/admin/preorder", adminPreorderRoutes);
app.use("/api/checkout", checkoutRoutes);

// ====== Health Check (for Render monitoring) ======
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "🌸 Pétale Bakery API healthy",
  });
});

// ====== Root API Check ======
app.get("/", (req, res) => {
  res.status(200).send("🌸 Pétale Bakery API running");
});

// ====== Serve Frontend (React Build) ======
app.use(express.static(path.join(__dirname, "frontend", "dist")));

// ====== Catch-all Route (Express 5 safe using RegExp) ======
app.all(/.*/, (req, res) => {
  // Prevent React from hijacking API or upload routes
  if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) {
    return res.status(404).json({ message: "Not Found" });
  }

  // Serve React index.html for all other routes
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

// ====== MongoDB Connection ======
const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("🌸 Pétale Bakery backend fully initialized and ready");
    });
  })
  .catch((err) => console.error("Mongo connection error:", err));
