import { Link } from "react-router-dom";

export default function Home() {
  const floralSrc = `${import.meta.env.BASE_URL}floral.png`;

  return (
    <div className="relative bg-cream text-darkbrown font-sans overflow-x-hidden overflow-y-visible">
      {/* 🌸 Hero + Floral Background Wrapper */}
      <div className="relative overflow-hidden">
        {/* Floral image layer — ends right before the divider */}
        <div className="absolute inset-0 h-[100vh] overflow-hidden">
          <img
            src={floralSrc}
            alt="Floral background"
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-auto object-cover pointer-events-none"
            style={{
              opacity: 0.25, // slightly fainter
            }}
          />
          {/* Soft fade at the bottom so it vanishes before divider */}
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-b from-transparent to-[#fffaf1] pointer-events-none" />
        </div>

        {/* Hero Section */}
        <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          <img
            src="/hero-bg.jpg"
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          />
          <div className="absolute inset-0 bg-cream/40 pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-6xl md:text-7xl font-serif font-semibold text-darkbrown mb-6 drop-shadow-sm">
              Pétale Bakery
            </h1>
            <p className="text-lg md:text-xl text-darkbrown/80 mb-10 leading-relaxed">
              Handcrafted indulgence inspired by French patisseries — elegant,
              floral, and made with love.
            </p>
            <Link
              to="/menu"
              className="bg-brown text-cream px-10 py-3 rounded-full text-lg uppercase tracking-wide shadow-md hover:bg-taupe hover:text-darkbrown transition-all duration-300"
            >
              Explore the Menu
            </Link>
          </div>
        </section>

        {/* Divider — floral stops right above this line */}
        <div className="relative z-10 h-px bg-taupe/30 mx-auto w-3/4 my-16"></div>
      </div>

      {/* 🍰 Signature Collection */}
      <section className="relative z-10 py-24 px-6 text-center bg-cream">
        <h2 className="text-4xl md:text-5xl font-serif text-darkbrown mb-6">
          Signature Collection
        </h2>
        <p className="text-darkbrown/70 max-w-2xl mx-auto mb-16 leading-relaxed">
          Discover our most beloved creations — from delicate macarons to buttery
          cookies and petite cakes crafted to perfection.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {[
            {
              src: "/macarons.jpg",
              title: "Parisian Macarons",
              desc: "Delicate almond shells filled with silky ganache — rose, pistachio, and vanilla.",
            },
            {
              src: "/cookies.jpg",
              title: "Signature Cookies",
              desc: "Golden, buttery perfection with Belgian chocolate and a soft, warm center.",
            },
            {
              src: "/cakes.jpg",
              title: "Petite Cakes",
              desc: "Velvety layers of sponge and cream infused with seasonal flavors.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="p-8">
                <h3 className="text-2xl font-serif text-darkbrown mb-2">
                  {item.title}
                </h3>
                <p className="text-darkbrown/70 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-taupe/30 mx-auto w-3/4 my-16"></div>

      {/* 🌷 The Art of Petalé */}
      <section className="py-24 px-8 text-center bg-softpink/20">
        <h2 className="text-5xl font-serif text-darkbrown mb-6">
          The Art of Petalé
        </h2>
        <p className="max-w-3xl mx-auto text-darkbrown/80 leading-relaxed text-lg">
          Each creation at Petalé Bakery is more than dessert — it’s an experience.
          Inspired by timeless French tradition and delicate floral design, we craft
          every pastry with precision, grace, and a sprinkle of magic.
        </p>
      </section>

      {/* Divider */}
      <div className="h-px bg-taupe/30 mx-auto w-3/4 my-16"></div>

      {/* 🌹 Final Call */}
      <section className="text-center py-20">
        <h3 className="text-3xl md:text-4xl font-serif text-darkbrown mb-6">
          Taste the Difference of Handcrafted Luxury
        </h3>
        <Link
          to="/contact"
          className="bg-brown text-cream px-10 py-3 rounded-full text-lg tracking-wide uppercase shadow-md hover:bg-taupe transition-all duration-300"
        >
          Place an Order
        </Link>
      </section>
    </div>
  );
}
