import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { canUseFreePractice, getProfile, isPaidTier } from "../lib/profile.js";

const router = Router();
router.use(requireAuth);

const SECTIONS = new Set(["verbal", "quantitative"]);

function ensurePracticeQuota(req, res) {
  const gate = canUseFreePractice(req.user.id);
  if (gate.ok) return true;
  res.status(403).json({
    error: "انتهت أسئلة التمرين المجانية (5). فعّل اشتراكاً من الأسعار.",
    code: "PAYWALL_PRACTICE",
    remaining: 0,
    limit: gate.limit,
  });
  return false;
}

function rowToClient(q) {
  return {
    id: q.id,
    section: q.section,
    chapter: q.chapter,
    difficulty: q.difficulty,
    questionText: q.question_text,
    options: {
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d,
    },
  };
}

/** GET /api/practice/performance — practice-specific analytics (spec: practice vs test) */
router.get("/performance", (req, res) => {
  const userId = req.user.id;
  const total = db
    .prepare("SELECT COUNT(*) as c FROM practice_sessions WHERE user_id = ?")
    .get(userId).c;
  if (total === 0) {
    return res.json({ total: 0, accuracy: null, bySection: [], series: [] });
  }
  const correct = db
    .prepare("SELECT COUNT(*) as c FROM practice_sessions WHERE user_id = ? AND is_correct = 1")
    .get(userId).c;
  const bySection = db
    .prepare(
      `SELECT q.section,
              COUNT(*) as attempts,
              SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct
       FROM practice_sessions a
       JOIN questions q ON q.id = a.question_id
       WHERE a.user_id = ?
       GROUP BY q.section`
    )
    .all(userId);
  const recent = db
    .prepare(
      `SELECT a.created_at, a.is_correct, a.time_taken_seconds, q.section, q.difficulty
       FROM practice_sessions a
       JOIN questions q ON q.id = a.question_id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT 20`
    )
    .all(userId);
  const series = recent
    .slice()
    .reverse()
    .map((r, i) => ({
      n: i + 1,
      correct: r.is_correct ? 1 : 0,
    }));
  res.json({
    total,
    correct,
    accuracy: (correct / total) * 100,
    bySection: bySection.map((r) => ({
      section: r.section,
      attempts: r.attempts,
      correct: r.correct,
      accuracy: r.attempts ? (r.correct / r.attempts) * 100 : 0,
    })),
    series,
  });
});

/** POST /api/practice/timeout { questionId } — records timed-out item for free-tier quota; returns solution */
router.post("/timeout", (req, res) => {
  if (!ensurePracticeQuota(req, res)) return;
  const questionId = Number(req.body?.questionId);
  if (!questionId) return res.status(400).json({ error: "questionId required" });
  const q = db
    .prepare("SELECT * FROM questions WHERE id = ?")
    .get(questionId);
  if (!q) return res.status(404).json({ error: "not found" });
  db.prepare(
    `INSERT INTO practice_sessions (user_id, question_id, selected_answer, is_correct, time_taken_seconds)
     VALUES (?, ?, NULL, 0, ?)`
  ).run(req.user.id, questionId, 60);
  res.json({
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    timedOut: true,
    freePractice: getProfile(req.user.id).freePractice,
  });
});

/** GET /api/practice/solution?questionId= */
router.get("/solution", (req, res) => {
  if (!ensurePracticeQuota(req, res)) return;
  const id = Number(req.query.questionId);
  if (!id) return res.status(400).json({ error: "questionId required" });
  const q = db
    .prepare("SELECT id, question_text, correct_answer, explanation FROM questions WHERE id = ?")
    .get(id);
  if (!q) return res.status(404).json({ error: "not found" });
  res.json({
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
  });
});

/** GET /api/practice/hint?questionId=  — spec: hints in practice (not full answer) */
router.get("/hint", async (req, res) => {
  const id = Number(req.query.questionId);
  if (!id) return res.status(400).json({ error: "questionId required" });
  const q = db
    .prepare("SELECT id, question_text, section, difficulty FROM questions WHERE id = ?")
    .get(id);
  if (!q) return res.status(404).json({ error: "not found" });
  const key = process.env.GROQ_API_KEY;
  let hint = null;
  if (key) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          temperature: 0.4,
          max_tokens: 200,
          messages: [
            {
              role: "system",
              content:
                "You give a SHORT hint (2–3 sentences) for a Qiyas exam question. Do NOT reveal the final answer. Arabic or match question language.",
            },
            { role: "user", content: `Question:\n${q.question_text}\n\nSection: ${q.section}, difficulty: ${q.difficulty}` },
          ],
        }),
      });
      if (r.ok) {
        const d = await r.json();
        hint = d.choices?.[0]?.message?.content?.trim();
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!hint) {
    const hints = [
      "فكّر في الخيار الأقرب للتعريف، ثم استبعد الخيارين الأضعف.",
      "راجع وحدات القياس وتحويل الوقت إذا كان السؤال كميّاً.",
      "مفاتيح الاستبعاد مفيدة: ابحث عن تناقض في النصوص المطولة.",
    ];
    hint = hints[Math.floor(Math.random() * hints.length)];
  }
  res.json({ hint, fallback: !key });
});

/** GET /api/practice/question?section=verbal|quantitative */
router.get("/question", (req, res) => {
  if (!ensurePracticeQuota(req, res)) return;
  const section = String(req.query.section || "").toLowerCase();
  if (!SECTIONS.has(section)) {
    return res.status(400).json({ error: "section must be verbal or quantitative" });
  }
  const q = db
    .prepare("SELECT * FROM questions WHERE section = ? ORDER BY RANDOM() LIMIT 1")
    .get(section);
  if (!q) return res.status(404).json({ error: "No questions" });
  const gate = canUseFreePractice(req.user.id);
  res.json({
    question: rowToClient(q),
    freePractice: isPaidTier(db.prepare("SELECT subscription_tier FROM users WHERE id = ?").get(req.user.id)?.subscription_tier)
      ? { unlimited: true }
      : { remaining: gate.remaining, limit: gate.limit },
  });
});

/** POST /api/practice/attempt */
router.post("/attempt", (req, res) => {
  if (!ensurePracticeQuota(req, res)) return;
  const { questionId, selectedAnswer, timeTakenSeconds } = req.body || {};
  const id = Number(questionId);
  if (!id) return res.status(400).json({ error: "questionId required" });
  if (!["A", "B", "C", "D"].includes(String(selectedAnswer || "").toUpperCase())) {
    return res.status(400).json({ error: "selectedAnswer A–D required" });
  }
  const letter = String(selectedAnswer).toUpperCase();
  const sec = timeTakenSeconds != null ? Math.max(0, Math.floor(Number(timeTakenSeconds))) : null;
  const q = db.prepare("SELECT * FROM questions WHERE id = ?").get(id);
  if (!q) return res.status(404).json({ error: "Question not found" });
  const isCorrect = letter === String(q.correct_answer).toUpperCase() ? 1 : 0;
  db.prepare(
    `INSERT INTO practice_sessions (user_id, question_id, selected_answer, is_correct, time_taken_seconds)
     VALUES (?, ?, ?, ?, ?)`
  ).run(req.user.id, id, letter, isCorrect, sec);
  res.json({
    correct: !!isCorrect,
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    section: q.section,
    freePractice: getProfile(req.user.id).freePractice,
  });
});

/** GET /api/practice/mistakes — spec: common mistakes (aggregate + your recent wrong) */
router.get("/mistakes", (req, res) => {
  const userId = req.user.id;
  const personal = db
    .prepare(
      `SELECT q.id, q.section, q.chapter, substr(q.question_text, 1, 160) as preview
       FROM practice_sessions a
       JOIN questions q ON q.id = a.question_id
       WHERE a.user_id = ? AND a.is_correct = 0
       ORDER BY a.created_at DESC
       LIMIT 25`
    )
    .all(userId);
  const topMissed = db
    .prepare(
      `SELECT q.id, q.section, COUNT(*) as miss_count,
              substr(MIN(q.question_text), 1, 120) as preview
       FROM practice_sessions a
       JOIN questions q ON q.id = a.question_id
       WHERE a.is_correct = 0
       GROUP BY q.id, q.section
       ORDER BY miss_count DESC
       LIMIT 12`
    )
    .all();
  res.json({ personal, topMissed, demo: true });
});

export default router;
