// routes/adminPreorderRoutes.js
import express from "express";
import { PREORDER_CONFIG } from "../config/preorder.js";
import PreorderSlot from "../models/PreorderSlot.js";

const router = express.Router();

router.post("/capacity", async (req, res) => {
  const { date, window, capacity } = req.body;
  if (!date || !window || capacity == null)
    return res.status(400).json({ error: "Missing date/window/capacity" });

  const slot = await PreorderSlot.findOneAndUpdate(
    { date, window },
    { $set: { capacity, isBlackout: false }, $setOnInsert: { reserved: 0 } },
    { upsert: true, new: true }
  );
  res.json(slot);
});

router.post("/blackout", async (req, res) => {
  const { date, isBlackout = true } = req.body;
  if (!date) return res.status(400).json({ error: "Missing date" });
  const windows = PREORDER_CONFIG.windowsByWeekday?.[new Date(date).getDay()] || [];
  const toUpdate = windows.length ? windows : ["10:00-12:00", "12:00-14:00", "14:00-16:00"];

  const ops = toUpdate.map((w) => ({
    updateOne: {
      filter: { date, window: w },
      update: {
        $set: { isBlackout, capacity: PREORDER_CONFIG.defaultCapacityPerWindow },
        $setOnInsert: { reserved: 0 },
      },
      upsert: true,
    },
  }));
  await PreorderSlot.bulkWrite(ops);
  res.json({ ok: true });
});

export default router;
