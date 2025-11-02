// frontend/src/pages/Checkout.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import PreorderDatePicker from "../components/PreorderDatePicker";
import CartSummary from "../components/CartSummary";

const DELIVERY_FEE = 5;

function getCart() {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], customer: { name: "", email: "", phone: "", address: { street: "", city: "", zip: "", instructions: "" } } });
  const [schedule, setSchedule] = useState({ date: "", window: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const c = getCart();
    // If you store customer info in cart, merge it here
    setCart({
      items: Array.isArray(c.items) ? c.items : [],
      customer: c.customer || { name: "", email: "", phone: "", address: { street: "", city: "", zip: "", instructions: "" } },
    });
  }, []);

  const isEmpty = useMemo(() => (cart.items || []).length === 0, [cart]);

  function validate() {
    const e = {};
    if (!cart.customer?.name) e.name = "Name is required";
    if (!cart.customer?.phone) e.phone = "Phone is required";
    if (!cart.customer?.address?.street) e.street = "Street is required";
    if (!cart.customer?.address?.city) e.city = "City is required";
    if (!cart.customer?.address?.zip) e.zip = "ZIP is required";
    if (!schedule.date) e.date = "Pick a date";
    if (!schedule.window) e.window = "Pick a time window";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder() {
    if (!validate()) return;

    setLoading(true);
    try {
      const items = (cart.items || []).map((it) => ({
        productId: it._id,
        name: it.name,
        price: it.price,
        quantity: it.quantity || 1,
        image: Array.isArray(it.images) ? it.images[0] : it.image,
        capacityUnits: it.capacityUnits || 1,
      }));

      const payload = {
        items,
        customer: cart.customer,
        scheduledFor: schedule.date,
        window: schedule.window,
        deliveryFee: DELIVERY_FEE,
      };

      await axios.post("/checkout/create-order", payload);

      // Clear cart
      localStorage.removeItem("cart");
      navigate("/checkout/success", {
        state: {
          date: schedule.date,
          window: schedule.window,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Sorry — we couldn’t place your pre-order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-semibold">Checkout · Delivery Only</h1>

        {isEmpty ? (
          <div className="rounded bg-yellow-50 border border-yellow-200 p-4">
            Your cart is empty.
          </div>
        ) : (
          <>
            {/* Customer Details */}
            <div className="border rounded-xl p-4 bg-white space-y-3">
              <h3 className="font-semibold text-lg">Contact & Delivery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Full name"
                    value={cart.customer.name}
                    onChange={(e) =>
                      setCart((c) => ({ ...c, customer: { ...c.customer, name: e.target.value } }))
                    }
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Email (optional)"
                  value={cart.customer.email}
                  onChange={(e) =>
                    setCart((c) => ({ ...c, customer: { ...c.customer, email: e.target.value } }))
                  }
                />
                <div>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Phone"
                    value={cart.customer.phone}
                    onChange={(e) =>
                      setCart((c) => ({ ...c, customer: { ...c.customer, phone: e.target.value } }))
                    }
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Street"
                    value={cart.customer.address.street}
                    onChange={(e) =>
                      setCart((c) => ({
                        ...c,
                        customer: {
                          ...c.customer,
                          address: { ...c.customer.address, street: e.target.value },
                        },
                      }))
                    }
                  />
                  {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
                </div>
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder="City"
                  value={cart.customer.address.city}
                  onChange={(e) =>
                    setCart((c) => ({
                      ...c,
                      customer: {
                        ...c.customer,
                        address: { ...c.customer.address, city: e.target.value },
                      },
                    }))
                  }
                />
                <div>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    placeholder="ZIP"
                    value={cart.customer.address.zip}
                    onChange={(e) =>
                      setCart((c) => ({
                        ...c,
                        customer: {
                          ...c.customer,
                          address: { ...c.customer.address, zip: e.target.value },
                        },
                      }))
                  }
                  />
                  {errors.zip && <p className="text-xs text-red-600 mt-1">{errors.zip}</p>}
                </div>
                <textarea
                  className="border rounded px-3 py-2 w-full md:col-span-2"
                  placeholder="Delivery instructions (optional)"
                  value={cart.customer.address.instructions}
                  onChange={(e) =>
                    setCart((c) => ({
                      ...c,
                      customer: {
                        ...c.customer,
                        address: { ...c.customer.address, instructions: e.target.value },
                      },
                    }))
                  }
                />
              </div>
            </div>

            {/* Preorder Date & Window */}
            <div className="border rounded-xl p-4 bg-white space-y-2">
              <PreorderDatePicker value={schedule.date} onChange={setSchedule} />
              <p className="text-xs text-gray-500">
                48-hour lead time. Closed Mon & Tue. Thu–Sat deliveries end by 3pm; Sun deliveries start at 5pm.
              </p>
              {(errors.date || errors.window) && (
                <p className="text-xs text-red-600">
                  {errors.date || errors.window}
                </p>
              )}
            </div>

            <button
              disabled={loading || isEmpty}
              onClick={placeOrder}
              className="w-full md:w-auto border rounded px-4 py-2 bg-rose-100 hover:bg-rose-200 disabled:opacity-50"
            >
              {loading ? "Placing Pre-Order…" : "Place Pre-Order"}
            </button>
          </>
        )}
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <CartSummary items={cart.items} deliveryFee={DELIVERY_FEE} />
      </div>
    </div>
  );
}
