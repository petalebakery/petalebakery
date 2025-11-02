import { useEffect, useState } from "react";
import axios from "../api";

// Import subpages
import ProductsPage from "./admin/ProductsPage";
import FinancesPage from "./admin/FinancesPage";
import RefundsPage from "./admin/RefundsPage";
import SettingsPage from "./admin/SettingsPage";
import PreorderAdmin from "./admin/PreorderAdmin";

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [selectedStage, setSelectedStage] = useState("Pending");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "" });

  const stages = [
    "Pending",
    "In Progress",
    "Done",
    "For Delivery",
    "Delivered",
    "Rejected",
  ];

  const showToast = (msg, type = "info") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  // 🔁 Fetch Orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/orders");
      setOrders(res.data);
    } catch {
      showToast("Failed to load orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === "orders") fetchOrders();
  }, [activePage]);

  // ✅ Update Order Stage
  const updateStage = async (id, stage) => {
    try {
      await axios.put(`/orders/${id}`, { stage });
      showToast(`Order moved to ${stage}.`, "success");
      await fetchOrders();
      setSelectedOrder(null);
    } catch {
      showToast("Failed to update order stage.", "error");
    }
  };

  // ❌ Reject Order + Auto Refresh
  const rejectOrder = async (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    try {
      await axios.put(`/orders/${id}/reject`, { reason });
      showToast("Order rejected and removed.", "error");
      setOrders((prev) => prev.filter((o) => o._id !== id)); // 🔥 instantly remove from UI
      setSelectedOrder(null); // close modal immediately
    } catch {
      showToast("Failed to reject order.", "error");
    }
  };

  // 🧾 Render Orders
  const renderOrdersPage = () => {
    const filtered = orders.filter((o) => o.stage === selectedStage);

    return (
      <div className="bg-[#f9f7f5] min-h-screen p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#4a2f1b] text-center mb-8">
          Order Management
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-4 py-2 rounded-full border transition-all ${
                selectedStage === stage
                  ? "bg-darkbrown text-white border-darkbrown"
                  : "bg-white border-gray-300 hover:bg-taupe/10"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading orders...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            No {selectedStage.toLowerCase()} orders right now
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow p-5 border border-cream hover:shadow-lg transition"
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold text-lg text-chocolate">
                    {order.name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {order.deliveryDate
                      ? new Date(order.deliveryDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>

                <p className="text-gray-700 text-sm">
                  <b>Total:</b> ${Number(order.total || 0).toFixed(2)}
                </p>
                <p className="text-gray-700 text-sm">
                  <b>Time:</b> {order.deliveryTime || "—"}
                </p>
                <p className="text-gray-700 text-sm truncate">
                  <b>Address:</b>{" "}
                  {order.address
                    ? `${order.address.street || ""}${
                        order.address.city ? ", " + order.address.city : ""
                      }`
                    : "N/A"}
                </p>

                <button
                  onClick={() => setSelectedOrder(order)}
                  className="mt-3 text-rose font-semibold underline hover:text-softpink"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 relative shadow-xl overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-3 right-3 text-gray-600 hover:text-rose text-xl"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-rose mb-2">
                {selectedOrder.name}
              </h2>
              <p className="text-gray-700 mb-3">{selectedOrder.email}</p>

              <h3 className="font-semibold text-lg text-chocolate mb-2">
                Order Details
              </h3>
              <ul className="list-disc pl-5 text-gray-700 mb-3">
                {(selectedOrder.products || []).map((p, i) => (
                  <li key={i}>
                    {p.quantity} × {p.name} — ${Number(p.price || 0).toFixed(2)}
                  </li>
                ))}
              </ul>

              <p className="text-gray-700">
                <b>Total:</b> ${Number(selectedOrder.total || 0).toFixed(2)}
              </p>
              <p className="text-gray-700">
                <b>Tip:</b> $
                {selectedOrder.tip != null
                  ? Number(selectedOrder.tip).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-gray-700">
                <b>Stage:</b> {selectedOrder.stage}
              </p>

              {selectedOrder.notes && (
                <p className="text-gray-700 mt-3">
                  <b>Notes:</b> {selectedOrder.notes}
                </p>
              )}

              {selectedOrder.address && (
                <div className="mt-3">
                  <h3 className="font-semibold text-lg text-chocolate mb-1">
                    Delivery Address
                  </h3>
                  <p className="text-gray-700">
                    {selectedOrder.address.street || ""}{" "}
                    {selectedOrder.address.city || ""}{" "}
                    {selectedOrder.address.zip || ""}
                  </p>
                  {selectedOrder.address.instructions ? (
                    <p className="text-gray-700 italic">
                      {selectedOrder.address.instructions}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 mt-6">
                {selectedOrder.stage === "Pending" && (
                  <>
                    <button
                      onClick={() =>
                        updateStage(selectedOrder._id, "In Progress")
                      }
                      className="bg-rose text-white px-4 py-2 rounded-md hover:bg-softpink hover:text-rose"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectOrder(selectedOrder._id)}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedOrder.stage === "In Progress" && (
                  <button
                    onClick={() => updateStage(selectedOrder._id, "Done")}
                    className="bg-[#b07b4a] text-white px-4 py-2 rounded-md hover:bg-[#8c6239]"
                  >
                    Mark Done
                  </button>
                )}
                {selectedOrder.stage === "Done" && (
                  <button
                    onClick={() =>
                      updateStage(selectedOrder._id, "For Delivery")
                    }
                    className="bg-[#b07b4a] text-white px-4 py-2 rounded-md hover:bg-[#8c6239]"
                  >
                    Ready for Delivery
                  </button>
                )}
                {selectedOrder.stage === "For Delivery" && (
                  <button
                    onClick={() => updateStage(selectedOrder._id, "Delivered")}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast.message && (
          <div
            className={`fixed bottom-5 right-5 text-white px-4 py-3 rounded-md shadow-md ${
              toast.type === "error" ? "bg-red-600" : "bg-rose"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  };

  // 🔀 Sidebar Navigation
  const renderContent = () => {
    switch (activePage) {
      case "orders":
        return renderOrdersPage();
      case "products":
        return <ProductsPage />;
      case "finances":
        return <FinancesPage />;
      case "refunds":
        return <RefundsPage />;
      case "settings":
        return <SettingsPage />;
      case "preorders":
        return <PreorderAdmin />;
      default:
        return renderOrdersPage();
    }
  };

  return (
    <div className="h-screen flex bg-cream text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-taupe text-darkbrown flex flex-col p-6 shadow-lg h-full fixed left-0 top-0 overflow-hidden">
        <h1 className="text-2xl font-bold mb-8 text-center">Petalé Admin</h1>
        <nav className="flex flex-col gap-3">
          {[
            { key: "orders", label: "Orders" },
            { key: "products", label: "Products" },
            { key: "finances", label: "Finances" },
            { key: "refunds", label: "Refunds" },
            { key: "settings", label: "Settings" },
            { key: "preorders", label: "Pre-Orders" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              className={`text-left px-4 py-2 rounded-md transition font-medium ${
                activePage === item.key
                  ? "bg-[#6b4b2d] text-cream"
                  : "bg-darkbrown text-cream hover:bg-[#7c5633]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-softpink text-center text-sm">
          <button
            onClick={() => {
              localStorage.removeItem("adminToken");
              window.location.href = "/admin";
            }}
            className="text-cream bg-darkbrown hover:bg-[#8b6747] px-4 py-2 rounded-md mt-4 transition"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10 overflow-y-auto h-screen relative">
        {renderContent()}
      </main>
    </div>
  );
}
