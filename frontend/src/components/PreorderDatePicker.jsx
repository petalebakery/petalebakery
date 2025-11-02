// frontend/src/components/PreorderDatePicker.jsx
import { useEffect, useState } from "react";
import axios from "../api";

export default function PreorderDatePicker({ value, onChange }) {
  const [date, setDate] = useState(value || "");
  const [windows, setWindows] = useState([]);
  const [isBlackout, setIsBlackout] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!date) return;
    axios
      .get(`/preorder/availability`, { params: { date } })
      .then((res) => {
        setWindows(res.data.windows || []);
        setIsBlackout(!!res.data.isBlackout);
        setReason(res.data.reason || "");
      })
      .catch(() => {
        setWindows([]);
        setIsBlackout(true);
        setReason("Server error");
      });
  }, [date]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Choose delivery date</label>
      <input
        type="date"
        className="border rounded px-3 py-2"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          onChange?.({ date: e.target.value, window: "" });
        }}
      />

      {isBlackout && date && (
        <p className="text-xs text-red-600">Not available ({reason}). Please choose another date.</p>
      )}

      {!isBlackout && windows?.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Available delivery windows</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {windows.map((w) => (
              <button
                key={w.window}
                disabled={w.remaining <= 0}
                className={`border rounded px-3 py-2 text-sm ${
                  w.remaining <= 0 ? "opacity-40 cursor-not-allowed" : "hover:shadow"
                }`}
                onClick={() => onChange?.({ date, window: w.window })}
              >
                {w.window} · {Math.max(0, w.remaining)} left
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
