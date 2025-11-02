import Product from "../models/Product.js";

// ===== Get All Products =====
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ===== Add Product =====
export const addProduct = async (req, res) => {
  try {
    const images = req.files?.map((f) => `/uploads/${f.filename}`) || [];

    // Properly parse boolean + bundleItems JSON
    const isBundle = req.body.isBundle === "true" || req.body.isBundle === true;

    let bundleItems = [];
    if (req.body.bundleItems) {
      try {
        bundleItems = JSON.parse(req.body.bundleItems);
      } catch (err) {
        console.warn("⚠️ Invalid bundleItems JSON — skipping");
      }
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price) || 0,
      category: req.body.category,
      status: req.body.status || "Active",
      discountType: req.body.discountType || "none",
      discountValue: Number(req.body.discountValue) || 0,
      images,
      mainImageIndex: Number(req.body.mainImageIndex) || 0,
      preorderEnabled: req.body.preorderEnabled !== "false",
      leadTimeDays: Number(req.body.leadTimeDays) || 2,
      capacityUnits: Number(req.body.capacityUnits) || 1,
      deliveryOnly: req.body.deliveryOnly !== "false",
      isBundle,
      bundleItems,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags
        ? req.body.tags.split(",").map((t) => t.trim())
        : [],
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("❌ Error adding product:", error);
    res.status(500).json({ message: "Failed to add product", error });
  }
};

// ===== Update Product =====
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newImages = req.files?.map((f) => `/uploads/${f.filename}`) || [];
    const allImages = [...(product.images || []), ...newImages];

    const isBundle = req.body.isBundle === "true" || req.body.isBundle === true;

    let bundleItems = product.bundleItems;
    if (req.body.bundleItems) {
      try {
        bundleItems = JSON.parse(req.body.bundleItems);
      } catch (err) {
        console.warn("⚠️ Invalid bundleItems JSON — skipping");
      }
    }

    product.set({
      name: req.body.name || product.name,
      description: req.body.description || product.description,
      price: Number(req.body.price) || product.price,
      category: req.body.category || product.category,
      status: req.body.status || product.status,
      discountType: req.body.discountType || product.discountType,
      discountValue: Number(req.body.discountValue) || product.discountValue,
      images: allImages,
      mainImageIndex: Number(req.body.mainImageIndex) || 0,
      preorderEnabled: req.body.preorderEnabled !== "false",
      leadTimeDays: Number(req.body.leadTimeDays) || product.leadTimeDays,
      capacityUnits: Number(req.body.capacityUnits) || product.capacityUnits,
      deliveryOnly: req.body.deliveryOnly !== "false",
      isBundle,
      bundleItems,
    });

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({ message: "Failed to update product", error });
  }
};

// ===== Delete Product =====
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product", error });
  }
};

// ===== Delete Single Image =====
export const deleteProductImage = async (req, res) => {
  try {
    const { id, index } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.images.splice(Number(index), 1);
    await product.save();

    res.json({ message: "Image deleted", product });
  } catch (error) {
    console.error("❌ Error deleting product image:", error);
    res.status(500).json({ message: "Failed to delete image", error });
  }
};
