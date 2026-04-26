import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function NotFound() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6" dir="rtl">
      <div className="text-center max-w-md page-enter">
        <p className="text-6xl font-black text-brand/20 mb-2" dir="ltr">
          404
        </p>
        <h1 className="text-2xl font-bold text-brand mb-2">الصفحة غير موجودة</h1>
        <p className="text-slate-600 text-sm mb-8" dir="ltr" lang="en">
          The page you opened doesn’t exist in this demo.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold"
          >
            الرئيسية
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="inline-block px-5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm text-brand"
            >
              لوحة التحكم
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
