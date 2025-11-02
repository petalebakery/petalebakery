import mongoose from "mongoose";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 🧁 For items inside bundles
const bundleItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String },
    quantity: { type: Number, default: 1 },
    productRef: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // optional link to base cookie
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // 🧁 Basic product info
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    description: {
      type: String,
      required: function () {
        // Only require description for individual cookies
        return !this.isBundle;
      },
      maxlength: 5000,
    },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: "Uncategorized", index: true },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Out of Stock"],
      default: "Active",
      index: true,
    },
    discountType: {
      type: String,
      enum: ["none", "percent", "amount"],
      default: "none",
    },
    discountValue: { type: Number, default: 0, min: 0 },

    // 🖼️ Multiple images
    images: {
      type: [String],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        "At least one image is required.",
      ],
    },
    mainImageIndex: { type: Number, default: 0, min: 0 },

    // 🗓️ --- Pre-Order Options ---
    preorderEnabled: { type: Boolean, default: true },
    leadTimeDays: { type: Number, default: 2, min: 0, max: 30 },
    capacityUnits: { type: Number, default: 1, min: 0.1, max: 100 },
    deliveryOnly: { type: Boolean, default: true },

    // 🌸 --- Bundle System ---
    isBundle: { type: Boolean, default: false },
    bundleItems: { type: [bundleItemSchema], default: [] },

    // 🧁 Optional tags
    tags: { type: [String], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 💰 Virtual for final price
productSchema.virtual("finalPrice").get(function () {
  const price = Number(this.price) || 0;
  const type = this.discountType;
  const value = Number(this.discountValue) || 0;

  if (type === "percent") {
    const pct = Math.min(Math.max(value, 0), 100);
    return Number((price * (1 - pct / 100)).toFixed(2));
  }
  if (type === "amount") {
    return Math.max(Number((price - value).toFixed(2)), 0);
  }
  return Number(price.toFixed(2));
});

// 🧁 Auto-generate slug
productSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    const base = slugify(this.name || "product");
    const suffix = Math.random().toString(36).slice(2, 6);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

// 🌸 Auto-generate / refresh description for bundles
productSchema.pre("save", function (next) {
  if (this.isBundle && (!this.description || this.isModified("bundleItems"))) {
    if (this.bundleItems?.length > 0) {
      const list = this.bundleItems
        .map((item) => `${item.name} ×${item.quantity}`)
        .join(", ");
      this.description = `A curated selection of our signature cookies — ${list}. Freshly baked, beautifully wrapped, and crafted with care.`;
    } else {
      this.description = "A curated box of our finest cookies.";
    }
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
