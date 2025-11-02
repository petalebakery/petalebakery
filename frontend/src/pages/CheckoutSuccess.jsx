// frontend/src/pages/CheckoutSuccess.jsx
import { useLocation, Link } from "react-router-dom";

export default function CheckoutSuccess() {
  const { state } = useLocation() || {};
  const date = state?.date;
  const window = state?.window;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 space-y-3">
        <h1 className="text-2xl font-semibold text-green-800">Pre-order received!</h1>
        <p className="text-sm text-green-900">
          Thank you — we’ll text/email your delivery confirmation shortly.
        </p>
        {date && window && (
          <p className="text-sm text-green-900">
            <b>Scheduled:</b> {date} · {window}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Link to="/" className="underline text-rose">Back to shop</Link>
      </div>
    </div>
  );
}
