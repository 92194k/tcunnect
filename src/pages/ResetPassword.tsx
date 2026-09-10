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

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      // By the time this page renders, App.tsx has already caught Supabase's
      // PASSWORD_RECOVERY event, meaning the user's session is already the
      // special recovery session from clicking the email link — this just
      // sets the new password on that session.
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update your password. Try requesting a new reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0EBFF] via-white to-[#FFE8F0] flex items-center justify-center p-4 font-display">
      <div className="w-full max-w-md">
        <div className="text-center mb-6"><Logo /></div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 slide-up">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-match-light flex items-center justify-center text-3xl">✅</div>
              <h2 className="text-xl font-extrabold text-[#1A1033] mb-2">Password updated</h2>
              <p className="text-slate-500 text-sm mb-6">You can now log in with your new password.</p>
              <button
                onClick={() => onNavigate("login")}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-extrabold text-[#1A1033] mb-1 text-center">Set a new password</h2>
              <p className="text-slate-500 text-sm mb-6 text-center">Choose a new password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-like-light border border-like/30 rounded-xl px-4 py-3 text-sm text-like font-medium">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1033] mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1033] mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors mt-2 disabled:opacity-60">
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
