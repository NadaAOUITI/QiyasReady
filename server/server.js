import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { initDb, db } from "./db.js";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exams.js";
import practiceRoutes from "./routes/practice.js";
import aiRoutes from "./routes/ai.js";
import userRoutes from "./routes/users.js";
import leaderboardRoutes from "./routes/leaderboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

initDb();
const questionCount = db.prepare("SELECT COUNT(*) as c FROM questions").get().c;
if (questionCount === 0) {
  const { runSeed } = await import("./seed/runSeed.js");
  runSeed();
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "qiyasready" });
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`QiyasReady API http://localhost:${PORT}`);
});
