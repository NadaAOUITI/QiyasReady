import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-8b-8192";

const SYSTEM = `You are a helpful Qiyas exam tutor. Answer only questions related to the Qiyas exam, math, Arabic language, and exam strategy. Be concise and encouraging. Respond in the same language the student uses (Arabic or English).`;

const TIPS = [
  "ركّز على إدارة الوقت: دقيقة لكل سؤال في المتوسط.",
  "اقرأ خيارات الكمي قبل الحساب الطويل.",
  "في اللفظي: اقرأ المقطع مرة سريعة ثم عُد للسؤال.",
  "نمِّ مبكراً قبل يوم الاختبار.",
  "تمرّن يومياً 20 دقيقة أفضل من جلسة واحدة في الأسبوع.",
  "إذا ترددت: استبعد الخيارين الأضعف أولاً.",
  "راجع أخطائك فقط—لا تعيد نفس نمط الدراسة.",
  "تنفس بعمق عند الضغط: 4 ثوانٍ داخل و6 خارج.",
  "اكتب ملاحظاتك بالعربية بخط واضح للمراجعة.",
  "ثق بتحضيرك: الاختبار يقيس الروتين لا الذكاء فقط.",
];

const FALLBACK_CHAT =
  "أنا هنا لمساعدتك في قياس (اللغة/الشكل والمنطق/العلوم). اطرح سؤالاً حول اختبار قياس، الاستراتيجية، الرياضيات، أو العربية. Example: 'How can I improve timing on verbal?'";

function weakSectionFromExams(userId) {
  const ex = db
    .prepare(
      `SELECT id FROM mock_exams WHERE user_id = ? AND status = 'submitted' ORDER BY submitted_at DESC LIMIT 1`
    )
    .get(userId);
  if (!ex) {
    return { verbal: 50, quant: 50, weaker: "verbal", note: "no_exam" };
  }
  const rows = db
    .prepare(
      `SELECT q.section, a.is_correct FROM exam_answers a
       JOIN questions q ON q.id = a.question_id WHERE a.exam_id = ?`
    )
    .all(ex.id);
  let v = 0;
  let vt = 0;
  let qn = 0;
  let qt = 0;
  for (const r of rows) {
    if (r.section === "verbal") {
      vt += 1;
      if (r.is_correct) v += 1;
    } else {
      qt += 1;
      if (r.is_correct) qn += 1;
    }
  }
  const vPct = vt ? (v / vt) * 100 : 50;
  const qPct = qt ? (qn / qt) * 100 : 50;
  return {
    verbal: Math.round(vPct),
    quant: Math.round(qPct),
    weaker: vPct <= qPct ? "verbal" : "quantitative",
  };
}

async function groqChat(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.5, max_tokens: 800 }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.choices?.[0]?.message?.content?.trim() || null;
}

function hardcodedStudyPlan(weak, days) {
  const w = weak.weaker === "verbal" ? "اللفظي" : "الكمي";
  const weeks = [];
  let dayNum = 1;
  const nWeeks = Math.min(6, Math.max(1, Math.ceil(days / 7)));
  for (let wk = 0; wk < nWeeks; wk++) {
    const list = [];
    for (let d = 0; d < 7 && dayNum <= days; d++) {
      const alt = weak.weaker === "verbal" ? (dayNum % 2 ? "verbal" : "quant") : dayNum % 2 ? "quant" : "verbal";
      const target =
        alt === "verbal"
          ? "قراءة + مفردات + 15 سؤالاً لفظياً"
          : "عربي/منطق: 20 سؤالاً كمياً (جبر/هندسة)";
      list.push({ day: dayNum, title: `يوم ${dayNum}`, target, minutes: 45 + (dayNum % 3) * 5 });
      dayNum++;
    }
    weeks.push({ week: wk + 1, days: list });
  }
  return {
    summary: `خطة لـ ${Math.min(days, dayNum - 1)} يوماً: زِد من ${w} (حسب آخر محاكاة) مع توازن يومي بين الأقسام.`,
    weeks,
    source: "hardcoded",
  };
}

/** POST /api/ai/chat */
router.post("/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "message required" });
  }
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: String(message).trim() },
  ];
  let reply;
  try {
    reply = await groqChat(messages);
  } catch (e) {
    console.error(e);
  }
  if (!reply) {
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    reply = `${FALLBACK_CHAT}\n\nنصيحة سريعة: ${tip}`;
  }
  res.json({ reply, fallback: !process.env.GROQ_API_KEY });
});

/** GET /api/ai/study-plan */
router.get("/study-plan", (req, res) => {
  const row = db.prepare("SELECT study_plan_json FROM users WHERE id = ?").get(req.user.id);
  if (!row?.study_plan_json) {
    return res.json({ plan: null });
  }
  try {
    return res.json({ plan: JSON.parse(row.study_plan_json) });
  } catch {
    return res.json({ plan: null });
  }
});

/** POST /api/ai/study-plan */
router.post("/study-plan", async (req, res) => {
  const daysUntilExam = Math.max(7, Math.min(90, Math.floor(Number(req.body?.daysUntilExam) || 30)));
  const weak = weakSectionFromExams(req.user.id);
  const days = daysUntilExam;
  db.prepare("UPDATE users SET days_until_exam = ? WHERE id = ?").run(days, req.user.id);
  const prompt = `The student is preparing for the Qiyas (Saudi) exam. 
Their latest mock: verbal ~${weak.verbal}% correct, quantitative ~${weak.quant}%. 
Weaker area: ${weak.weaker}. Days until target exam: ${days}.
Output JSON only with this shape:
{ "summary": "string (Arabic, 2-3 sentences)", "weeks": [ { "week": 1, "days": [ { "day": 1, "title": "ar", "target": "ar", "minutes": 40 } ] } ] }
Include 1-4 weeks. Each week has 3-4 day objects. Keep targets concrete.`;

  let plan = null;
  try {
    const raw = await groqChat([
      { role: "system", content: "You output valid JSON only. No markdown." },
      { role: "user", content: prompt },
    ]);
    if (raw) {
      const j = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
      plan = JSON.parse(j);
    }
  } catch (e) {
    console.error(e);
  }
  if (!plan || !plan.weeks) {
    plan = hardcodedStudyPlan(weak, days);
  } else {
    plan.source = "groq";
  }
  const json = JSON.stringify(plan);
  db.prepare("UPDATE users SET study_plan_json = ? WHERE id = ?").run(json, req.user.id);
  res.json({ plan, weakSection: weak });
});

export { TIPS, groqChat };
export default router;
