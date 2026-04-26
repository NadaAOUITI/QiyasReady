# QiyasReady

Qiyas-style exam prep demo (React + Express + SQLite).

## 🎬 Demo

[![QiyasReady Demo](https://img.youtube.com/vi/JSQLLtRQnxU/0.jpg)](https://www.youtube.com/watch?v=JSQLLtRQnxU)

## Run

From the repo root:

```bash
npm install
npm run install:all
```

Create `server/.env` with `PORT`, `JWT_SECRET`, and optionally `GROQ_API_KEY`.

```bash
npm run dev
```

Client: `http://localhost:5173` · API: `http://localhost:3001`

## MVP notes

- **Flight mode / offline:** The mock exam page can download a JSON pack and the `/offline-exam` route runs the timer client-side with results in `localStorage`, then **Sync** posts to `/api/exams/offline-submit`. A full **PWA + service worker** for production-grade offline caching is out of scope for this demo.

- **Cohort demo users:** Five accounts at school **ISIMM** (e.g. `isimm1@demo.local` … `isimm5@demo.local`, password `demo1234`) are seeded when the DB has enough questions. Set your profile school to `ISIMM` to see the cohort leaderboard.
