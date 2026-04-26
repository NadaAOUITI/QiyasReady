import path from "path";
import { fileURLToPath } from "url";
import { db, initDb } from "../db.js";
import { seedQuestions } from "./seedQuestions.js";

export function runSeed() {
  initDb();
  const ins = db.prepare(
    `INSERT INTO questions (section, chapter, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const run = db.transaction((rows) => {
    for (const q of rows) {
      ins.run(
        q.section,
        q.chapter,
        q.difficulty,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.explanation
      );
    }
  });
  run(seedQuestions);
  const n = db.prepare("SELECT COUNT(*) as c FROM questions").get().c;
  console.log(`Seeded ${n} questions.`);
}

const isRunDirectly =
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "");
if (isRunDirectly) {
  runSeed();
}
