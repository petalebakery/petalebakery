import { useEffect, useMemo, useState } from "react";
import axios from "../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Helpers
const toISODate = (d) => {
  if (!d) return "";
  const now = new Date();
  const dt = new Date(d);

  // 🌙 If the order is placed after 10 PM, add one extra prep day
  if (now.getHours() >= 22) {
    dt.setDate(dt.getDate() + 1);
  }

  const yr = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
};

// Block Mon/Tue and anything < 48h
const isSelectableDate = (date) => {
  const day = date.getDay(); // 0=Sun ... 6=Sat
  if (day === 1 || day === 2) return false; // Mon/Tue closed
  const now = new Date();
  const min = new Date(now);
  min.setDate(min.getDate() + 2); // 48h lead
  min.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  return candidate >= min;
};

export default function Cart() {
  const [cart, setCart] = useState({ items: [] });
  const items = useMemo(() => (Array.isArray(cart) ? cart : cart.items || []), [cart]);

  const [showCheckout, setShowCheckout] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState(null);
  const [windows, setWindows] = useState([]);
  const [windowChoice, setWindowChoice] = useState("");
  const [loadingWindows, setLoadingWindows] = useState(false);

  const [tip, setTip] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    zip: "",
    instructions: "",
  });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [message, setMessage] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);

  // Load cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setCart(parsed);
      else setCart(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const updateQuantity = (index, delta) => {
    const base = Array.isArray(cart) ? { items: cart } : cart;
    const newItems = [...(base.items || [])];
    newItems[index].quantity = Math.max(1, (newItems[index].quantity || 1) + delta);
    const next = { ...base, items: newItems };
    setCart(next.items ? next : newItems);
    localStorage.setItem("cart", JSON.stringify(next.items ? next : newItems));
  };

  const removeItem = (index) => {
    const base = Array.isArray(cart) ? { items: cart } : cart;
    const newItems = (base.items || []).filter((_, i) => i !== index);
    const next = { ...base, items: newItems };
    setCart(next.items ? next : newItems);
    localStorage.setItem("cart", JSON.stringify(next.items ? next : newItems));
  };

  const total = (items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const grandTotal = total + Number(tip || 0);

  // Fetch windows whenever a valid date is chosen
  useEffect(() => {
    if (!deliveryDate) return;
    const iso = toISODate(deliveryDate);
    if (!iso) return;

    setLoadingWindows(true);
    setWindowChoice("");
    setWindows([]);

    axios
      .get("/preorder/availability", { params: { date: iso } })
      .then((res) => {
        const arr = Array.isArray(res.data?.windows) ? res.data.windows : [];
        setWindows(arr);
      })
      .catch(() => setWindows([]))
      .finally(() => setLoadingWindows(false));
  }, [deliveryDate]);

  const validate = () => {
    if (!form.name) return setMessage("Please enter your full name."), false;
    if (!form.phone) return setMessage("Please enter a phone number."), false;
    if (!address.street || !address.city || !address.zip)
      return setMessage("Please complete your delivery address."), false;
    if (!deliveryDate) return setMessage("Please pick a delivery date."), false;
    if (!windowChoice) return setMessage("Please choose a delivery window."), false;
    if (!items.length) return setMessage("Your cart is empty."), false;
    setMessage("");
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    try {
      const scheduledFor = toISODate(deliveryDate);
      const payload = {
        items: items.map((item) => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          image: Array.isArray(item.images) ? item.images[0] : item.image,
          capacityUnits: item.capacityUnits || 1,
        })),
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address,
        },
        scheduledFor,
        window: windowChoice,
        deliveryFee: 5,
        tip: Number(tip || 0),
      };

      const res = await axios.post("/checkout/create-order", payload);

      localStorage.removeItem("cart");
      setOrderSummary({
        orderId: res.data?.order?._id,
        name: form.name,
        email: form.email,
        products: payload.items.map((p) => ({
          name: p.name,
          price: p.price,
          quantity: p.quantity,
        })),
        total,
        tip: Number(tip || 0),
        deliveryDate: scheduledFor,
        deliveryTime: windowChoice,
      });
      setOrderPlaced(true);
      setShowCheckout(false);
    } catch (err) {
      console.error(err);
      setMessage("Failed to place pre-order. Please try again.");
    }
  };

  // ===== Elegant Order Confirmation =====
  if (orderPlaced) {
    return (
      <div className="p-10 bg-cream min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold text-rose mb-4">
          Thank you for your order, {orderSummary?.name}.
        </h1>
        <p className="text-gray-700 mb-6 max-w-md leading-relaxed">
          Your pre-order with <span className="font-semibold">Petalé Bakery</span> has been received.
          You can expect delivery on{" "}
          <span className="font-semibold">{orderSummary?.deliveryDate}</span>{" "}
          between <span className="font-semibold">{orderSummary?.deliveryTime}</span>.
        </p>

        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md mb-8 text-left border border-gray-100">
          <h2 className="text-2xl font-semibold text-rose mb-3 border-b pb-2">Order Summary</h2>
          {(orderSummary?.products || []).map((p, i) => (
            <p key={i} className="text-gray-700 mb-1">
              {p.quantity} × {p.name}
              <span className="float-right">${Number(p.price || 0).toFixed(2)}</span>
            </p>
          ))}
          <hr className="my-4" />
          <p className="font-medium text-gray-800">
            Subtotal{" "}
            <span className="float-right">${Number(orderSummary?.total || 0).toFixed(2)}</span>
          </p>
          {Number(orderSummary?.tip || 0) > 0 && (
            <p className="text-gray-700">
              Tip <span className="float-right">${Number(orderSummary?.tip).toFixed(2)}</span>
            </p>
          )}
          <p className="font-semibold text-lg text-rose mt-2">
            Total{" "}
            <span className="float-right">
              ${Number((orderSummary?.total || 0) + (orderSummary?.tip || 0)).toFixed(2)}
            </span>
          </p>
        </div>

        <p className="text-gray-600 mb-10 max-w-md text-sm italic">
          A confirmation will be sent to{" "}
          <span className="font-medium not-italic">
            {orderSummary?.email || "the email you provided"}
          </span>
          .
        </p>

        <div className="flex gap-4">
          <a
            href="/menu"
            className="bg-rose text-white py-2 px-8 rounded-md hover:bg-softpink hover:text-rose transition"
          >
            Continue Shopping
          </a>
          <a
            href="/"
            className="bg-gray-200 text-gray-700 py-2 px-8 rounded-md hover:bg-gray-300 transition"
          >
            Home
          </a>
        </div>
      </div>
    );
  }

  // ===== Regular Cart Page =====
  return (
    <div className="p-10 bg-cream min-h-screen">
      <h1 className="text-4xl font-bold text-center text-rose mb-8">Your Cart</h1>

      {(items || []).length === 0 ? (
        <p className="text-center text-gray-500 text-lg">Your cart is empty. Add something sweet to begin.</p>
      ) : (
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6">
          {(items || []).map((item, index) => (
            <div key={`${item._id || item.name}-${index}`} className="flex justify-between items-center border-b border-gray-200 py-3">
              <div>
                <h2 className="font-semibold text-lg">{item.name}</h2>
                <p className="text-gray-500">
                  ${Number(item.price || 0).toFixed(2)} × {item.quantity || 1}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(index, -1)} className="px-2 py-1 bg-gray-200 rounded">
                  −
                </button>
                <span>{item.quantity || 1}</span>
                <button onClick={() => updateQuantity(index, 1)} className="px-2 py-1 bg-gray-200 rounded">
                  +
                </button>
                <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 font-semibold ml-3">
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Totals + Checkout */}
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold">
              Subtotal: <span className="text-rose">${Number(total).toFixed(2)}</span>
            </p>
            <button
              onClick={() => setShowCheckout(!showCheckout)}
              className="bg-rose text-white py-2 px-8 rounded-md mt-4 hover:bg-softpink hover:text-rose transition"
            >
              {showCheckout ? "Cancel Checkout" : "Proceed to Checkout"}
            </button>
          </div>

          {showCheckout && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-2xl font-bold mb-4 text-rose text-center">Delivery Details</h2>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 w-full"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 w-full"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 w-full md:col-span-2"
                  required
                />
              </div>

              {/* Address */}
              <label className="block font-semibold mt-4 mb-2">Address</label>
              <input
                type="text"
                placeholder="Street address"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="border border-gray-300 rounded-md p-2 w-full mb-3"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 w-full"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  className="border border-gray-300 rounded-md p-2 w-full"
                />
              </div>
              <textarea
                placeholder="Delivery instructions (optional)"
                value={address.instructions}
                onChange={(e) => setAddress({ ...address, instructions: e.target.value })}
                className="border border-gray-300 rounded-md p-2 w-full mt-3"
                rows="2"
              />

              {/* Date & Windows */}
              <label className="block font-semibold mt-6 mb-2">Delivery Date</label>
              <DatePicker
                selected={deliveryDate}
                onChange={(d) => setDeliveryDate(d)}
                className="border border-gray-300 rounded-md p-2 w-full mb-3"
                minDate={new Date()}
                filterDate={isSelectableDate}
                placeholderText="Pick a date (≥ 48h; closed Mon/Tue)"
              />

              <label className="block font-semibold mb-2">Time Window</label>
              {loadingWindows ? (
                <div className="text-sm text-gray-600 mb-3">Loading windows…</div>
              ) : windows.length === 0 ? (
                <div className="text-sm text-gray-600 mb-3">
                  {deliveryDate
                    ? "No windows available for this date. Please choose another."
                    : "Pick a date to see available windows."}
                </div>
              ) : (
                <select
                  value={windowChoice}
                  onChange={(e) => setWindowChoice(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 w-full mb-3"
                >
                  <option value="" disabled>
                    Select a time window
                  </option>
                  {windows.map((w) => (
                    <option key={w.window} value={w.window} disabled={w.remaining <= 0}>
                      {w.window} {w.remaining <= 0 ? "— Sold out" : `— ${w.remaining} left`}
                    </option>
                  ))}
                </select>
              )}

              {/* Tip */}
              <label className="block font-semibold mb-2">Tip (Optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter tip amount"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-full mb-3"
              />

              {/* Final Submit */}
              <div className="text-center mt-6">
                <p className="font-semibold text-lg mb-2">
                  Grand Total: <span className="text-rose">${grandTotal.toFixed(2)}</span>
                </p>
                <button
                  onClick={handlePlaceOrder}
                  className="bg-rose text-white py-2 px-8 rounded-md hover:bg-softpink hover:text-rose transition"
                >
                  Place Pre-Order
                </button>
              </div>

              {message && <p className="text-center mt-4 text-gray-600">{message}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
