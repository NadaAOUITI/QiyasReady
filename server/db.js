import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, "qiyas.db");
export const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

function migrate() {
  const tables = new Set(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name)
  );
  if (tables.has("users")) {
    const ucols = db.prepare("PRAGMA table_info(users)").all();
    const has = (n) => ucols.some((c) => c.name === n);
    if (!has("free_trial_exhausted")) {
      db.exec("ALTER TABLE users ADD COLUMN free_trial_exhausted INTEGER NOT NULL DEFAULT 0");
    }
    if (!has("subscription_tier")) {
      db.exec("ALTER TABLE users ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'none'");
    }
    if (!has("days_until_exam")) {
      db.exec("ALTER TABLE users ADD COLUMN days_until_exam INTEGER");
    }
    if (!has("study_plan_json")) {
      db.exec("ALTER TABLE users ADD COLUMN study_plan_json TEXT");
    }
    if (!has("last_login_date")) {
      db.exec("ALTER TABLE users ADD COLUMN last_login_date TEXT");
    }
    if (!has("streak_days")) {
      db.exec("ALTER TABLE users ADD COLUMN streak_days INTEGER NOT NULL DEFAULT 0");
    }
    if (!has("school_name")) {
      db.exec("ALTER TABLE users ADD COLUMN school_name TEXT");
    }
    if (!has("credits")) {
      db.exec("ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 0");
    }
  }
  if (tables.has("mock_exams")) {
    const cols = db.prepare("PRAGMA table_info(mock_exams)").all();
    if (!cols.some((c) => c.name === "ends_at")) {
      db.exec("ALTER TABLE mock_exams ADD COLUMN ends_at TEXT");
    }
    if (!cols.some((c) => c.name === "duration_seconds")) {
      db.exec("ALTER TABLE mock_exams ADD COLUMN duration_seconds INTEGER");
    }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS mock_exam_questions (
      exam_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      PRIMARY KEY (exam_id, position),
      FOREIGN KEY (exam_id) REFERENCES mock_exams(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );
  `);
  try {
    db.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS uq_exam_answers_exam_q ON exam_answers (exam_id, question_id)"
    );
  } catch {
    /* existing DB may have duplicates; delete data/qiyas.db to reset */
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_goals (
      user_id INTEGER NOT NULL,
      goal_type TEXT NOT NULL,
      target INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, goal_type),
      CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS question_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      report_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id),
      UNIQUE (user_id, question_id)
    );
  `);
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      chapter TEXT,
      difficulty TEXT NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mock_exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      submitted_at TEXT,
      score REAL,
      total_questions INTEGER NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exam_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_answer TEXT,
      is_correct INTEGER NOT NULL,
      time_taken_seconds INTEGER,
      FOREIGN KEY (exam_id) REFERENCES mock_exams(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS practice_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_answer TEXT,
      is_correct INTEGER NOT NULL,
      time_taken_seconds INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );
  `);
  migrate();
}
