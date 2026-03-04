const express = require("express");
const router = express.Router();
const db = require("./db"); // adjust if your db connection is elsewhere
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Google login endpoint
// Google login endpoint
router.post("/google", async (req, res) => {
  try {
    const { email, full_name, avatar } = req.body;
    if (!email || !full_name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    let userResult = await db.query(`SELECT * FROM creators WHERE email = $1`, [
      email,
    ]);
    let user = userResult.rows[0];

    // If not, create user (set password_hash to empty string for social login)
    if (!user) {
      const insertResult = await db.query(
        `INSERT INTO creators (full_name, email, avatar, password_hash) VALUES ($1, $2, $3, $4) RETURNING *`,
        [full_name, email, avatar, ""],
      );
      user = insertResult.rows[0];
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret not configured" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(200).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }
    // Find user
    const userResult = await db.query(
      "SELECT * FROM creators WHERE email = $1",
      [email],
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Validate password
    if (!user.password_hash) {
      return res
        .status(400)
        .json({ error: "User has no password set (social login)" });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret not configured" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    // Map full_name to displayName and onboarding_complete to onboardingComplete for frontend compatibility
    const { password_hash, ...safeUser } = user;
    const userResponse = {
      ...safeUser,
      displayName: user.full_name,
      onboardingComplete: user.onboarding_complete,
      niches: user.niche, // Map DB 'niche' to frontend 'niches'
      avatar: user.avatar || null, // Ensure avatar is included
      socials: {
        instagram: {
          username: user.instagram_username || "",
          followers: user.followers_instagram || "0",
        },
        tiktok: {
          username: user.tiktok_username || "",
          followers: user.followers_tiktok || "0",
        },
        youtube: {
          username: user.youtube_username || "",
          subscribers: user.followers_youtube || "0",
        },
        twitter: {
          username: user.twitter_username || "",
        },
        linkedin: {
          username: user.linkedin_username || "",
        },
      },
    };
    res.status(200).json({ user: userResponse, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Signup endpoint
router.post("/signup", async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      niche,
      avatar,
      handle,
      followers_instagram,
      instagram_username,
      followers_tiktok,
      tiktok_username,
      followers_youtube,
      youtube_username,
      followers_twitter,
      twitter_username,
      followers_linkedin,
      linkedin_username,
      location,
      bio,
      response_time,
      onboarding_complete,
      published,
      available,
    } = req.body;

    // Ensure niche is always an array for Postgres
    const safeNiche = Array.isArray(niche)
      ? niche
      : typeof niche === "string" && niche.trim() === ""
        ? []
        : [niche];
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO creators (
        full_name, email, password_hash, niche, avatar, handle,
        followers_instagram, instagram_username,
        followers_tiktok, tiktok_username,
        followers_youtube, youtube_username,
        followers_twitter, twitter_username,
        followers_linkedin, linkedin_username,
        location, bio, response_time,
        onboarding_complete, published, available
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8,
        $9, $10,
        $11, $12,
        $13, $14,
        $15, $16,
        $17, $18, $19,
        $20, $21, $22
      ) RETURNING *`,
      [
        full_name,
        email,
        password_hash,
        safeNiche, // always array
        avatar,
        handle,
        followers_instagram,
        instagram_username,
        followers_tiktok,
        tiktok_username,
        followers_youtube,
        youtube_username,
        followers_twitter,
        twitter_username,
        followers_linkedin,
        linkedin_username,
        location,
        bio,
        response_time,
        onboarding_complete ?? false,
        published ?? false,
        available ?? true,
      ],
    );
    const user = result.rows[0];
    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret not configured" });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
