import { useState } from "react";
import Logo from "../components/Logo";
import { supabase } from "../lib/supabase";

type Props = { onNavigate: (v: string) => void };

export default function ResetPassword({ onNavigate }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password. Try requesting a new reset link.");
    } finally {
      setLoading(false);
    }
  }

  // Password strength indicator
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Too short", "Good", "Strong"];
  const strengthColor = ["", "bg-like", "bg-amber-400", "bg-match"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0EBFF] via-white to-[#FFE8F0] flex items-center justify-center p-4 font-display">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-primary opacity-5 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-pink-400 opacity-5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => onNavigate("landing")} className="inline-block">
            <Logo />
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden slide-up">
          {done ? (
            /* ── SUCCESS STATE ── */
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-match-light flex items-center justify-center text-4xl">
                🔐
              </div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">Password updated!</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Your new password has been set. You can now log in with it.
              </p>
              <button
                onClick={() => onNavigate("login")}
                className="w-full py-4 rounded-2xl bg-primary text-white font-extrabold text-base hover:bg-primary-dark transition-colors"
              >
                Go to Log In →
              </button>
            </div>
          ) : (
            /* ── FORM STATE ── */
            <>
              {/* Header accent */}
              <div className="bg-gradient-to-r from-primary to-[#EC4899] px-8 py-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-3">
                  🔑
                </div>
                <h2 className="text-xl font-extrabold text-white">Set new password</h2>
                <p className="text-white/70 text-sm mt-1">Choose something strong and memorable.</p>
              </div>

              <div className="p-8">
                {error && (
                  <div className="bg-like/10 border border-like/20 rounded-2xl px-4 py-3 text-sm text-like font-medium mb-5 flex gap-2 items-start">
                    <span className="flex-shrink-0 mt-0.5">⚠️</span>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New password */}
                  <div>
                    <label className="block text-sm font-bold text-[#1A1033] mb-2">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : "bg-slate-100"}`} />
                          ))}
                        </div>
                        <p className={`text-xs font-semibold ${strength === 1 ? "text-like" : strength === 2 ? "text-amber-500" : "text-match"}`}>
                          {strengthLabel[strength]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-sm font-bold text-[#1A1033] mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      className={`w-full border-2 rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-colors ${
                        confirmPassword.length > 0 && confirmPassword !== password
                          ? "border-like focus:border-like"
                          : confirmPassword.length > 0 && confirmPassword === password
                          ? "border-match focus:border-match"
                          : "border-slate-200 focus:border-primary"
                      }`}
                      required
                    />
                    {confirmPassword.length > 0 && confirmPassword === password && (
                      <p className="text-xs text-match font-semibold mt-1.5">✓ Passwords match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white font-extrabold py-4 rounded-2xl hover:bg-primary-dark transition-colors text-base disabled:opacity-50 mt-2"
                  >
                    {loading ? "Updating…" : "Update Password"}
                  </button>
                </form>

                <button onClick={() => onNavigate("login")} className="w-full text-center text-sm text-slate-400 hover:text-primary mt-4 transition-colors">
                  ← Back to Log In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
