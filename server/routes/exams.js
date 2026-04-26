import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { isPaidTier, markFreeTrialUsed } from "../lib/profile.js";

const router = Router();
router.use(requireAuth);

const TOTAL_MOCK = 20;
const TIME_LIMIT_S = 20 * 60;

function shuffleInPlace(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function forfeitInProgress(userId) {
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE mock_exams SET status = 'abandoned', submitted_at = ? WHERE user_id = ? AND status = 'in_progress'"
  ).run(now, userId);
}

function getExamForUser(examId, userId) {
  return db
    .prepare("SELECT * FROM mock_exams WHERE id = ? AND user_id = ?")
    .get(examId, userId);
}

function questionRowToPublic(q, position) {
  return {
    position,
    id: q.id,
    section: q.section,
    questionText: q.question_text,
    options: {
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d,
    },
  };
}

function isExpired(endsAt) {
  if (!endsAt) return false;
  return new Date() >= new Date(endsAt);
}

function countAnswers(examId) {
  return db.prepare("SELECT COUNT(*) as c FROM exam_answers WHERE exam_id = ?").get(examId).c;
}

function completeExamIfExpired(exam, userId) {
  if (exam.status !== "in_progress") return exam;
  if (!isExpired(exam.ends_at)) return exam;
  finishExamInternal(exam.id, userId, "time");
  return getExamForUser(exam.id, userId);
}

function finishExamInternal(examId, userId, _reason) {
  const exam = getExamForUser(examId, userId);
  if (!exam) return null;
  if (exam.status !== "in_progress") {
    return exam;
  }
  const positions = db
    .prepare(
      `SELECT m.position, m.question_id, q.correct_answer
       FROM mock_exam_questions m
       JOIN questions q ON q.id = m.question_id
       WHERE m.exam_id = ?
       ORDER BY m.position`
    )
    .all(examId);
  const existing = new Set(
    db.prepare("SELECT question_id FROM exam_answers WHERE exam_id = ?").all(examId).map((r) => r.question_id)
  );
  const ins = db.prepare(
    `INSERT INTO exam_answers (exam_id, question_id, selected_answer, is_correct, time_taken_seconds)
     VALUES (?, ?, NULL, 0, NULL)`
  );
  for (const p of positions) {
    if (!existing.has(p.question_id)) {
      ins.run(examId, p.question_id);
    }
  }
  const correct = db
    .prepare("SELECT COUNT(*) as c FROM exam_answers WHERE exam_id = ? AND is_correct = 1")
    .get(examId).c;
  const score = (correct / TOTAL_MOCK) * 100;
  const submitted = new Date().toISOString();
  const started = new Date(exam.started_at);
  const durationSeconds = Math.max(
    0,
    Math.floor((new Date(submitted).getTime() - started.getTime()) / 1000)
  );
  db.prepare(
    "UPDATE mock_exams SET status = 'submitted', submitted_at = ?, score = ?, duration_seconds = ? WHERE id = ?"
  ).run(submitted, score, durationSeconds, examId);
  markFreeTrialUsed(userId);
  return getExamForUser(examId, userId);
}

/* --- Routes registered before :id to avoid "performance" being parsed as id --- */

/** GET /api/exams/performance */
router.get("/performance", (req, res) => {
  const userId = req.user.id;
  const exams = db
    .prepare(
      `SELECT id, started_at, submitted_at, score, duration_seconds, total_questions
       FROM mock_exams
       WHERE user_id = ? AND status = 'submitted'
       ORDER BY submitted_at ASC`
    )
    .all(userId);
  if (exams.length === 0) {
    return res.json({
      examCount: 0,
      chart: [],
      sectionAccuracy: { verbal: null, quantitative: null },
      insight: "ابدأ بمحاكاة كاملة ليظهر تحليل الأداء هنا.",
    });
  }
  const chart = exams.map((e, i) => ({
    n: i + 1,
    label: `محاولة ${i + 1}`,
    score: Math.round((e.score || 0) * 10) / 10,
    date: e.submitted_at,
  }));
  const verbalStats = { correct: 0, total: 0 };
  const quantStats = { correct: 0, total: 0 };
  for (const e of exams) {
    const rows = db
      .prepare(
        `SELECT q.section, a.is_correct
         FROM exam_answers a
         JOIN questions q ON q.id = a.question_id
         WHERE a.exam_id = ?`
      )
      .all(e.id);
    for (const r of rows) {
      if (r.section === "verbal") {
        verbalStats.total += 1;
        if (r.is_correct) verbalStats.correct += 1;
      } else if (r.section === "quantitative") {
        quantStats.total += 1;
        if (r.is_correct) quantStats.correct += 1;
      }
    }
  }
  const verbalAcc = verbalStats.total ? (verbalStats.correct / verbalStats.total) * 100 : 0;
  const quantAcc = quantStats.total ? (quantStats.correct / quantStats.total) * 100 : 0;
  let insight;
  if (verbalAcc > quantAcc + 3) {
    insight = "أنت أقوى نسبياً في القسم اللفظي. زِد تمرين الكمي لتوازن النتائج.";
  } else if (quantAcc > verbalAcc + 3) {
    insight = "أنت أقوى نسبياً في القسم الكمي. ركّز على المفردات والاستيعاب لرفع اللفظي.";
  } else {
    insight = "أداؤك متوازن تقريباً بين اللفظي والكمي. حافظ على الوتيرة مع محاكاة أسبوعية.";
  }
  res.json({
    examCount: exams.length,
    chart,
    sectionAccuracy: {
      verbal: Math.round(verbalAcc * 10) / 10,
      quantitative: Math.round(quantAcc * 10) / 10,
    },
    insight,
    recentExams: exams.slice(-5).map((e) => ({
      id: e.id,
      score: e.score,
      submittedAt: e.submitted_at,
      durationSeconds: e.duration_seconds,
    })),
  });
});

/**
 * GET /api/exams/offline-pack
 * Returns a static JSON structure for “flight mode” (no server-timed exam in DB).
 */
router.get("/offline-pack", (req, res) => {
  const userId = req.user.id;
  const urow = db
    .prepare("SELECT free_trial_exhausted, subscription_tier FROM users WHERE id = ?")
    .get(userId);
  if (urow?.free_trial_exhausted && !isPaidTier(urow.subscription_tier)) {
    return res.status(403).json({
      error: "انتهت المحاولة المجانية. اختر باقة للمتابعة.",
      code: "PAYWALL",
    });
  }
  const vRows = db
    .prepare("SELECT id FROM questions WHERE section = 'verbal' ORDER BY RANDOM() LIMIT 10")
    .all();
  const qRows = db
    .prepare("SELECT id FROM questions WHERE section = 'quantitative' ORDER BY RANDOM() LIMIT 10")
    .all();
  if (vRows.length < 10 || qRows.length < 10) {
    return res.status(500).json({ error: "Not enough questions in the bank" });
  }
  const ids = shuffleInPlace([...vRows.map((r) => r.id), ...qRows.map((r) => r.id)]);
  const getQ = db.prepare("SELECT * FROM questions WHERE id = ?");
  const questions = [];
  for (let pos = 0; pos < ids.length; pos++) {
    const q = getQ.get(ids[pos]);
    if (!q) return res.status(500).json({ error: "DB error" });
    questions.push({
      position: pos,
      id: q.id,
      section: q.section,
      questionText: q.question_text,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
    });
  }
  res.json({
    version: 1,
    timeLimitSeconds: TIME_LIMIT_S,
    totalQuestions: TOTAL_MOCK,
    generatedAt: new Date().toISOString(),
    questions,
  });
});

/**
 * POST /api/exams/offline-submit
 * Sync offline attempt: recalculates score on server, stores exam like online submit.
 */
router.post("/offline-submit", (req, res) => {
  const userId = req.user.id;
  const urow = db
    .prepare("SELECT free_trial_exhausted, subscription_tier FROM users WHERE id = ?")
    .get(userId);
  if (urow?.free_trial_exhausted && !isPaidTier(urow.subscription_tier)) {
    return res.status(403).json({ error: "انتهت المحاولة المجانية.", code: "PAYWALL" });
  }
  const { questionIds, answers, durationSeconds } = req.body || {};
  if (!Array.isArray(questionIds) || questionIds.length !== TOTAL_MOCK) {
    return res.status(400).json({ error: "questionIds: array of 20" });
  }
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "answers required" });
  }
  const getQ = db.prepare("SELECT * FROM questions WHERE id = ?");
  for (let pos = 0; pos < TOTAL_MOCK; pos++) {
    const qid = Number(questionIds[pos]);
    const q = getQ.get(qid);
    if (!q) return res.status(400).json({ error: "Invalid question id" });
    const letter = String(answers[qid] ?? answers[String(qid)] ?? "").toUpperCase();
    if (!["A", "B", "C", "D"].includes(letter)) {
      return res.status(400).json({ error: "Missing answer" });
    }
  }

  const startedAt = new Date();
  forfeitInProgress(userId);
  const submitted = new Date();
  const dur =
    durationSeconds != null
      ? Math.max(0, Math.min(86400, Math.floor(Number(durationSeconds))))
      : 1200;

  const work = () => {
    const examIns = db
      .prepare(
        `INSERT INTO mock_exams (user_id, started_at, total_questions, status, ends_at, submitted_at, score, duration_seconds)
         VALUES (?, ?, ?, 'submitted', ?, ?, NULL, ?)`
      )
      .run(
        userId,
        startedAt.toISOString(),
        TOTAL_MOCK,
        startedAt.toISOString(),
        submitted.toISOString(),
        dur
      );
    const examId = examIns.lastInsertRowid;
    const insA = db.prepare(
      `INSERT INTO exam_answers (exam_id, question_id, selected_answer, is_correct, time_taken_seconds)
       VALUES (?, ?, ?, ?, ?)`
    );
    const insM = db.prepare("INSERT INTO mock_exam_questions (exam_id, position, question_id) VALUES (?, ?, ?)");
    let correct = 0;
    for (let pos = 0; pos < TOTAL_MOCK; pos++) {
      const qid = Number(questionIds[pos]);
      const q = getQ.get(qid);
      const letter = String(answers[qid] ?? answers[String(qid)] ?? "").toUpperCase();
      const isCorrect = letter === String(q.correct_answer).toUpperCase() ? 1 : 0;
      if (isCorrect) correct += 1;
      insM.run(examId, pos, qid);
      insA.run(examId, qid, letter, isCorrect, null);
    }
    const score = (correct / TOTAL_MOCK) * 100;
    db.prepare("UPDATE mock_exams SET score = ? WHERE id = ?").run(score, examId);
    return { examId, score };
  };

  const { examId, score } = db.transaction(work)();
  markFreeTrialUsed(userId);
  res.json({ exam: { id: examId, score, submittedAt: submitted.toISOString() } });
});

/** GET /api/exams */
router.get("/", (req, res) => {
  const userId = req.user.id;
  const rows = db
    .prepare(
      `SELECT id, status, started_at, submitted_at, score, total_questions, duration_seconds, ends_at
       FROM mock_exams
       WHERE user_id = ?
       ORDER BY started_at DESC
       LIMIT 30`
    )
    .all(userId);
  res.json({ exams: rows });
});

/** POST /api/exams/start */
router.post("/start", (req, res) => {
  const userId = req.user.id;
  const urow = db
    .prepare("SELECT free_trial_exhausted, subscription_tier FROM users WHERE id = ?")
    .get(userId);
  if (urow?.free_trial_exhausted && !isPaidTier(urow.subscription_tier)) {
    return res.status(403).json({
      error: "انتهت المحاولة المجانية. اختر باقة للمتابعة.",
      code: "PAYWALL",
    });
  }
  const vRows = db
    .prepare("SELECT id FROM questions WHERE section = 'verbal' ORDER BY RANDOM() LIMIT 10")
    .all();
  const qRows = db
    .prepare("SELECT id FROM questions WHERE section = 'quantitative' ORDER BY RANDOM() LIMIT 10")
    .all();
  if (vRows.length < 10 || qRows.length < 10) {
    return res.status(500).json({ error: "Not enough questions in the bank" });
  }
  const ids = shuffleInPlace([...vRows.map((r) => r.id), ...qRows.map((r) => r.id)]);

  forfeitInProgress(userId);
  const started = new Date();
  const ends = new Date(started.getTime() + TIME_LIMIT_S * 1000);
  const r = db
    .prepare(
      `INSERT INTO mock_exams (user_id, started_at, total_questions, status, ends_at)
       VALUES (?, ?, ?, 'in_progress', ?)`
    )
    .run(userId, started.toISOString(), TOTAL_MOCK, ends.toISOString());
  const examId = r.lastInsertRowid;
  const ins = db.prepare(
    "INSERT INTO mock_exam_questions (exam_id, position, question_id) VALUES (?, ?, ?)"
  );
  const tx = db.transaction((qids) => {
    qids.forEach((qid, pos) => ins.run(examId, pos, qid));
  });
  tx(ids);

  res.status(201).json({
    exam: {
      id: examId,
      startedAt: started.toISOString(),
      endsAt: ends.toISOString(),
      timeLimitSeconds: TIME_LIMIT_S,
      totalQuestions: TOTAL_MOCK,
    },
  });
});

/** POST /api/exams/:id/submit */
router.post("/:id/submit", (req, res) => {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: "Invalid exam" });
  const exam0 = getExamForUser(examId, req.user.id);
  if (!exam0) return res.status(404).json({ error: "Exam not found" });
  if (exam0.status === "abandoned") {
    return res.status(400).json({ error: "Exam is abandoned" });
  }
  if (exam0.status === "submitted") {
    return res.json({ alreadySubmitted: true, exam: { id: examId, score: exam0.score } });
  }
  const afterExpire = completeExamIfExpired(exam0, req.user.id);
  if (afterExpire.status === "submitted") {
    return res.json({ exam: { id: examId, score: afterExpire.score, submittedAt: afterExpire.submitted_at } });
  }
  const exam = finishExamInternal(examId, req.user.id, "manual");
  if (!exam) return res.status(500).json({ error: "Failed to submit" });
  res.json({ exam: { id: examId, score: exam.score, submittedAt: exam.submitted_at } });
});

/** GET /api/exams/:id/result */
router.get("/:id/result", (req, res) => {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: "Invalid exam" });
  const ex = getExamForUser(examId, req.user.id);
  if (!ex) return res.status(404).json({ error: "Not found" });
  if (ex.status !== "submitted") {
    return res.status(400).json({ error: "Exam not completed yet" });
  }
  const correct = db
    .prepare("SELECT COUNT(*) as c FROM exam_answers WHERE exam_id = ? AND is_correct = 1")
    .get(examId).c;
  const rows = db
    .prepare(
      `SELECT a.question_id, a.selected_answer, a.is_correct, a.time_taken_seconds,
              m.position, q.section, q.question_text, q.correct_answer, q.explanation,
              q.option_a, q.option_b, q.option_c, q.option_d
       FROM exam_answers a
       JOIN mock_exam_questions m ON m.exam_id = a.exam_id AND m.question_id = a.question_id
       JOIN questions q ON q.id = a.question_id
       WHERE a.exam_id = ?
       ORDER BY m.position`
    )
    .all(examId);
  const verbalC = rows.filter((r) => r.section === "verbal" && r.is_correct).length;
  const quantC = rows.filter((r) => r.section === "quantitative" && r.is_correct).length;
  res.json({
    exam: {
      id: ex.id,
      score: ex.score,
      startedAt: ex.started_at,
      submittedAt: ex.submitted_at,
      durationSeconds: ex.duration_seconds,
      totalQuestions: ex.total_questions,
      correctCount: correct,
    },
    sections: {
      verbal: { correct: verbalC, total: 10 },
      quantitative: { correct: quantC, total: 10 },
    },
    questions: rows.map((r) => ({
      position: r.position,
      section: r.section,
      questionText: r.question_text,
      options: { A: r.option_a, B: r.option_b, C: r.option_c, D: r.option_d },
      selected: r.selected_answer,
      correctAnswer: r.correct_answer,
      isCorrect: !!r.is_correct,
      explanation: r.explanation,
    })),
  });
});

/** GET /api/exams/:id/question/:position */
router.get("/:id/question/:position", (req, res) => {
  const examId = Number(req.params.id);
  const position = Number(req.params.position);
  if (!examId || position < 0 || position >= TOTAL_MOCK) {
    return res.status(400).json({ error: "Invalid" });
  }
  let ex = getExamForUser(examId, req.user.id);
  if (!ex) return res.status(404).json({ error: "Not found" });
  if (ex.status === "abandoned") {
    return res.status(400).json({ error: "هذه المحاكاة غير مفعّلة. ابدأ محاكاة جديدة." });
  }
  if (ex.status === "submitted") {
    return res.status(400).json({ error: "Exam already completed", code: "DONE" });
  }
  ex = completeExamIfExpired(ex, req.user.id);
  if (ex.status === "submitted") {
    return res.status(410).json({ error: "Time expired; exam auto-submitted", code: "EXPIRED" });
  }
  if (isExpired(ex.ends_at)) {
    return res.status(410).json({ error: "Time expired", code: "EXPIRED" });
  }
  const count = countAnswers(examId);
  if (position !== count) {
    return res
      .status(400)
      .json({ error: "يجب حل الأسئلة بالتتابع. لا يمكن العودة.", nextPosition: count });
  }
  const m = db
    .prepare(
      "SELECT question_id FROM mock_exam_questions WHERE exam_id = ? AND position = ?"
    )
    .get(examId, position);
  if (!m) return res.status(404).json({ error: "Question not found" });
  const q = db.prepare("SELECT * FROM questions WHERE id = ?").get(m.question_id);
  if (!q) return res.status(500).json({ error: "DB error" });
  res.json({
    exam: { id: examId, endsAt: ex.ends_at, timeLimitSeconds: TIME_LIMIT_S },
    question: questionRowToPublic(q, position),
    progress: { current: position + 1, total: TOTAL_MOCK },
  });
});

/** POST /api/exams/:id/answer */
router.post("/:id/answer", (req, res) => {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: "Invalid exam" });
  const { position, selectedAnswer, timeTakenSeconds } = req.body || {};
  if (position === undefined || !["A", "B", "C", "D"].includes(String(selectedAnswer || "").toUpperCase())) {
    return res.status(400).json({ error: "position and selectedAnswer (A–D) required" });
  }
  const pos = Number(position);
  if (pos < 0 || pos >= TOTAL_MOCK) return res.status(400).json({ error: "Invalid position" });
  const letter = String(selectedAnswer).toUpperCase();
  const sec = timeTakenSeconds != null ? Math.max(0, Math.floor(Number(timeTakenSeconds))) : null;

  let ex = getExamForUser(examId, req.user.id);
  if (!ex) return res.status(404).json({ error: "Not found" });
  if (ex.status === "abandoned") {
    return res.status(400).json({ error: "هذه المحاكاة غير مفعّلة." });
  }
  if (ex.status === "submitted") {
    return res.status(400).json({ error: "Already submitted" });
  }
  ex = completeExamIfExpired(ex, req.user.id);
  if (ex.status === "submitted") {
    return res.status(410).json({ error: "Time expired; exam auto-submitted", code: "EXPIRED" });
  }
  if (isExpired(ex.ends_at)) {
    return res.status(410).json({ error: "Time expired" });
  }
  const count = countAnswers(examId);
  if (pos !== count) {
    return res.status(400).json({ error: "Order mismatch", nextPosition: count });
  }
  const m = db
    .prepare("SELECT question_id FROM mock_exam_questions WHERE exam_id = ? AND position = ?")
    .get(examId, pos);
  if (!m) return res.status(404).json({ error: "Not found" });
  const q = db.prepare("SELECT * FROM questions WHERE id = ?").get(m.question_id);
  if (!q) return res.status(500).json({ error: "DB error" });
  const isCorrect = letter === String(q.correct_answer).toUpperCase() ? 1 : 0;
  const existing = db
    .prepare("SELECT id FROM exam_answers WHERE exam_id = ? AND question_id = ?")
    .get(examId, m.question_id);
  if (existing) {
    return res.status(400).json({ error: "Already answered" });
  }
  db.prepare(
    `INSERT INTO exam_answers (exam_id, question_id, selected_answer, is_correct, time_taken_seconds)
     VALUES (?, ?, ?, ?, ?)`
  ).run(examId, m.question_id, letter, isCorrect, sec);
  if (pos === TOTAL_MOCK - 1) {
    finishExamInternal(examId, req.user.id, "last");
    const e2 = getExamForUser(examId, req.user.id);
    return res.json({ finished: true, score: e2?.score, exam: { id: examId, score: e2?.score } });
  }
  res.json({ finished: false, nextPosition: pos + 1 });
});

export default router;
