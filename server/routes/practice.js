import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const SECTIONS = new Set(["verbal", "quantitative"]);

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

/** GET /api/practice/solution?questionId=  — show correct answer (e.g. after timeout) */
router.get("/solution", (req, res) => {
  const id = Number(req.query.questionId);
  if (!id) return res.status(400).json({ error: "questionId required" });
  const q = db.prepare("SELECT id, question_text, correct_answer, explanation FROM questions WHERE id = ?").get(id);
  if (!q) return res.status(404).json({ error: "not found" });
  res.json({
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
  });
});

/** GET /api/practice/question?section=verbal|quantitative */
router.get("/question", (req, res) => {
  const section = String(req.query.section || "").toLowerCase();
  if (!SECTIONS.has(section)) {
    return res.status(400).json({ error: "section must be verbal or quantitative" });
  }
  const q = db
    .prepare("SELECT * FROM questions WHERE section = ? ORDER BY RANDOM() LIMIT 1")
    .get(section);
  if (!q) return res.status(404).json({ error: "No questions" });
  res.json({ question: rowToClient(q) });
});

/** POST /api/practice/attempt { questionId, selectedAnswer, timeTakenSeconds? } */
router.post("/attempt", (req, res) => {
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
  });
});

export default router;
