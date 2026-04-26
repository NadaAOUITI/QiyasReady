const blocks = [
  {
    id: "verbal",
    title: "القسم اللفظي",
    icon: "📖",
    items: [
      "الاستيعاب القرائي: حدّد الفكرة الرئيسية قبل التفاصيل.",
      "المفردات: اربط الكلمة بعكسها أو بمثال سياقي.",
      "الإكمال: اقرأ الجملة كاملة بعد الاختيار للتأكد من التناغم.",
      "الخطأ الشائع: التعجيل — اترك 20 ثانية للمراجعة السريعة.",
    ],
  },
  {
    id: "quant",
    title: "القسم الكمي",
    icon: "🔢",
    items: [
      "الجبر: عوّض فقط بعد تبسيط الطرفين.",
      "الهندسة: ارسم شكلاً مصغّراً عند التشوّس في الشكل.",
      "النسب: اجعل المقامات موحّدة قبل الجمع.",
      "الوقت: ضع هدفاً بـ 2–3 دقائق للسؤال المتوسط.",
    ],
  },
  {
    id: "strategy",
    title: "استراتيجية الاختبار",
    icon: "🎯",
    items: [
      "قسّم الجلسة: فقرة كمي ثم فقرة لفظي يومياً.",
      "سجّل الأخطاء في ملف واحد وكرّرها أسبوعياً.",
      "نم مبكراً على الأقل ليلتين قبل المحاكاة الكبيرة.",
      "ثبّت عادات الإفطار والنوم أسبوعاً قبل الاختبار الحقيقي.",
    ],
  },
];

export function StudyMaterial() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter" dir="rtl">
      <h1 className="text-2xl font-bold text-brand mb-1">المادة الدراسية</h1>
      <p className="text-slate-500 text-sm mb-8" dir="ltr" lang="en">
        Curated tips — demo cards
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {blocks.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col"
          >
            <div className="text-3xl mb-2">{b.icon}</div>
            <h2 className="text-lg font-bold text-brand mb-3">{b.title}</h2>
            <ul className="space-y-2 text-sm text-slate-700 flex-1">
              {b.items.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gold shrink-0">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
