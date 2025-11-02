import dotenv from "dotenv";
dotenv.config();
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import sgMail from "@sendgrid/mail";
import { reserveCapacity, releaseCapacity } from "../services/preorderService.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 🧁 Create new order (customer side)
export const createOrder = async (req, res) => {
  try {
    const {
      name,
      email,
      products,
      total,
      tip,
      deliveryDate,
      deliveryTime,
      address,
    } = req.body;

    if (!products?.length || !deliveryDate || !deliveryTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🧮 Calculate total capacity usage
    let totalCapacity = 0;

    for (const item of products) {
      const productDoc = await Product.findById(item.productId);

      if (productDoc) {
        if (productDoc.isBundle && productDoc.bundleItems?.length > 0) {
          // 🧁 Each cookie in the bundle = 1 slot per quantity
          const bundleCapacity = productDoc.bundleItems.reduce(
            (sum, b) => sum + (b.quantity || 1),
            0
          );
          totalCapacity += bundleCapacity * (item.quantity || 1);
        } else {
          // 🍪 Individual product
          totalCapacity += (productDoc.capacityUnits || 1) * (item.quantity || 1);
        }
      } else {
        totalCapacity += (item.capacityUnits || 1) * (item.quantity || 1);
      }
    }

    // 🗓️ Reserve slots for the selected date/time
    await reserveCapacity({
      date: deliveryDate,
      window: deliveryTime,
      qty: totalCapacity,
    });

    // 🍪 Create the order
    const newOrder = new Order({
      name,
      email,
      products,
      total,
      tip,
      deliveryDate,
      deliveryTime,
      address,
      reservedUnits: totalCapacity,
    });

    await newOrder.save();

    // 🍰 Format order summary
    const itemsList = products
      .map((p) => `${p.quantity} × ${p.name} — $${p.price.toFixed(2)}`)
      .join("<br>");

    const html = `
      <div style="font-family:'Segoe UI',sans-serif;color:#333;">
        <h2>Thank You for Your Order, ${name}! 🧁</h2>
        <p>Your delicious treats from <b>Petalé Bakery</b> are being prepared with love 💕.</p>
        <p><b>Delivery:</b> ${new Date(deliveryDate).toLocaleDateString()} at ${deliveryTime}</p>

        <h3>Order Summary</h3>
        <p>${itemsList}</p>

        <p><b>Total:</b> $${total.toFixed(2)}</p>
        ${tip > 0 ? `<p><b>Tip:</b> $${tip.toFixed(2)}</p>` : ""}
        <p><b>Grand Total:</b> $${(total + tip).toFixed(2)}</p>

        <p style="margin-top:20px;">
          You’ll receive another email when your order is accepted 💗<br>
          With love,<br>
          <b>Petalé Bakery Team 🧁</b>
        </p>
      </div>
    `;

    // ✉️ Send confirmation email
    if (email) {
      const msg = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: "Your Petalé Bakery Order Confirmation 🧁",
        html,
      };
      await sgMail.send(msg);
    }

    res.status(201).json({
      message: "Order placed successfully and email sent!",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order", error });
  }
};

// 🧾 Get all orders (admin view)
export const getOrders = async (req, res) => {
  try {
    const { stage } = req.query;
    const filter = stage ? { stage } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

// 🧠 Get single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error });
  }
};

// 🚦 Update order stage
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      stage,
      deliveryDate,
      deliveryTime,
      notes,
      rejectionReason,
      address,
    } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Update basic fields
    if (stage) order.stage = stage;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (deliveryTime) order.deliveryTime = deliveryTime;
    if (notes) order.notes = notes;
    if (address) order.address = address;
    if (rejectionReason) order.rejectionReason = rejectionReason;

    await order.save();

    // ✉️ Notify user about status
    if (order.email && stage) {
      const statusMessages = {
        "In Progress": "Your order has been accepted and is now being prepared 🍪",
        Done: "Your order is ready and waiting to be scheduled for delivery 💕",
        "For Delivery": "Your order is out for delivery! 🚗💨",
        Delivered: "Your order has been delivered. We hope you loved it! 💝",
        Rejected: `Unfortunately, your order was declined. Reason: ${
          rejectionReason || "Not specified"
        }.`,
      };

      const html = `
        <div style="font-family:'Segoe UI',sans-serif;color:#333;">
          <h2>Order Update from Petalé Bakery 🧁</h2>
          <p>${statusMessages[stage] || "Your order has been updated."}</p>
          <p><b>Order ID:</b> ${order._id}</p>
          <p><b>Status:</b> ${stage}</p>
          <p style="margin-top:20px;">Thank you for supporting small businesses 💗</p>
        </div>
      `;

      await sgMail.send({
        to: order.email,
        from: process.env.EMAIL_USER,
        subject: `Petalé Bakery — Order ${stage}`,
        html,
      });
    }

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Error updating order", error });
  }
};

// ❌ Reject order + release slot
export const rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 🧁 Release capacity slots
    if (!order.capacityReleased && order.reservedUnits > 0) {
      await releaseCapacity({
        date: order.deliveryDate,
        window: order.deliveryTime,
        qty: order.reservedUnits,
      });
      order.capacityReleased = true;
    }

    // Update order status
    order.stage = "Rejected";
    order.rejectionReason = reason || "No reason provided";
    await order.save();

    // ✉️ Email customer about rejection
    if (order.email) {
      const html = `
        <div style="font-family:'Segoe UI',sans-serif;color:#333;">
          <h2>Order Update — Petalé Bakery 🍰</h2>
          <p>We’re sorry, ${order.name}. Your order was declined.</p>
          <p><b>Reason:</b> ${reason || "Not specified"}</p>
          <p>You can reach out to us if you'd like to reschedule or adjust your order 💗</p>
        </div>
      `;
      await sgMail.send({
        to: order.email,
        from: process.env.EMAIL_USER,
        subject: "Your Petalé Bakery Order — Rejected 😢",
        html,
      });
    }

    // ❌ Delete rejected order from database
    await order.deleteOne();

    res.json({ message: "Order rejected, slots released, and deleted." });
  } catch (error) {
    console.error("Error rejecting order:", error);
    res.status(500).json({ message: "Error rejecting order", error });
  }
};

// 🚮 Delete order manually (admin only)
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.deleteOne();
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Error deleting order", error });
  }
};
