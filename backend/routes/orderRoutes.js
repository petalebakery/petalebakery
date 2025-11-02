// backend/routes/orderRoutes.js
import express from "express";
import Order from "../models/Order.js";
import { releaseCapacity } from "../services/preorderService.js";

const router = express.Router();

// 🧁 GET all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧁 GET one order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧁 CREATE new order
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ order });
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(400).json({ error: err.message });
  }
});

// 🧁 UPDATE order stage (e.g., accept, progress, deliver)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const order = await Order.findByIdAndUpdate(id, { stage }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧁 REJECT order (restore preorder slot capacity)
router.put("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // 🧮 Determine how many slots to release
    let qty = Number(order.reservedUnits || 0);
    if (!qty || qty <= 0) {
      qty = Number(order.totalCapacityUnits || 0);
    }

    const dateStr = order.deliveryDate
      ? order.deliveryDate.toISOString().slice(0, 10)
      : null;
    const winStr = order.deliveryTime;

    // Release capacity if not already done
    if (!order.capacityReleased && qty > 0) {
      await releaseCapacity({ date: dateStr, window: winStr, qty });
      order.capacityReleased = true;
    }

    order.stage = "Rejected";
    order.rejectionReason = reason;

    await order.save();
    res.json(order);
  } catch (err) {
    console.error("Reject route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
