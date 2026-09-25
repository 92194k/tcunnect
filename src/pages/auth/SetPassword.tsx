import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Lock, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { useAuthStore } from "../../stores";

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-slate-400"}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </li>
  );
}

/**
 * /password-setup
 * Shown ONCE to brand-new Google sign-up users so they can also log in with email+password.
 * After completing or skipping, sets user_metadata.password_setup_seen = true so it never appears again.
 */
export default function SetPassword() {
  const navigate = useNavigate();
  const { onboardingComplete } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState("");

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const pwStrong = Object.values(rules).every(Boolean);
  const destination = onboardingComplete ? "/dashboard" : "/onboarding";

  // Mark setup as seen in Supabase user metadata (so it never shows again)
  async function markSeen() {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.updateUser({ data: { password_setup_seen: true } });
    } catch {
      // Non-fatal — worst case they see this screen once more next sign-in
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!pwStrong) return setError("Please meet all password requirements.");
    if (password !== confirm) return setError("Passwords do not match.");

    setSaving(true);
    try {
      if (isSupabaseConfigured) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw new Error(updateError.message);
      }
      await markSeen();
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSkipping(true);
    await markSeen();
    navigate(destination, { replace: true });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="h-11 w-11 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Compass className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold text-slate-900">TC<span className="text-sky-600">U</span>nnect</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create a password</h1>
          <p className="text-slate-500 text-sm mb-7">
            Set a password so you can log in to your TCUnnect account with email too.
          </p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {password && (
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
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                />
              </div>
              {confirm && password !== confirm && (
                <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || skipping}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Set Password & Continue"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving || skipping}
              className="text-sm text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
            >
              {skipping ? "Skipping..." : "Skip for now"}
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            You can always log in with Google — this just adds email login as an option.
          </p>
        </div>
      </div>
    </main>
  );
}
