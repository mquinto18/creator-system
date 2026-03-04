const express = require("express");
const router = express.Router();
const db = require("./db");
const crypto = require("crypto"); // ✅ Import at top

// Save or update creator profile
router.post("/", async (req, res) => {
  try {
    const {
      id,
      email,
      displayName,
      handle,
      avatar,
      location,
      bio,
      niches,
      socials,
      services,
      available,
      responseTime,
      onboardingComplete,
      published,
      role,
    } = req.body;

    // Validate required fields
    if (!email || !displayName || !handle) {
      return res.status(400).json({
        error: "Missing required fields: email, displayName, handle",
      });
    }

    // Try to find user by id or email
    let creatorId = id;

    if (!creatorId) {
      const existing = await db.query(
        "SELECT id FROM creators WHERE email = $1",
        [email],
      );

      if (existing.rows.length > 0) {
        creatorId = existing.rows[0].id;
      }
    }

    // If still no id, create a new one
    if (!creatorId) {
      creatorId = crypto.randomUUID(); // ✅ Using imported crypto
    }

    // Upsert logic
    const result = await db.query(
      `INSERT INTO creators (
        id, email, full_name, handle, avatar, location, bio, niche,
        followers_instagram, instagram_username,
        followers_tiktok, tiktok_username,
        followers_youtube, youtube_username,
        followers_twitter, twitter_username,
        followers_linkedin, linkedin_username,
        services, available, response_time, onboarding_complete, published, role
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        handle = EXCLUDED.handle,
        avatar = EXCLUDED.avatar,
        location = EXCLUDED.location,
        bio = EXCLUDED.bio,
        niche = EXCLUDED.niche,
        followers_instagram = EXCLUDED.followers_instagram,
        instagram_username = EXCLUDED.instagram_username,
        followers_tiktok = EXCLUDED.followers_tiktok,
        tiktok_username = EXCLUDED.tiktok_username,
        followers_youtube = EXCLUDED.followers_youtube,
        youtube_username = EXCLUDED.youtube_username,
        followers_twitter = EXCLUDED.followers_twitter,
        twitter_username = EXCLUDED.twitter_username,
        followers_linkedin = EXCLUDED.followers_linkedin,
        linkedin_username = EXCLUDED.linkedin_username,
        services = EXCLUDED.services,
        available = EXCLUDED.available,
        response_time = EXCLUDED.response_time,
        onboarding_complete = EXCLUDED.onboarding_complete,
        published = EXCLUDED.published,
        role = EXCLUDED.role
      RETURNING *`,
      [
        creatorId,
        email,
        displayName,
        handle,
        avatar || null, // ✅ Use null instead of empty string
        location || null,
        bio || null,
        Array.isArray(niches) ? niches : [],
        socials?.instagram?.followers || null,
        socials?.instagram?.username || null,
        socials?.tiktok?.followers || null,
        socials?.tiktok?.username || null,
        socials?.youtube?.subscribers || null,
        socials?.youtube?.username || null,
        socials?.twitter?.followers || null,
        socials?.twitter?.username || null,
        socials?.linkedin?.followers || null,
        socials?.linkedin?.username || null,
        typeof services === "string"
          ? services
          : JSON.stringify(services || []),
        available !== undefined ? available : true,
        responseTime || null,
        onboardingComplete !== undefined ? onboardingComplete : false,
        published !== undefined ? published : false,
        role || "creator",
      ],
    );

    res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Profile save error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to save profile",
    });
  }
});

module.exports = router;
