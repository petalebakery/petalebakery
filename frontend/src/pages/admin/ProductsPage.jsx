import { useEffect, useState } from "react";
import axios from "../../api";

// ===== Toast =====
function Toast({ message, type = "info", onClose }) {
  if (!message) return null;
  const bg =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-gray-800";
  return (
    <div
      className={`fixed top-5 right-5 ${bg} text-white px-4 py-3 rounded-lg shadow-lg z-50`}
    >
      <div className="flex items-start gap-3">
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 opacity-80 hover:opacity-100 text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ===== Modal =====
function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b sticky top-0 bg-white rounded-t-xl">
          <h3 className="text-xl font-semibold text-[#4a2f1b]">{title}</h3>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    status: "Active",
    discountType: "none",
    discountValue: "",
    images: [],
    mainImageIndex: 0,
    isBundle: false,
    bundleItems: [],
  });
  const [previewUrls, setPreviewUrls] = useState([]);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editPreviewUrls, setEditPreviewUrls] = useState([]);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), 3000);
  };

  // ===== Fetch Products =====
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/products");
      setProducts(res.data || []);
    } catch {
      showToast("Failed to load products.", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  // ===== File Upload =====
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm({ ...form, images: files });
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
  };

  // ===== Bundle Logic (Create) =====
  const addBundleItem = () => {
    setForm({
      ...form,
      bundleItems: [...form.bundleItems, { name: "", quantity: 1 }],
    });
  };
  const updateBundleItem = (i, field, val) => {
    const updated = [...form.bundleItems];
    updated[i][field] = val;
    setForm({ ...form, bundleItems: updated });
  };
  const removeBundleItem = (i) =>
    setForm({
      ...form,
      bundleItems: form.bundleItems.filter((_, x) => x !== i),
    });

  // ===== Create Product =====
  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "bundleItems") fd.append(k, JSON.stringify(v));
      else if (k !== "images") fd.append(k, v);
    });
    form.images.forEach((f) => fd.append("images", f));
    try {
      await axios.post("/products", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Product added successfully!", "success");
      setForm({
        name: "",
        price: "",
        description: "",
        category: "",
        status: "Active",
        discountType: "none",
        discountValue: "",
        images: [],
        mainImageIndex: 0,
        isBundle: false,
        bundleItems: [],
      });
      setPreviewUrls([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast("Failed to add product.", "error");
    }
  };

  // ===== Edit Product =====
  const openEdit = (p) => {
    setEditing(p);
    setEditForm({
      ...p,
      bundleItems: p.bundleItems || [],
      newImages: [],
    });
    setEditPreviewUrls([]);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(editForm).forEach(([k, v]) => {
      if (k === "bundleItems") fd.append(k, JSON.stringify(v));
      else if (!["images", "newImages"].includes(k)) fd.append(k, v);
    });
    editForm.newImages?.forEach((f) => fd.append("images", f));
    try {
      await axios.put(`/products/${editing._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Product updated!", "success");
      setEditing(null);
      setEditForm(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast("Failed to update product.", "error");
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm(null);
    setEditPreviewUrls([]);
  };

  // ===== Delete =====
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showToast("Product deleted.", "success");
    } catch {
      showToast("Failed to delete product.", "error");
    }
  };

  // ===== Bundle Edit =====
  const addEditBundleItem = () =>
    setEditForm({
      ...editForm,
      bundleItems: [...(editForm.bundleItems || []), { name: "", quantity: 1 }],
    });
  const updateEditBundleItem = (i, field, val) => {
    const updated = [...editForm.bundleItems];
    updated[i][field] = val;
    setEditForm({ ...editForm, bundleItems: updated });
  };
  const removeEditBundleItem = (i) =>
    setEditForm({
      ...editForm,
      bundleItems: editForm.bundleItems.filter((_, x) => x !== i),
    });

  return (
    <div className="min-h-screen bg-[#f9f7f5] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-darkbrown mb-8 text-center">
          Product Management
        </h1>

        {/* === Add Product === */}
        <section className="bg-white rounded-xl shadow-lg p-6 mb-10">
          <h2 className="text-xl font-semibold text-[#b07b4a] mb-4">
            Add New Product
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="Name"
              className="border rounded-md p-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              className="border rounded-md p-2"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              className="border rounded-md p-2 md:col-span-2"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="text"
              placeholder="Category"
              className="border rounded-md p-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <select
              className="border rounded-md p-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Out of Stock</option>
            </select>

            {/* Product Type */}
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="font-medium text-[#4a2f1b]">Product Type:</label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isBundle"
                  checked={!form.isBundle}
                  onChange={() => setForm({ ...form, isBundle: false })}
                />
                Individual
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="isBundle"
                  checked={form.isBundle}
                  onChange={() => setForm({ ...form, isBundle: true })}
                />
                Bundle Box
              </label>
            </div>

            {/* Bundle Items */}
            {form.isBundle && (
              <div className="md:col-span-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-[#b07b4a]">
                    Bundle Items
                  </h3>
                  <button
                    type="button"
                    onClick={addBundleItem}
                    className="bg-rose text-white text-sm px-3 py-1 rounded-md hover:bg-softpink hover:text-rose"
                  >
                    + Add Cookie
                  </button>
                </div>
                {form.bundleItems.map((item, i) => (
                  <div key={i} className="flex flex-wrap gap-3 mb-3 bg-[#faf5ef] p-3 rounded-lg">
                    <input
                      type="text"
                      placeholder="Cookie Name"
                      className="border rounded-md p-2 flex-1"
                      value={item.name}
                      onChange={(e) => updateBundleItem(i, "name", e.target.value)}
                    />
                    <input
                      type="number"
                      min="1"
                      className="border rounded-md p-2 w-24"
                      value={item.quantity}
                      onChange={(e) => updateBundleItem(i, "quantity", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeBundleItem(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Images */}
            <input
              type="file"
              multiple
              accept="image/*"
              className="border rounded-md p-2 md:col-span-2"
              onChange={handleFileChange}
            />
            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 md:col-span-2">
                {previewUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="preview"
                    className={`w-20 h-20 object-cover rounded-lg border ${
                      form.mainImageIndex === i ? "border-rose" : "border-gray-300"
                    } cursor-pointer`}
                    onClick={() => setForm({ ...form, mainImageIndex: i })}
                  />
                ))}
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-[#b07b4a] text-white px-6 py-2 rounded-md hover:bg-[#8c6239]"
              >
                Add Product
              </button>
            </div>
          </form>
        </section>

        {/* === Product List === */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#b07b4a] mb-4">
            Current Products
          </h2>
          {loading ? (
            <p>Loading…</p>
          ) : products.length === 0 ? (
            <p>No products yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-3 pr-4">Image</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id} className="border-b">
                      <td className="py-2 pr-4">
                        {p.images?.length ? (
                          <img
                            src={`http://localhost:5000${p.images[p.mainImageIndex || 0]}`}
                            alt={p.name}
                            className="h-14 w-14 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-14 w-14 bg-gray-100 rounded-md" />
                        )}
                      </td>
                      <td className="py-2 pr-4">{p.name}</td>
                      <td className="py-2 pr-4">
                        {p.isBundle ? "Bundle Box" : "Individual"}
                      </td>
                      <td className="py-2 pr-4">${p.price?.toFixed(2)}</td>
                      <td className="py-2 pr-4 flex gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-blue-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* === Edit Modal === */}
      <Modal
        open={!!editing}
        title={editing ? `Edit: ${editing.name}` : ""}
        onClose={cancelEdit}
      >
        {editForm && (
          <form onSubmit={saveEdit} className="grid gap-4">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="border rounded-md p-2"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              className="border rounded-md p-2"
              required
            />
            <textarea
              value={editForm.description || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              placeholder="Description"
              className="border rounded-md p-2 resize-y min-h-[80px]"
            />

            {/* === Bundle Editor === */}
            {editForm.isBundle && (
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[#b07b4a] font-semibold text-lg">
                    Edit Bundle Items
                  </h3>
                  <button
                    type="button"
                    onClick={addEditBundleItem}
                    className="bg-rose text-white text-xs px-3 py-1 rounded-md hover:bg-softpink hover:text-rose"
                  >
                    + Add Cookie
                  </button>
                </div>
                {editForm.bundleItems?.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 mb-3 bg-[#faf5ef] p-3 rounded-lg"
                  >
                    <input
                      type="text"
                      className="border rounded-md p-2 flex-1"
                      value={item.name}
                      onChange={(e) =>
                        updateEditBundleItem(i, "name", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="1"
                      className="border rounded-md p-2 w-20"
                      value={item.quantity}
                      onChange={(e) =>
                        updateEditBundleItem(i, "quantity", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeEditBundleItem(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-rose text-white px-4 py-2 rounded-md hover:bg-softpink hover:text-rose transition"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Toast {...toast} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}
