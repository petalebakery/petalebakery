import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// 💾 Hardcoded admin credentials
const ADMIN_USERNAME = "petaleadmin";
const ADMIN_PASSWORD = "H5$m5-mika";

// 🔐 Admin Login Route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, "petale_secret", { expiresIn: "2h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// 🧁 Optional Admin Register Route (for future use)
router.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }

  res.json({
    message: `✅ Admin ${username} registered successfully (demo mode)`,
  });
});

export default router;
