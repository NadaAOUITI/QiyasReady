import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { RequireAuth } from "./components/RequireAuth.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Login } from "./pages/Login.jsx";
import { Register } from "./pages/Register.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { MockExam } from "./pages/MockExam.jsx";
import { ExamSession } from "./pages/ExamSession.jsx";
import { ExamResults } from "./pages/ExamResults.jsx";
import { PracticeMode } from "./pages/PracticeMode.jsx";
import { StudyPlan } from "./pages/StudyPlan.jsx";
import { StudyMaterial } from "./pages/StudyMaterial.jsx";
import { Leaderboard } from "./pages/Leaderboard.jsx";
import { Profile } from "./pages/Profile.jsx";
import { Pricing } from "./pages/Pricing.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import CommonMistakes from "./pages/CommonMistakes.jsx";
import { Goals } from "./pages/Goals.jsx";
import { CohortLeaderboard } from "./pages/CohortLeaderboard.jsx";
import { OfflineExam } from "./pages/OfflineExam.jsx";

const Performance = lazy(() => import("./pages/Performance.jsx"));

function PerfFallback() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center" dir="rtl">
      <div className="h-8 w-8 border-2 border-gold border-t-brand rounded-full animate-spin mx-auto" />
      <p className="text-slate-500 text-sm mt-3">جارٍ تحميل المخططات…</p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route element={<RequireAuth />}>
              <Route path="/mock-exam/run/:examId" element={<ExamSession />} />
              <Route path="/offline-exam" element={<OfflineExam />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mock-exam" element={<MockExam />} />
                <Route path="/exam-results/:examId" element={<ExamResults />} />
                <Route path="/practice" element={<PracticeMode />} />
                <Route
                  path="/performance"
                  element={
                    <Suspense fallback={<PerfFallback />}>
                      <Performance />
                    </Suspense>
                  }
                />
                <Route path="/study-plan" element={<StudyPlan />} />
                <Route path="/materials" element={<StudyMaterial />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/leaderboard/cohort" element={<CohortLeaderboard />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/common-mistakes" element={<CommonMistakes />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
