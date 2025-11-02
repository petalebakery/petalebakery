// backend/routes/checkoutRoutes.js
import express from "express";
import Order from "../models/Order.js";
import { reserveCapacity } from "../services/preorderService.js";
import { PREORDER_CONFIG } from "../config/preorder.js";

const router = express.Router();

const toISODateOnly = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  // yyyy-mm-dd in UTC
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
    .toISOString()
    .slice(0, 10);
};

router.post("/create-order", async (req, res) => {
  try {
    // Accept both the new shape and legacy root fields
    const {
      items = [],
      customer = {},

      // New (preferred)
      scheduledFor,           // 'YYYY-MM-DD'
      window: timeWindow,     // 'HH:mm-HH:mm'

      // Legacy fallbacks
      name: rootName,
      email: rootEmail,
      phone: rootPhone,
      address: rootAddress,
      deliveryDate: rootDeliveryDate, // Date string/object
      deliveryTime: rootDeliveryTime,

      deliveryFee = PREORDER_CONFIG.delivery?.flatFee || 0,
      discount = 0,
      tip = 0,
      tax = 0,
      total = 0,
      notes = "",
    } = req.body || {};

    // ---- Normalize incoming fields ----
    const name = (customer?.name || rootName || "").trim();
    const email = (customer?.email || rootEmail || "").trim();
    const phone = (customer?.phone || rootPhone || "").trim();
    const address = customer?.address || rootAddress || {
      street: "",
      city: "",
      zip: "",
      instructions: "",
    };

    // Accept either (scheduledFor + window) or (deliveryDate + deliveryTime)
    let scheduleDateStr = scheduledFor || toISODateOnly(rootDeliveryDate);
    let windowStr = timeWindow || rootDeliveryTime || "";

    // Validate requireds early with clear messages
    const missing = [];
    if (!name) missing.push("name");
    if (!scheduleDateStr) missing.push("scheduledFor/deliveryDate");
    if (!windowStr) missing.push("window/deliveryTime");
    if (missing.length) {
      return res.status(400).json({
        error: "Missing required fields",
        missing,
      });
    }

    // Reserve capacity BEFORE creating order
    // Calculate total capacity units from items
    const qtyForCapacity = (Array.isArray(items) ? items : []).reduce((sum, it) => {
      const q = Number(it?.quantity || 1);
      const cu = Number(it?.capacityUnits || 1);
      return sum + q * cu;
    }, 0);

    await reserveCapacity({
      date: scheduleDateStr,
      window: windowStr,
      qty: qtyForCapacity,
    });

    // Build order doc conforming to your schema
    const doc = {
      name,
      email,
      phone,
      address: {
        street: address?.street || "",
        city: address?.city || "",
        zip: address?.zip || "",
        instructions: address?.instructions || "",
      },
      products: (Array.isArray(items) ? items : []).map((it) => ({
        productId: it.productId,
        name: it.name,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        subtotal: Number(((it.price || 0) * (it.quantity || 1)).toFixed(2)),
        capacityUnits: Number(it.capacityUnits || 1),
        image: it.image || "",
      })),

      discount: Number(discount || 0),
      tip: Number(tip || 0),
      tax: Number(tax || 0),
      subtotal: 0, // pre('save') will calc
      total: Number(total || 0), // okay to be 0 while payments are off

      paymentMethod: "Unpaid",
      isPaid: false,
      transactionId: "",

      deliveryDate: new Date(`${scheduleDateStr}T00:00:00.000Z`),
      deliveryTime: windowStr,
      deliveryMethod: "Delivery",
      deliveryStatus: "Not Assigned",

      stage: "Pending",
      notes: notes || "",
      createdBy: "Website",
    };

    const order = await Order.create(doc);

    return res.json({ success: true, orderId: order._id, order });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
