import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-brown shadow-md h-16 px-8 flex justify-between items-center sticky top-0 z-50">
      {/* 🌸 Logo */}
      <Link to="/" className="flex items-center">
        <img
          src="/images/PetaleBakeryLogo.png"
          alt="Pétale Bakery Logo"
          className="h-12 md:h-14 w-auto object-contain block transition-opacity duration-300 hover:opacity-90"
          style={{
            display: "block",
            margin: 0,
            padding: 0,
          }}
        />
      </Link>

      {/* 🌷 Navigation Links */}
      <div className="flex gap-6 font-medium text-base">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "text-cream underline" : "text-cream hover:text-rose"
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/menu"
          className={({ isActive }) =>
            isActive ? "text-rose underline" : "text-cream hover:text-rose"
          }
        >
          Menu
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "text-rose underline" : "text-cream hover:text-rose"
          }
        >
          About
        </NavLink>

        <NavLink
          to="/contact"
          className={({ isActive }) =>
            isActive ? "text-rose underline" : "text-cream hover:text-rose"
          }
        >
          Contact
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            isActive ? "text-rose underline" : "text-cream hover:text-rose"
          }
        >
          🛒 Cart
        </NavLink>
      </div>
    </nav>
  );
}
