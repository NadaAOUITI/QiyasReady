import { Link } from "react-router-dom";

/**
 * Placeholder for pages not yet fully built; keeps every route working.
 */
export function PageShell({ title, en, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 page-enter">
      <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-2">QiyasReady</p>
      <h1 className="text-2xl font-bold text-brand mb-1">{title}</h1>
      {en && <p className="text-slate-500 text-sm mb-6" dir="ltr" lang="en">
        {en}
      </p>}
      {children}
      <div className="mt-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-brand font-medium hover:underline"
        >
          ← العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
