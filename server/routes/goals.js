import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function startOfLocalDay() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.toISOString();
}

function startOfIsoWeek() {
  const t = new Date();
  const d = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - d);
  t.setHours(0, 0, 0, 0);
  return t.toISOString();
}

function startOfMonth() {
  const t = new Date();
  t.setDate(1);
  t.setHours(0, 0, 0, 0);
  return t.toISOString();
}

function getTargets(userId) {
  const rows = db.prepare("SELECT goal_type, target FROM user_goals WHERE user_id = ?").all(userId);
  const m = { daily: 0, weekly: 0, monthly: 0 };
  for (const r of rows) {
    m[r.goal_type] = r.target;
  }
  return m;
}

function getProgress(userId) {
  const dayStart = startOfLocalDay();
  const daily = db
    .prepare(
      `SELECT COUNT(*) as c FROM practice_sessions WHERE user_id = ? AND created_at >= ?`
    )
    .get(userId, dayStart).c;
  const weekStart = startOfIsoWeek();
  const weekly = db
    .prepare(
      `SELECT COUNT(*) as c FROM practice_sessions WHERE user_id = ? AND created_at >= ?`
    )
    .get(userId, weekStart).c;
  const monthStart = startOfMonth();
  const monthly = db
    .prepare(
      `SELECT COUNT(*) as c FROM mock_exams
       WHERE user_id = ? AND status = 'submitted' AND (submitted_at IS NOT NULL AND submitted_at >= ?)`
    )
    .get(userId, monthStart).c;
  return { daily, weekly, monthly };
}

/** GET /api/goals */
router.get("/", (req, res) => {
  const userId = req.user.id;
  const targets = getTargets(userId);
  const progress = getProgress(userId);
  res.json({ targets, progress });
});

/** PUT /api/goals { daily?, weekly?, monthly? } */
router.put("/", (req, res) => {
  const userId = req.user.id;
  const { daily, weekly, monthly } = req.body || {};
  const ins = db.prepare(
    `INSERT INTO user_goals (user_id, goal_type, target, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, goal_type) DO UPDATE SET
       target = excluded.target,
       updated_at = datetime('now')`
  );
  for (const [k, v] of [
    ["daily", daily],
    ["weekly", weekly],
    ["monthly", monthly],
  ]) {
    if (v === undefined) continue;
    const n = Math.max(0, Math.min(9999, Math.floor(Number(v))));
    ins.run(userId, k, n);
  }
  res.json({ targets: getTargets(userId), progress: getProgress(userId) });
});

/** GET /api/goals/daily-nudge — for dashboard: true if goal set and not met today */
router.get("/daily-nudge", (req, res) => {
  const userId = req.user.id;
  const targets = getTargets(userId);
  const progress = getProgress(userId);
  const show =
    targets.daily > 0 && progress.daily < targets.daily
      ? { message: "لم تكمل هدفك اليومي بعد!" }
      : null;
  res.json({ nudge: show });
});

export default router;
