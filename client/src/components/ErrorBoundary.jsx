import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("QiyasReady ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-slate-100 p-6"
          dir="rtl"
        >
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gold font-bold text-sm mb-2">QiyasReady</p>
            <h1 className="text-xl font-bold text-brand mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-slate-600 text-sm mb-6">
              جرّب إعادة تحميل الصفحة. إذا تكرّر، ارجع للرئيسية.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-semibold"
              >
                إعادة التحميل
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = "/";
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-brand"
              >
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
