const express = require("express");
const router = express.Router();
const db = require("./db"); // adjust if your db connection is elsewhere
const bcrypt = require("bcryptjs");

// Signup endpoint
router.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password, niche, platforms, location, bio } =
      req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO creators (full_name, email, password_hash, niche, platforms, location, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [full_name, email, password_hash, niche, platforms, location, bio],
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
