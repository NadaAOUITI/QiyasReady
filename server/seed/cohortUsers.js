import bcrypt from "bcryptjs";
import { db } from "../db.js";

const SCHOOL = "ISIMM";
const USERS = [
  { email: "isimm1@demo.local", name: "طالب ISIMM 1" },
  { email: "isimm2@demo.local", name: "طالب ISIMM 2" },
  { email: "isimm3@demo.local", name: "طالب ISIMM 3" },
  { email: "isimm4@demo.local", name: "طالب ISIMM 4" },
  { email: "isimm5@demo.local", name: "طالب ISIMM 5" },
];

/**
 * Idempotent: ensures 5 fake students at the same school for cohort demo.
 */
export function ensureCohortDemoUsers() {
  const c = db.prepare("SELECT COUNT(*) as n FROM users WHERE school_name = ?").get(SCHOOL)?.n || 0;
  if (c >= 5) return;
  const hash = bcrypt.hashSync("demo1234", 10);
  const insU = db.prepare(
    "INSERT OR IGNORE INTO users (email, password_hash, name, role, school_name) VALUES (?, ?, ?, 'student', ?)"
  );
  const updSchool = db.prepare("UPDATE users SET school_name = ? WHERE email = ?");
  for (const u of USERS) {
    insU.run(u.email, hash, u.name, SCHOOL);
    updSchool.run(SCHOOL, u.email);
  }
  const rows = db.prepare("SELECT id FROM users WHERE school_name = ?").all(SCHOOL);
  if (rows.length < 5) return;
  const vIds = db.prepare("SELECT id FROM questions WHERE section = 'verbal' LIMIT 10").all().map((r) => r.id);
  const qIds = db.prepare("SELECT id FROM questions WHERE section = 'quantitative' LIMIT 10").all().map((r) => r.id);
  if (vIds.length < 10 || qIds.length < 10) return;
  const allQ = [...vIds, ...qIds];
  for (const { id: userId } of rows) {
    const n = db.prepare("SELECT COUNT(*) as c FROM mock_exams WHERE user_id = ?").get(userId).c;
    if (n > 0) continue;
    const score = 60 + (userId % 5) * 7;
    const sub = new Date().toISOString();
    const start = new Date(Date.now() - 1200000).toISOString();
    const r = db
      .prepare(
        `INSERT INTO mock_exams (user_id, started_at, submitted_at, score, total_questions, status, duration_seconds)
         VALUES (?, ?, ?, ?, 20, 'submitted', 900)`
      )
      .run(userId, start, sub, score);
    const eid = r.lastInsertRowid;
    const insM = db.prepare("INSERT OR IGNORE INTO mock_exam_questions (exam_id, position, question_id) VALUES (?, ?, ?)");
    for (let i = 0; i < 20; i++) {
      insM.run(eid, i, allQ[i]);
    }
  }
}
