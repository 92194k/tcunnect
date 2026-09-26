import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Compass, Check, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-slate-400"}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </li>
  );
}

// ─── OTP Verification Screen ───────────────────────────────────
function OtpScreen({
  email,
  onBack,
  onVerified,
}: {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  const handleDigit = (i: number, val: string) => {
    // Handle paste of full code
    if (val.length > 1) {
      const cleaned = val.replace(/\D/g, "").slice(0, 8);
      const next = [...digits];
      for (let j = 0; j < 8; j++) next[j] = cleaned[j] ?? "";
      setDigits(next);
      refs.current[Math.min(cleaned.length, 7)]?.focus();
      return;
    }
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 7) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return setError("Please enter the full code.");
    setError("");
    setVerifying(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (verifyError) throw verifyError;
      console.log("[OTP] verified — calling onVerified");
      onVerified();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid code.";
      console.log("[OTP] verify error:", msg);
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        setError("That code is expired or invalid. Request a new one below.");
      } else {
        setError(msg);
      }
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setError("");
    try {
      await supabase.auth.resend({ type: "signup", email });
      setResent(true);
      setDigits(["", "", "", "", "", "", "", ""]);
      refs.current[0]?.focus();
      setTimeout(() => setResent(false), 4000);
    } catch {
      setError("Couldn't resend. Please try again.");
    }
  };

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
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
            <p className="text-slate-500 text-sm">
              We sent a verification code to
            </p>
            <p className="font-semibold text-sky-700 text-sm mt-1">{email}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          {resent && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">New code sent! Check your inbox.</div>
          )}

          <form onSubmit={verify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                Enter your verification code
              </label>
              <div className="flex gap-2 justify-center">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={d}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-9 h-11 text-center text-lg font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition bg-slate-50"
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center mt-2">Code expires in 10 minutes</p>
            </div>

            <button
              type="submit"
              disabled={verifying || code.replace(/\D/g, "").length < 6}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              {verifying ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Verify Email"}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-slate-500">
              Didn't get the code?{" "}
              <button onClick={resend} className="text-sky-600 hover:text-sky-700 font-semibold">
                Resend
              </button>
            </p>
            <button onClick={onBack} className="text-xs text-slate-400 hover:text-slate-600">
              ← Use a different email
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Main SignUp Component ─────────────────────────────────────
export default function SignUp() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, loadSession } = useAuthStore();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const pw = form.password;
  const rules = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
  };
  const pwStrong = Object.values(rules).every(Boolean);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.email || !form.password || !form.confirm)
      return setError("Please fill in all fields.");
    if (!pwStrong) return setError("Please meet all password requirements.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    console.log("[SIGNUP] submit started — email:", form.email);
    setSubmitting(true);
    try {
      await signup(form.email, form.password, form.fullName);
      console.log("[SIGNUP] signup() resolved (no confirm required) — navigating to /onboarding");
      navigate("/onboarding");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed.";
      console.log("[SIGNUP] signup() threw:", msg);
      if (msg === "__EMAIL_CONFIRM__") {
        setEmailSent(true);
      } else if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("user already")
      ) {
        setError("An account with this email already exists. Please log in instead.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // After OTP verified, reload the session then navigate to onboarding
  const handleOtpVerified = async () => {
    console.log("[SIGNUP] OTP verified — loading session then navigating to /onboarding");
    await loadSession();
    navigate("/onboarding", { replace: true });
  };

  if (emailSent) {
    return (
      <OtpScreen
        email={form.email}
        onBack={() => setEmailSent(false)}
        onVerified={handleOtpVerified}
      />
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
          <p className="text-slate-500 text-sm mt-2">Join 12,000+ Filipino travelers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm mb-7">Start your travel journey today</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="fullName" type="text" value={form.fullName} onChange={onChange}
                  placeholder="Juan Dela Cruz"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="email" type="email" value={form.email} onChange={onChange}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="password" type={showPw ? "text" : "password"} value={form.password} onChange={onChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <ul className="mt-2 space-y-1 pl-1">
                  <PasswordRule ok={rules.length} label="At least 8 characters" />
                  <PasswordRule ok={rules.upper} label="One uppercase letter" />
                  <PasswordRule ok={rules.number} label="One number" />
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="confirm" type="password" value={form.confirm} onChange={onChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition" />
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
              )}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm mt-2">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={!isSupabaseConfigured}
            title={!isSupabaseConfigured ? "Google login requires Supabase setup" : undefined}
            className="w-full border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-sky-600 hover:text-sky-700 font-semibold">Log In</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
