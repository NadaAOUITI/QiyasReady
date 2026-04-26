import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { initDb, db } from "./db.js";
import { ensureCohortDemoUsers } from "./seed/cohortUsers.js";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exams.js";
import practiceRoutes from "./routes/practice.js";
import aiRoutes from "./routes/ai.js";
import userRoutes from "./routes/users.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import goalsRoutes from "./routes/goals.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/* Load .env from server/ first, then repo root (dotenv does not override already-set vars) */
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PORT = Number(process.env.PORT) || 3001;

initDb();
const questionCount = db.prepare("SELECT COUNT(*) as c FROM questions").get().c;
if (questionCount === 0) {
  const { runSeed } = await import("./seed/runSeed.js");
  runSeed();
}
ensureCohortDemoUsers();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "qiyasready",
    /** true when GROQ_API_KEY is set (value not exposed) */
    groqConfigured: Boolean(process.env.GROQ_API_KEY && String(process.env.GROQ_API_KEY).trim()),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/goals", goalsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`QiyasReady API http://localhost:${PORT}`);
});
