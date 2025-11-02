// backend/services/preorderService.js
import PreorderSlot from "../models/PreorderSlot.js";
import { PREORDER_CONFIG } from "../config/preorder.js";

// Normalize all date keys to "YYYY-MM-DD"
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// Reserve capacity for a given date and time window (atomic)
export async function reserveCapacity({ date, window, qty }) {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate || !window || !qty)
    throw new Error("Invalid reservation parameters");

  const capacity = PREORDER_CONFIG.defaultCapacityPerWindow;

  // Ensure the slot exists with defaults
  await PreorderSlot.updateOne(
    { date: normalizedDate, window },
    { $setOnInsert: { capacity, reserved: 0, isBlackout: false } },
    { upsert: true }
  );

  // Atomic increment guarded by capacity
  const updated = await PreorderSlot.findOneAndUpdate(
    { date: normalizedDate, window },
    { $inc: { reserved: qty } },
    { new: true }
  );

  if (!updated) throw new Error("Capacity reservation failed");
  if (updated.reserved > updated.capacity) {
    await PreorderSlot.updateOne({ _id: updated._id }, { $inc: { reserved: -qty } });
    throw new Error("Sold out");
  }

  console.log(
    `✅ Reserved ${qty} for ${normalizedDate} (${window}) — total reserved now ${updated.reserved}`
  );
  return updated;
}

// Release capacity (atomic, clamps at 0)
export async function releaseCapacity({ date, window, qty }) {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate || !window || !qty) return;

  const slot = await PreorderSlot.findOne({
    date: normalizedDate,
    window,
  });
  if (!slot) {
    console.warn(
      `⚠️ Slot not found for release: ${normalizedDate} ${window}`
    );
    return;
  }

  const dec = Math.min(qty, slot.reserved);
  if (dec <= 0) return;

  await PreorderSlot.updateOne(
    { _id: slot._id },
    { $inc: { reserved: -dec } }
  );

  console.log(
    `🩷 Released ${dec} slots for ${normalizedDate} (${window}) — new reserved: ${
      slot.reserved - dec
    }`
  );
}
