import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, Compass, Check, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-slate-400"}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </li>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  // null = still verifying, true = recovery session confirmed, false = expired/invalid
  const [recoveryReady, setRecoveryReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setRecoveryReady(true);
      return;
    }

    // Fast path: the global listener in AppRoutes already caught PASSWORD_RECOVERY
    // and set this flag before routing here. Show form immediately.
    if (sessionStorage.getItem("_tcunnect_pw_recovery") === "1") {
      setRecoveryReady(true);
      return;
    }

    // Slow path: user landed directly on /reset-password (e.g. deep-link or refresh).
    // Listen for the PASSWORD_RECOVERY event that fires when Supabase auto-exchanges
    // the ?code= param in the URL.
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      if (value) sessionStorage.setItem("_tcunnect_pw_recovery", "1");
      setRecoveryReady(value);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        settle(true);
      }
    });

    // 10-second timeout — if no recovery event fires, the link is stale/invalid
    const timeoutId = setTimeout(() => settle(false), 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Clean up recovery flag when leaving this page
  useEffect(() => {
    return () => {
      // Only remove on unmount so the flag survives hot-reloads during dev
      // but is gone once the user leaves /reset-password for good
      sessionStorage.removeItem("_tcunnect_pw_recovery");
    };
  }, []);

  const pw = form.password;
  const rules = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
  };
  const pwStrong = Object.values(rules).every(Boolean);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.password || !form.confirm) return setError("Please fill in both fields.");
    if (!pwStrong) return setError("Please meet all password requirements.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
      if (updateError) throw new Error(updateError.message);

      // Sign out locally so the recovery session doesn't persist as a normal session
      await supabase.auth.signOut({ scope: "local" });

      // Clear recovery flag — we're done
      sessionStorage.removeItem("_tcunnect_pw_recovery");

      setDone(true);
      // Navigate immediately — no setTimeout
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verifying recovery link ──────────────────────────────────
  if (recoveryReady === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Verifying your reset link…</p>
        </div>
      </div>
    );
  }

  // ── Expired / invalid link ───────────────────────────────────
  if (recoveryReady === false) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">⏱️</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Reset link expired</h1>
          <p className="text-slate-500 text-sm mb-6">
            Password reset links expire after 1 hour. Request a new one below.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-3 rounded-full text-sm transition"
          >
            Request New Link
          </button>
        </div>
      </main>
    );
  }

  // ── Success (brief — navigate fires immediately after updateUser) ──
  if (done) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Password updated!</h1>
          <p className="text-slate-500 text-sm">Redirecting you to Log In…</p>
        </div>
      </main>
    );
  }

  // ── Password form ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="h-11 w-11 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Compass className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold text-slate-900">
              TC<span className="text-sky-600">U</span>nnect
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-2">Travel. Connect. Unwind.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset your password</h1>
          <p className="text-slate-500 text-sm mb-7">Choose a strong new password for your account.</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={onChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating password…
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
