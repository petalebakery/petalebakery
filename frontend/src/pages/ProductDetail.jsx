import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../api";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // 🧺 Keep cart synced with localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ➕ Add to cart
  const addToCart = (p) => {
    const existing = cart.find((item) => item._id === p._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === p._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...p, quantity: 1 }]);
    }
  };

  // 🧮 Get quantity in cart
  const getQuantity = (id) => {
    const found = cart.find((p) => p._id === id);
    return found ? found.quantity : 0;
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-cream">
        <p className="text-rose text-lg font-semibold animate-pulse">
          Loading product...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-cream">
        <p className="text-red-500 font-semibold">{error}</p>
      </div>
    );

  if (!product)
    return (
      <div className="flex justify-center items-center h-screen bg-cream">
        <p className="text-gray-700 font-semibold">Product not found.</p>
      </div>
    );

  // 🖼️ Image helper
  const imgSrc = (img) => {
    const path = img.startsWith("/uploads") ? img : `/uploads/${img}`;
    return `http://localhost:5000${path}`;
  };

  // 🧁 Reorder images so main image comes first
  const getOrderedImages = () => {
    if (!product.images || product.images.length === 0) return [];
    const mainIndex =
      typeof product.mainImageIndex === "number" &&
      product.mainImageIndex < product.images.length
        ? product.mainImageIndex
        : 0;
    const images = [...product.images];
    const [mainImage] = images.splice(mainIndex, 1);
    return [mainImage, ...images];
  };

  const orderedImages = getOrderedImages();

  // 🍪 Detect if it's chocolate chip
  const isChocolateChip =
    product.name?.toLowerCase().includes("chocolate chip");

  // 🧁 Petalé Bakery Chocolate Chip Info
  const chocolateChipInfo = isChocolateChip
    ? {
        description:
          "Our signature chocolate chip cookie is thick, golden, and irresistibly soft in the center. Each bite is packed with rich, melted chocolate and a buttery warmth that melts in your mouth. Big enough to share, but you’ll want to keep it all to yourself.",
        ingredients:
          "All-purpose flour, unsalted butter, light brown sugar, granulated sugar, egg, vanilla extract, baking soda, baking powder, kosher salt, semi-sweet chocolate chips, flaky sea salt.",
        allergens:
          "Contains: Wheat, Milk, Eggs, Soy (from chocolate). May contain traces of tree nuts and peanuts.",
        nutrition: [
          { label: "Calories", value: "~420 kcal" },
          { label: "Total Fat", value: "21g" },
          { label: "Saturated Fat", value: "13g" },
          { label: "Cholesterol", value: "65mg" },
          { label: "Sodium", value: "190mg" },
          { label: "Carbohydrates", value: "55g" },
          { label: "Sugars", value: "32g" },
          { label: "Protein", value: "4g" },
        ],
        storage:
          "Shelf life: 3–4 days at room temperature or 7 days refrigerated. Best enjoyed warm for 10 seconds.",
      }
    : null;

  const qty = getQuantity(product._id);

  return (
    <div className="min-h-screen bg-cream py-10 px-5 flex flex-col items-center">
      <div className="max-w-5xl bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <Link
          to="/menu"
          className="text-rose font-semibold hover:underline mb-4 inline-block"
        >
          ← Back to Menu
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          {/* ===== ALL IMAGES STACKED VERTICALLY ===== */}
          <div className="flex flex-col gap-5 justify-start items-center">
            {orderedImages.length > 0 ? (
              orderedImages.map((img, i) => (
                <img
                  key={i}
                  src={imgSrc(img)}
                  alt={`${product.name} ${i + 1}`}
                  className={`w-80 h-80 object-cover rounded-xl shadow-md ${
                    i === 0 ? "ring-4 ring-rose/40" : ""
                  }`}
                />
              ))
            ) : (
              <img
                src="https://via.placeholder.com/400x400?text=No+Image"
                alt="No product"
                className="w-80 h-80 object-cover rounded-xl shadow-md"
              />
            )}
          </div>

          {/* ===== PRODUCT INFO ===== */}
          <div>
            <h1 className="text-3xl font-bold text-chocolate mb-2">
              {product.name}
            </h1>
            <p className="text-gray-700 mb-4 leading-relaxed">
              {isChocolateChip
                ? chocolateChipInfo.description
                : product.description}
            </p>

            <p className="text-rose font-bold text-2xl mb-6">
              ${product.price?.toFixed(2) ?? "—"}
            </p>

            {qty === 0 ? (
              <button
                onClick={() => addToCart(product)}
                className="bg-rose text-white px-8 py-3 rounded-lg hover:bg-softpink hover:text-rose transition"
              >
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setCart(
                      cart
                        .map((p) =>
                          p._id === product._id
                            ? { ...p, quantity: Math.max(0, p.quantity - 1) }
                            : p
                        )
                        .filter((p) => p.quantity > 0)
                    )
                  }
                  className="bg-gray-200 px-3 py-1 rounded text-lg"
                >
                  −
                </button>
                <span className="text-lg font-semibold">{qty}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-gray-200 px-3 py-1 rounded text-lg"
                >
                  +
                </button>
              </div>
            )}

            {/* ===== CHOCOLATE CHIP INFO ===== */}
            {isChocolateChip && (
              <div className="mt-8 space-y-5 text-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-chocolate mb-2">
                    Ingredients
                  </h2>
                  <p>{chocolateChipInfo.ingredients}</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-chocolate mb-2">
                    Allergens
                  </h2>
                  <p>{chocolateChipInfo.allergens}</p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-chocolate mb-2">
                    Nutrition Facts (per cookie)
                  </h2>
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <tbody>
                      {chocolateChipInfo.nutrition.map((n, i) => (
                        <tr
                          key={i}
                          className={`border-b border-gray-100 ${
                            i % 2 === 0 ? "bg-cream/50" : "bg-white"
                          }`}
                        >
                          <td className="py-2 px-4">{n.label}</td>
                          <td className="py-2 px-4 text-right font-semibold">
                            {n.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-chocolate mb-2">
                    Storage & Serving
                  </h2>
                  <p>{chocolateChipInfo.storage}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
