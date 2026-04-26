import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db.js";

const router = Router();
router.use(requireAuth);

const FAKE = [
  { rank: 1, name: "نورة العتيبي", score: 98, isYou: false, examsCount: 3 },
  { rank: 2, name: "سعد المالكي", score: 96, isYou: false, examsCount: 2 },
  { rank: 3, name: "ريم الحربي", score: 94, isYou: false, examsCount: 4 },
  { rank: 4, name: "ماجد القحطاني", score: 91, isYou: false, examsCount: 1 },
  { rank: 5, name: "لينا السبيعي", score: 88, isYou: false, examsCount: 2 },
];

function globalBoard(req) {
  return {
    top: FAKE,
    mode: "global",
    note: "عرض توضيحي — أسماء وهمية في المقدمة. درجتك تُقارن في صفحتك.",
  };
}

/** GET /api/leaderboard */
router.get("/", (req, res) => {
  res.json(globalBoard(req));
});

/** GET /api/leaderboard/cohort */
router.get("/cohort", (req, res) => {
  const me = db.prepare("SELECT id, name, school_name FROM users WHERE id = ?").get(req.user.id);
  const school = (me?.school_name || "").trim();
  if (!school) {
    return res.json({
      needSchool: true,
      school: "",
      ...globalBoard(req),
    });
  }

  const peers = db
    .prepare(
      `SELECT u.id, u.name
       FROM users u
       WHERE u.school_name = ?`
    )
    .all(school);
  if (peers.length < 3) {
    return res.json({
      needSchool: false,
      school,
      fallback: true,
      reason: "peers",
      message: "أقل من 3 طلاب من نفس المدرسة في التجربة — عُرضت الصدارة العامة.",
      ...globalBoard(req),
    });
  }

  const stats = [];
  for (const p of peers) {
    const row = db
      .prepare(
        `SELECT AVG(score) as avg_score, COUNT(*) as n
         FROM mock_exams
         WHERE user_id = ? AND status = 'submitted'`
      )
      .get(p.id);
    const n = row?.n || 0;
    if (n === 0) continue;
    const avg = row?.avg_score != null ? Math.round(row.avg_score * 10) / 10 : 0;
    stats.push({
      name: p.name,
      userId: p.id,
      averageScore: avg,
      examsTaken: n,
      isYou: p.id === req.user.id,
    });
  }
  if (stats.length < 2) {
    return res.json({
      needSchool: false,
      school,
      fallback: true,
      reason: "insufficient_data",
      message: "بيانات غير كافية — عُرضت الصدارة العامة.",
      ...globalBoard(req),
    });
  }
  stats.sort((a, b) => b.averageScore - a.averageScore);
  const top = stats.map((s, i) => ({
    rank: i + 1,
    name: s.name,
    score: s.averageScore,
    isYou: s.isYou,
    examsCount: s.examsTaken,
  }));
  res.json({
    needSchool: false,
    school,
    mode: "cohort",
    top,
    note: `مجموعة: ${school} — متوسط الدرجات وعدد المحاكاة المُسلَّمة`,
  });
});

export default router;
