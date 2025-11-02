import express from "express";
import { registerAdmin, loginAdmin } from "../controllers/authController.js";

const router = express.Router();

// Register route (use once, then disable or protect)
router.post("/register", registerAdmin);

// Login route
router.post("/login", loginAdmin);

export default router;
