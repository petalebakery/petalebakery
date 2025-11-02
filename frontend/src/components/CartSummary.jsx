// frontend/src/components/CartSummary.jsx
export default function CartSummary({ items, deliveryFee = 5 }) {
  const subtotal = Number(
    (items || []).reduce((s, it) => s + (Number(it.price) || 0) * (it.quantity || 1), 0).toFixed(2)
  );
  const total = Number((subtotal + deliveryFee).toFixed(2));

  return (
    <div className="border rounded-xl p-4 bg-white space-y-2">
      <h3 className="font-semibold text-lg">Order Summary</h3>
      <ul className="space-y-1 text-sm">
        {(items || []).map((it, i) => (
          <li key={i} className="flex justify-between">
            <span className="truncate">{it.quantity || 1} × {it.name}</span>
            <span>${((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="h-px bg-gray-200 my-2" />
      <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
      <div className="flex justify-between text-sm"><span>Delivery</span><span>${deliveryFee.toFixed(2)}</span></div>
      <div className="flex justify-between font-semibold">
        <span>Total</span><span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
