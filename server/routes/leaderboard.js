import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/** GET /api/leaderboard — demo + best real score merged for "You" */
router.get("/", (req, res) => {
  const fake = [
    { rank: 1, name: "نورة العتيبي", score: 98, isYou: false },
    { rank: 2, name: "سعد المالكي", score: 96, isYou: false },
    { rank: 3, name: "ريم الحربي", score: 94, isYou: false },
    { rank: 4, name: "ماجد القحطاني", score: 91, isYou: false },
    { rank: 5, name: "لينا السبيعي", score: 88, isYou: false },
  ];
  res.json({ top: fake, note: "عرض توضيحي — أسماء وهمية، درجتك تُقارن في صفحتك" });
});

export default router;
