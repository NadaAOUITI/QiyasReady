import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { getProfile, updateLoginStreak } from "../lib/profile.js";

const router = Router();

router.post("/register", (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  const hash = bcrypt.hashSync(String(password), 10);
  try {
    const r = db
      .prepare(
        "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'student')"
      )
      .run(String(email).toLowerCase().trim(), hash, String(name).trim());
    const id = r.lastInsertRowid;
    updateLoginStreak(id);
    const user = getProfile(id);
    const token = signToken({ id, email: user.email, name: user.name, role: user.role });
    return res.status(201).json({ user, token });
  } catch (e) {
    if (e?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error(e);
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const row = db
    .prepare("SELECT id, email, password_hash, name, role FROM users WHERE email = ?")
    .get(String(email).toLowerCase().trim());
  if (!row || !bcrypt.compareSync(String(password), row.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  updateLoginStreak(row.id);
  const user = getProfile(row.id);
  const token = signToken({ id: row.id, email: user.email, name: user.name, role: user.role });
  return res.json({ user, token });
});

router.get("/me", requireAuth, (req, res) => {
  const user = getProfile(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

export default router;
