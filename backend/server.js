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
import preorderRoutes from "./routes/preorderRoutes.js";            // check available dates/windows
import adminPreorderRoutes from "./routes/adminPreorderRoutes.js";  // manage capacity/blackouts
import checkoutRoutes from "./routes/checkoutRoutes.js";            // place pre-orders (no Stripe)

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
      "http://localhost:5173",          // local dev
      "https://petale-frontend.vercel.app" // your deployed frontend (update if renamed)
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
app.use("/api/preorder", preorderRoutes);            // public: check availability
app.use("/api/admin/preorder", adminPreorderRoutes); // admin: manage capacity
app.use("/api/checkout", checkoutRoutes);            // customer preorder creation

// ===== Serve Frontend (React Build) =====
const buildPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(buildPath));

// ===== React fallback for non-API routes (safe regex for Node 22+) =====
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// ===== MongoDB Connection =====
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error("Mongo connection error:", err));
