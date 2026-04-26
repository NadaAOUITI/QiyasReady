import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getProfile } from "../lib/profile.js";

const router = Router();
router.use(requireAuth);

const TIERS = new Set(["beginner", "basic", "expert", "super", "none"]);

/** PATCH /api/users/profile */
router.patch("/profile", (req, res) => {
  const { daysUntilExam, schoolName } = req.body || {};
  if (daysUntilExam != null) {
    const n = Math.max(1, Math.min(365, Math.floor(Number(daysUntilExam))));
    db.prepare("UPDATE users SET days_until_exam = ? WHERE id = ?").run(n, req.user.id);
  }
  if (schoolName != null) {
    const s = String(schoolName).trim().slice(0, 120);
    db.prepare("UPDATE users SET school_name = ? WHERE id = ?").run(s || null, req.user.id);
  }
  res.json({ user: getProfile(req.user.id) });
});

/** POST /api/users/plan — demo "subscribe" (no payment) */
router.post("/plan", (req, res) => {
  const tier = String(req.body?.tier || "none").toLowerCase();
  if (!TIERS.has(tier)) {
    return res.status(400).json({ error: "Invalid tier" });
  }
  const finalTier = tier === "none" ? "none" : tier;
  db.prepare("UPDATE users SET subscription_tier = ? WHERE id = ?").run(finalTier, req.user.id);
  res.json({ user: getProfile(req.user.id), success: true });
});

export default router;
