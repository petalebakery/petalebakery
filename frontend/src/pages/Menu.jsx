import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api";

export default function Menu() {
  // ✅ Safe cart initialization
  const [cart, setCart] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("cart"));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);

  // 🧁 Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("/products");
        setProducts(res.data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  // 🧺 Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ➕ Add to cart
  const addToCart = (product) => {
    const existing = cart.find((p) => p._id === product._id);
    if (existing) {
      setCart(
        cart.map((p) =>
          p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // 🔄 Update quantity
  const updateQuantity = (productId, delta) => {
    const updated = cart
      .map((p) =>
        p._id === productId
          ? { ...p, quantity: Math.max(0, p.quantity + delta) }
          : p
      )
      .filter((p) => p.quantity > 0);
    setCart(updated);
  };

  // 🧮 Get quantity
  const getQuantity = (id) => {
    const found = cart.find((p) => p._id === id);
    return found ? found.quantity : 0;
  };

  // 🖼️ Helper for image URLs
  const imgSrc = (p) => {
    if (p.images && p.images.length > 0) {
      const index =
        typeof p.mainImageIndex === "number" && p.mainImageIndex < p.images.length
          ? p.mainImageIndex
          : 0;
      const selected = p.images[index];
      const path = selected.startsWith("/uploads")
        ? selected
        : `/uploads/${selected}`;
      return `http://localhost:5000${path}`;
    }
    if (p.imageUrl) return `http://localhost:5000${p.imageUrl}`;
    return "https://via.placeholder.com/200x200?text=No+Image";
  };

  return (
    <div className="p-10 bg-cream min-h-screen">
      <h1 className="text-4xl font-bold text-center text-rose mb-10">
        Our Sweet Menu 🍰
      </h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          No products yet — check back soon! 🧁
        </p>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-10">
          {products.map((p) => {
            const qty = getQuantity(p._id);
            return (
              <div
                key={p._id}
                className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition p-4 flex flex-col items-center border border-[#f0e7e0]"
              >
                {/* ✨ Bundle Badge */}
                {p.isBundle && (
                  <div className="absolute top-3 left-3 z-10 bg-[#b07b4a] text-white text-xs px-3 py-1 rounded-full shadow">
                    ✨ Pétale Box
                  </div>
                )}

                {/* Product Image */}
                <Link to={`/product/${p._id}`} className="block w-full">
                  <div className="relative w-full flex justify-center">
                    <img
                      src={imgSrc(p)}
                      alt={p.name}
                      className="w-48 h-48 object-cover rounded-lg mb-4 hover:opacity-90 transition"
                    />
                  </div>
                </Link>

                {/* Product Info */}
                <h2 className="text-xl font-semibold text-gray-800 mb-1 text-center">
                  {p.name}
                </h2>

                <p
                  className="text-gray-600 text-sm mb-2 text-center"
                  style={{
                    maxHeight: "4.5em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.description}
                </p>

                {p.description?.length > 120 && (
                  <button
                    onClick={() => setModalProduct(p)}
                    className="text-rose text-sm underline hover:text-softpink mb-2"
                  >
                    Read more
                  </button>
                )}

                {/* 💰 Price */}
                <p className="text-rose font-bold text-lg mb-3">
                  ${p.price?.toFixed(2) ?? "—"}
                </p>

                {/* 🍪 Bundle Items */}
                {p.isBundle && p.bundleItems?.length > 0 && (
                  <div className="w-full border-t border-[#f0e7e0] pt-2 mt-1">
                    <p className="text-[#b07b4a] text-sm font-semibold text-center mb-1">
                      Includes:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {p.bundleItems.map((item, i) => (
                        <span
                          key={i}
                          className="bg-[#faf5ef] border border-[#e2d8cb] text-gray-700 text-xs px-3 py-1 rounded-full"
                        >
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🛒 Add to Cart */}
                <div className="mt-4">
                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(p)}
                      className="bg-rose text-white py-2 px-6 rounded-md hover:bg-softpink hover:text-rose transition"
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(p._id, -1)}
                        className="bg-gray-200 px-2 py-1 rounded text-lg"
                      >
                        −
                      </button>
                      <span className="font-semibold">{qty}</span>
                      <button
                        onClick={() => updateQuantity(p._id, 1)}
                        className="bg-gray-200 px-2 py-1 rounded text-lg"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🌸 Scrollable Modal */}
      {modalProduct && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-[90%] max-h-[90vh] overflow-y-auto p-6">
            <button
              onClick={() => setModalProduct(null)}
              className="sticky top-2 right-2 float-right text-gray-500 hover:text-rose text-lg z-50"
            >
              ✕
            </button>

            <img
              src={imgSrc(modalProduct)}
              alt={modalProduct.name}
              className="w-64 h-64 object-cover rounded-lg mx-auto mb-4"
            />

            <h2 className="text-2xl font-bold text-center text-rose mb-2">
              {modalProduct.name}
            </h2>

            <div className="text-gray-700 text-center mb-4 whitespace-pre-line">
              {modalProduct.description}
            </div>

            {/* 🌸 Bundle Details */}
            {modalProduct.isBundle && modalProduct.bundleItems?.length > 0 && (
              <div className="border-t border-[#f0e7e0] pt-3 mt-3">
                <h4 className="text-center text-[#b07b4a] font-semibold mb-2">
                  Included Cookies:
                </h4>
                <ul className="grid grid-cols-2 gap-2 text-gray-700 text-sm">
                  {modalProduct.bundleItems.map((item, i) => (
                    <li
                      key={i}
                      className="bg-[#faf5ef] px-3 py-2 rounded-md border border-[#e2d8cb] text-center"
                    >
                      {item.name} ×{item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-center text-rose font-semibold text-xl my-4">
              ${modalProduct.price?.toFixed(2) ?? "—"}
            </p>

            <div className="flex justify-center pb-6">
              <button
                onClick={() => {
                  addToCart(modalProduct);
                  setModalProduct(null);
                }}
                className="bg-rose text-white px-6 py-2 rounded-md hover:bg-softpink hover:text-rose transition"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
