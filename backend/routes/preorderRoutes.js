// routes/preorderRoutes.js
import express from "express";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { PREORDER_CONFIG } from "../config/preorder.js";
import PreorderSlot from "../models/PreorderSlot.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

function isBlackoutDate(d) {
  const wd = d.day(); // 0-6
  return PREORDER_CONFIG.blackoutWeekdays.includes(wd);
}

router.get("/availability", async (req, res) => {
  try {
    const { date } = req.query; // 'YYYY-MM-DD'
    if (!date) return res.status(400).json({ error: "date required" });

    const now = dayjs();
    const target = dayjs(date, "YYYY-MM-DD");
    const minDate = now.add(PREORDER_CONFIG.leadTimeDays, "day").startOf("day");

    if (target.isBefore(minDate)) {
      return res.json({ date, windows: [], isBlackout: true, reason: "Lead time" });
    }

    const wd = target.day();
    if (isBlackoutDate(target)) {
      return res.json({ date, windows: [], isBlackout: true, reason: "Blackout" });
    }

    const dayWindows =
      PREORDER_CONFIG.windowsByWeekday?.[wd] ||
      ["10:00-12:00", "12:00-14:00", "14:00-16:00"];

    const slots = await PreorderSlot.find({ date, window: { $in: dayWindows } });
    const byWindow = Object.fromEntries(dayWindows.map((w) => [w, null]));

    dayWindows.forEach((w) => {
      const found = slots.find((s) => s.window === w);
      const capacity = found?.capacity ?? PREORDER_CONFIG.defaultCapacityPerWindow;
      const reserved = found?.reserved ?? 0;
      byWindow[w] = {
        window: w,
        capacity,
        reserved,
        remaining: Math.max(0, capacity - reserved),
      };
    });

    return res.json({ date, windows: Object.values(byWindow), isBlackout: false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server" });
  }
});

export default router;
