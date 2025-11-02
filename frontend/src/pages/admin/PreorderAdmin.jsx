// frontend/src/pages/admin/PreorderAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "../../api";

function todayISO(deltaDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export default function PreorderAdmin() {
  const [date, setDate] = useState(todayISO(2)); // default to >= 48h out
  const [availability, setAvailability] = useState({ windows: [], isBlackout: false, date: "" });
  const [loading, setLoading] = useState(false);
  const [capacityEdit, setCapacityEdit] = useState({}); // { [window]: "32" }
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const windows = useMemo(() => availability?.windows || [], [availability]);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    axios
      .get("/preorder/availability", { params: { date } }) // matches your axios base
      .then((res) => setAvailability(res.data))
      .catch(() => setAvailability({ windows: [], isBlackout: true, date, reason: "Server error" }))
      .finally(() => setLoading(false));
  }, [date]);

  const refresh = async () => {
    const res = await axios.get("/preorder/availability", { params: { date } });
    setAvailability(res.data);
  };

  function editCap(win, val) {
    setCapacityEdit((s) => ({ ...s, [win]: val }));
  }

  async function saveCap(win) {
    const cap = Number(capacityEdit[win]);
    if (!Number.isFinite(cap) || cap < 0) return alert("Enter a valid capacity number.");
    setBusy(true);
    try {
      await axios.post("/admin/preorder/capacity", { date, window: win, capacity: cap });
      setToast(`Saved capacity for ${win}`);
      setCapacityEdit((s) => ({ ...s, [win]: "" }));
      await refresh();
    } finally {
      setBusy(false);
      setTimeout(() => setToast(""), 2000);
    }
  }

  async function toggleBlackout(on) {
    setBusy(true);
    try {
      await axios.post("/admin/preorder/blackout", { date, isBlackout: on });
      setToast(on ? "Blackout set for this date" : "Blackout removed");
      await refresh();
    } finally {
      setBusy(false);
      setTimeout(() => setToast(""), 2000);
    }
  }

  return (
    <div className="bg-[#f9f7f5] min-h-screen p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-[#4a2f1b] text-center mb-8">
        Pre-Orders · Delivery Windows
      </h1>

      {toast && (
        <div className="rounded bg-green-100 text-green-800 px-3 py-2 text-sm mb-4 text-center">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-6">
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Tip: choose ≥ 2 days from today.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => toggleBlackout(true)}
            disabled={busy}
            className="border rounded px-3 py-2 bg-rose text-white hover:bg-softpink hover:text-rose"
          >
            Set Blackout
          </button>
          <button
            onClick={() => toggleBlackout(false)}
            disabled={busy}
            className="border rounded px-3 py-2"
          >
            Remove Blackout
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading windows…</p>
      ) : availability.isBlackout ? (
        <div className="rounded bg-yellow-50 border border-yellow-200 p-3">
          <div className="font-medium">This date is not available.</div>
          <div className="text-sm text-gray-600">Reason: {availability.reason || "Blackout/Lead time"}</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {windows.map((w) => (
            <div key={w.window} className="bg-white rounded-xl shadow p-5 border border-cream">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-chocolate">{w.window}</div>
                <div className="text-xs text-gray-500">Remaining: <b>{w.remaining}</b></div>
              </div>
              <div className="text-sm text-gray-700 mb-3">
                Capacity: <b>{w.capacity}</b> · Reserved: <b>{w.reserved}</b>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="New capacity"
                  value={capacityEdit[w.window] ?? ""}
                  onChange={(e) => editCap(w.window, e.target.value)}
                  className="border rounded px-2 py-1 w-32"
                />
                <button
                  className="border rounded px-3 py-1 text-sm"
                  onClick={() => saveCap(w.window)}
                  disabled={busy}
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
