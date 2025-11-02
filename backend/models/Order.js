import mongoose from "mongoose";

// ==============================
// 🧩 Subdocument for each product
// ==============================
const OrderProductSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    subtotal: { type: Number }, // auto-calc per line

    // 🌸 how much of a preorder slot this item consumes
    capacityUnits: { type: Number, default: 1, min: 0.1, max: 100 },

    // 🧁 optional: bundle info for smart capacity logic
    bundleItems: [
      {
        name: { type: String },
        quantity: { type: Number, default: 1 },
      },
    ],

    image: { type: String },
  },
  { _id: false }
);

// ==============================
// 🧾 Main Order Schema
// ==============================
const orderSchema = new mongoose.Schema(
  {
    // 🧍 Customer Info
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },

    // 🛒 Ordered Products
    products: { type: [OrderProductSchema], required: true },

    // 💵 Financials
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tip: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, default: 0, min: 0 },

    // 💳 Payment info (Stripe not yet live)
    paymentMethod: {
      type: String,
      enum: ["Unpaid", "Cash", "Card", "Online"],
      default: "Unpaid",
    },
    isPaid: { type: Boolean, default: false },
    transactionId: { type: String, default: "" },

    // 🏠 Delivery Info (preorder schedule)
    address: {
      street: String,
      city: String,
      zip: String,
      instructions: String,
    },
    deliveryDate: { type: Date, required: true }, // preorder date
    deliveryTime: { type: String, required: true }, // e.g. "10:00-12:00"

    deliveryMethod: {
      type: String,
      enum: ["Pickup", "Delivery"],
      default: "Delivery",
    },
    deliveryStatus: {
      type: String,
      enum: ["Not Assigned", "Out for Delivery", "Delivered"],
      default: "Not Assigned",
    },

    // 📝 Customer notes
    notes: { type: String, default: "" },

    // 🚦 Lifecycle
    stage: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Done",
        "For Delivery",
        "Delivered",
        "Rejected",
      ],
      default: "Pending",
      index: true,
    },

    // ❌ Rejection info
    rejectionReason: { type: String, default: "" },

    // 🌸 Preorder tracking (capacity management)
    reservedUnits: { type: Number, default: 0 },
    capacityReleased: { type: Boolean, default: false },

    // 🧁 Analytics
    profitMargin: { type: Number, default: 0 },
    ingredientsCost: { type: Number, default: 0 },
    createdBy: { type: String, default: "System" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ==============================
// 📈 Indexes
// ==============================
orderSchema.index({ deliveryDate: 1 });

// ==============================
// 💡 Virtuals
// ==============================

// 💡 totalCapacityUnits — automatically accounts for bundles
orderSchema.virtual("totalCapacityUnits").get(function () {
  if (!Array.isArray(this.products)) return 0;

  return this.products.reduce((sum, p) => {
    const qty = Number(p?.quantity || 0);
    const baseUnits = Number(p?.capacityUnits || 1);

    // If bundleItems exist, use their total quantity (cookie count)
    let bundleCount = 0;
    if (Array.isArray(p.bundleItems) && p.bundleItems.length > 0) {
      bundleCount = p.bundleItems.reduce(
        (acc, b) => acc + Number(b.quantity || 0),
        0
      );
    }

    const effectiveUnits = bundleCount > 0 ? bundleCount : baseUnits;
    return sum + qty * effectiveUnits;
  }, 0);
});

// ==============================
// 🧮 Auto-calculate totals
// ==============================
orderSchema.pre("save", function (next) {
  if (Array.isArray(this.products)) {
    this.products = this.products.map((p) => {
      const qty = Number(p.quantity || 1);
      const price = Number(p.price || 0);
      const subtotal = Number((price * qty).toFixed(2));
      const base = p.toObject ? p.toObject() : p;
      return { ...base, subtotal };
    });
  }

  const safe = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);
  const subtotal = (this.products || []).reduce(
    (sum, p) => sum + safe(p.subtotal),
    0
  );

  const discount = safe(this.discount);
  const tip = safe(this.tip);
  const tax = safe(this.tax);

  this.subtotal = Number(subtotal.toFixed(2));
  this.total = Number((this.subtotal + tip + tax - discount).toFixed(2));

  next();
});

// ==============================
// ✅ Model export
// ==============================
const Order = mongoose.model("Order", orderSchema);
export default Order;
