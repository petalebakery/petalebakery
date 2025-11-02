import express from "express";
import { getFinanceSummary } from "../controllers/financeController.js";

const router = express.Router();

// 📊 Route for Finance Summary
router.get("/summary", getFinanceSummary);

export default router;
