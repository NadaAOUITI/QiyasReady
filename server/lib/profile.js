import { db } from "../db.js";

const PAID = new Set(["beginner", "basic", "expert"]);

export function isPaidTier(tier) {
  return PAID.has(String(tier || "").toLowerCase());
}

export function updateLoginStreak(userId) {
  const u = db
    .prepare("SELECT last_login_date, streak_days FROM users WHERE id = ?")
    .get(userId);
  if (!u) return;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = u.streak_days || 0;
  if (!u.last_login_date) {
    streak = Math.max(1, streak);
  } else if (u.last_login_date === today) {
    return;
  } else if (u.last_login_date === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }
  db.prepare("UPDATE users SET last_login_date = ?, streak_days = ? WHERE id = ?").run(
    today,
    streak,
    userId
  );
}

export function getProfile(userId) {
  const u = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!u) return null;
  const submitted =
    db
      .prepare(
        "SELECT COUNT(*) as c FROM mock_exams WHERE user_id = ? AND status = 'submitted'"
      )
      .get(userId).c || 0;
  const perfect =
    db
      .prepare(
        "SELECT COUNT(*) as c FROM mock_exams WHERE user_id = ? AND status = 'submitted' AND score >= 99.5"
      )
      .get(userId).c || 0;
  const badges = [
    {
      id: "first_exam",
      label: "First Exam",
      labelAr: "أول محاكاة",
      earned: submitted > 0,
    },
    {
      id: "perfect",
      label: "Perfect Score",
      labelAr: "نتيجة كاملة",
      earned: perfect > 0,
    },
    {
      id: "streak_7",
      label: "7-Day Streak",
      labelAr: "سلسلة 7 أيام",
      earned: (u.streak_days || 0) >= 7,
    },
  ];
  let studyPlan = null;
  if (u.study_plan_json) {
    try {
      studyPlan = JSON.parse(u.study_plan_json);
    } catch {
      studyPlan = null;
    }
  }
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    created_at: u.created_at,
    freeTrialExhausted: !!u.free_trial_exhausted,
    subscriptionTier: u.subscription_tier || "none",
    daysUntilExam: u.days_until_exam ?? null,
    streakDays: u.streak_days ?? 0,
    studyPlan,
    badges,
  };
}

export function markFreeTrialUsed(userId) {
  const n =
    db
      .prepare(
        "SELECT COUNT(*) as c FROM mock_exams WHERE user_id = ? AND status = 'submitted'"
      )
      .get(userId).c || 0;
  if (n >= 1) {
    db.prepare("UPDATE users SET free_trial_exhausted = 1 WHERE id = ?").run(userId);
  }
}
