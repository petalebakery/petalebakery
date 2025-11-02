import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import ProductDetail from "./pages/ProductDetail";

// 🧁 NEW: Checkout + Success pages
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";

function AppContent() {
  const location = useLocation();

  // Hide Navbar on admin pages
  const hideNavbar = location.pathname.startsWith("/admin");

  return (
    <div className="bg-cream text-gray-800 font-sans overflow-x-hidden min-h-screen">
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* ===== Public Pages ===== */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />

        {/* ✅ Product Detail page */}
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* 🧁 Checkout System */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />

        {/* ===== Admin Pages ===== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
