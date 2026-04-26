import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const cards = [
  { t: "محاكاة بوقت حقيقي", d: "20 دقيقة، 20 سؤالاً، بدون رجوع—كما في الاختبار.", icon: "⏱" },
  { t: "مساعد ذكي", d: "دردشة Qiyas (Groq) + نصائح جاهزة عند انقطاع الاتصال.", icon: "✨" },
  { t: "تحليل + خطة", d: "مخطط بسيط، دقة لكل قسم، وخطة أسبوعية بعد أول محاكاة.", icon: "📈" },
  { t: "تجربة مجانية", d: "محاكاة كاملة واحدة؛ ثم واجهة اشتراك للديمو (بدون دفع).", icon: "🎁" },
];

export function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <span className="text-xl font-bold">
            <span className="text-gold">●</span> QiyasReady
          </span>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-gold text-brand font-semibold rounded-lg px-4 py-2 text-sm"
              >
                لوحة التحكم
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-white/90 px-3 py-2 text-sm">
                  دخول
                </Link>
                <Link
                  to="/register"
                  className="bg-gold text-brand font-semibold rounded-lg px-4 py-2 text-sm"
                >
                  ابدأ مجاناً
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand via-brand to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center page-enter">
          <p className="text-gold font-semibold text-sm mb-2">Qiyas GAT-style prep · ويب فقط</p>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            استعد لاختبار قياس
            <br />
            <span className="text-gold" dir="ltr" lang="en">
              Verbal + Quant
            </span>{" "}
            في واجهة عربية احترافية
          </h1>
          <p className="text-white/85 max-w-2xl mx-auto mb-4 text-base md:text-lg" dir="rtl" lang="ar">
            وضع محاكاة بشاشة كاملة، تدريب تفاعلي، ولوحة أداء—مع مساعد ذكي (Groq) وخطة تُولَّد بعد
            أول اختبار.
          </p>
          <p className="text-white/70 max-w-xl mx-auto mb-8 text-sm" dir="ltr" lang="en">
            Bilingual design · RTL by default · Deep blue + gold for a clear, trustworthy look.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {user ? (
              <Link
                to="/mock-exam"
                className="inline-block bg-gold text-brand font-bold rounded-xl px-8 py-3 shadow-lg"
              >
                ابدأ محاكاة
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-block bg-gold text-brand font-bold rounded-xl px-8 py-3 shadow-lg"
                >
                  جرّب مجاناً
                </Link>
                <Link
                  to="/login"
                  className="inline-block border-2 border-white/40 rounded-xl px-6 py-3 font-semibold text-white/95 hover:bg-white/10"
                >
                  لدي حساب
                </Link>
              </>
            )}
            <Link
              to="/pricing"
              className="inline-block border-2 border-white/40 rounded-xl px-6 py-3 font-semibold text-white/95 hover:bg-white/10"
            >
              الاشتراكات
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 w-full">
        <h2 className="text-center text-xl font-bold text-brand mb-6">ماذا يتضمّن العرض؟</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((x) => (
            <div
              key={x.t}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-right"
            >
              <div className="text-2xl mb-2">{x.icon}</div>
              <h3 className="font-bold text-brand mb-1">{x.t}</h3>
              <p className="text-slate-600 text-sm">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section dir="ltr" lang="en" className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-12 md:flex md:items-start md:gap-12">
          <div className="flex-1 mb-8 md:mb-0">
            <h2 className="text-2xl font-bold text-brand mb-2">Onboarding in two languages</h2>
            <p className="text-slate-600 mb-4">
              Register once, take your free full mock, then the paywall is shown as a UI (no real
              card). Leaderboard is illustrative; your real progress lives in performance analytics.
            </p>
            <ul className="space-y-2 text-slate-700 text-sm list-disc pl-5">
              <li>Floating Qiyas tutor chat on every in-app page</li>
              <li>10 rotating strategy tips on navigation (toast)</li>
              <li>Material cards + gamification badges on profile</li>
            </ul>
          </div>
          <div className="flex-1 text-right" dir="rtl" lang="ar">
            <h2 className="text-2xl font-bold text-brand mb-2">تجربة مرتبة للعرض</h2>
            <p className="text-slate-600 mb-4">
              الهدف: أن يشعر المُقيّم أن كل رابط قابل للنقر بلا أعطال—مع بيانات وهمية ناعمة حيث يلزم
              (الصدارة) وبيانات حقيقية عند الاختبارات.
            </p>
            <p className="text-sm text-slate-500">ألوان: أزرق #1E3A8A وذهبي #F59E0B</p>
          </div>
        </div>
      </section>
    </div>
  );
}
