// src/components/CheckoutPanel.jsx
import { useState } from "react";
import axios from "../api";
import PreorderDatePicker from "./PreorderDatePicker";

export default function CheckoutPanel({ cart }) {
  const [schedule, setSchedule] = useState({ date: "", window: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function placePreorder() {
    if (!schedule.date || !schedule.window) return alert("Please choose a date & time window.");

    setLoading(true);
    try {
      // Build order payload; include capacityUnits if you store them in cart items
      const items = (cart.items || []).map((it) => ({
        productId: it._id,
        name: it.name,
        price: it.price,
        quantity: it.quantity || 1,
        image: Array.isArray(it.images) ? it.images[0] : it.image,
        capacityUnits: it.capacityUnits || 1,
      }));

      const customer = cart.customer || {}; // name/email/phone/address

      await axios.post("/api/checkout/create-order", {
        items,
        customer,
        scheduledFor: schedule.date,
        window: schedule.window,
        fulfillmentMethod: "delivery",
        deliveryFee: 5,
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Could not place pre-order.");
    } finally {
      setLoading(false);
    }
  }

  if (success)
    return (
      <div className="p-4 rounded bg-green-100 text-green-800">
        ✅ Pre-order received! We’ll email/text your delivery confirmation shortly.
      </div>
    );

  return (
    <div className="space-y-4">
      <PreorderDatePicker value={schedule.date} onChange={setSchedule} />

      <div className="text-sm">Delivery only · $5 flat fee</div>

      <button
        disabled={loading}
        onClick={placePreorder}
        className="w-full border rounded px-3 py-2 bg-rose-100 hover:bg-rose-200"
      >
        {loading ? "Placing Pre-Order…" : "Place Pre-Order"}
      </button>

      <p className="text-xs text-gray-500">
        48-hour lead time. Closed Mon & Tue. Thu–Sat deliveries end by 3pm; Sun deliveries start at 5pm.
      </p>
    </div>
  );
}
