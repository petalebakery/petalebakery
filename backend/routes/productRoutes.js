import express from "express";
import multer from "multer";
import path from "path";
import Product from "../models/Product.js";
import {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct,
  deleteProductImage,
} from "../controllers/productController.js";

const router = express.Router();

// ===== Multer Config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

function imageFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP images are allowed."));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ===== Routes =====
router.get("/", getProducts);

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product", error });
  }
});

router.post("/", upload.array("images", 10), addProduct);
router.put("/:id", upload.array("images", 10), updateProduct);
router.delete("/:id", deleteProduct);

// 🖼️ Delete single image
router.delete("/:id/image/:index", deleteProductImage);

export default router;
