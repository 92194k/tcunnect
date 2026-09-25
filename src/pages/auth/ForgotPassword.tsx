import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, Compass, ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Please enter your email address.");

    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Demo mode — just pretend
        await new Promise((r) => setTimeout(r, 800));
        setSent(true);
        return;
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw new Error(resetError.message);
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many") || msg.toLowerCase().includes("email rate")) {
        setError("Too many reset emails sent. Supabase limits this to a few per hour — please wait a few minutes before trying again, or check your spam folder.");
      } else if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no user")) {
        // Don't reveal if email exists — just show success to prevent enumeration
        setSent(true);
        return;
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">📬</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Check your email</h1>
          <p className="text-slate-500 text-sm mb-2">We sent a password reset link to</p>
          <p className="font-semibold text-sky-700 mb-6">{email}</p>
          <p className="text-slate-400 text-xs mb-8">
            Click the link in your email to reset your password. It expires in 1 hour.
          </p>
          <Link to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition">
            <ArrowLeft className="h-4 w-4" /> Back to Log In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="h-11 w-11 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:bg-sky-700 transition">
              <Compass className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold text-slate-900">TC<span className="text-sky-600">U</span>nnect</span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">Travel. Connect. Unwind.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Log In
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Forgot your password?</h1>
          <p className="text-slate-500 text-sm mb-7">
            Enter your email and we'll send you a reset link.
          </p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
