import { useState } from "react";
import Logo from "../components/Logo";
import { supabase, getMyVerificationStatus } from "../lib/supabase";

type Props = {
  mode: "login" | "signup";
  onNavigate: (v: string) => void;
};

export default function Auth({ mode, onNavigate }: Props) {
  const [show, setShow] = useState(false);
  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // Check ban/suspension/deletion BEFORE routing anywhere — otherwise
        // Suspend/Ban/Delete in the admin panel (or self-deletion) are
        // purely cosmetic with no actual effect on account access.
        const { data: authData } = await supabase.auth.getUser();
        const { data: statusRow, error: statusError } = await supabase
          .from("users")
          .select("is_banned, is_suspended_until, deletion_requested_at")
          .eq("auth_id", authData.user!.id)
          .maybeSingle();

        if (statusError) {
          console.error("Failed to fetch account status before routing:", statusError);
        }
        console.log("Login status check:", statusRow); // remove once this is confirmed working

        if (statusRow?.deletion_requested_at) {
          await supabase.auth.signOut();
          setError("This account has been deleted.");
          setLoading(false);
          return;
        }
        if (statusRow?.is_banned) {
          await supabase.auth.signOut();
          setError("This account has been banned.");
          setLoading(false);
          return;
        }
        if (statusRow?.is_suspended_until && new Date(statusRow.is_suspended_until) > new Date()) {
          await supabase.auth.signOut();
          setError(`This account is suspended until ${new Date(statusRow.is_suspended_until).toLocaleString()}.`);
          setLoading(false);
          return;
        }

        // Route based on real verification status instead of always
        // assuming "discover" — an unverified account should land back on
        // the pending screen, not slip straight into the app.
        try {
          const status = await getMyVerificationStatus();
          if (status.verification_status === "approved") {
            onNavigate("discover");
          } else {
            onNavigate("verification-pending");
          }
        } catch {
          // No users row yet at all — they signed up but never finished
          // onboarding, so send them there instead of assuming pending.
          onNavigate("onboarding");
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;

        // If this email belongs to a previously-deleted account, Supabase
        // silently reuses the same underlying auth identity here (with
        // "Confirm email" off) instead of erroring — without this check,
        // "signing up again" would just resurrect the old row and let
        // Onboarding's finish() quietly update it back to a normal profile,
        // completely bypassing the deletion.
        const { data: freshAuthData } = await supabase.auth.getUser();
        if (freshAuthData.user) {
          const { data: existing } = await supabase
            .from("users")
            .select("deletion_requested_at")
            .eq("auth_id", freshAuthData.user.id)
            .maybeSingle();
          if (existing?.deletion_requested_at) {
            await supabase.auth.signOut();
            setError("This account was deleted and can't be reactivated. Please use a different email to create a new account.");
            setLoading(false);
            return;
          }
        }

        // The `users` table row (dept, year, dob, etc.) is created at the
        // END of Onboarding, not here — this step only creates the Supabase
        // Auth account. See Onboarding.tsx's finish().
        onNavigate("onboarding");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0EBFF] via-white to-[#FFE8F0] flex items-center justify-center p-4 font-display">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => onNavigate("landing")} className="block mx-auto mb-6">
            <Logo size="lg" />
          </button>
          <h1 className="text-3xl font-extrabold text-[#1A1033]">
            {isLogin ? "Welcome back!" : "Join TCUnnect"}
          </h1>
          <p className="text-slate-500 mt-2">
            {isLogin ? "Log in to your account." : "Create your free account today."}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {resetSent ? (
            <div className="text-center py-2">
              <div className="text-6xl mb-4 sparkle">📬</div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-1">Email's on its way!</h2>
              <p className="text-slate-400 text-sm mb-4">We just sent a reset link to</p>
              <p className="font-bold text-primary mb-5">{email}</p>

              <div className="bg-amber-50 rounded-2xl px-4 py-3 text-xs text-amber-600 mb-6 text-left flex gap-2 items-start">
                <span className="text-base flex-shrink-0">📁</span>
                <span>Not seeing it? Check your <strong>Spam</strong> or <strong>Junk</strong> folder — it sometimes ends up there.</span>
              </div>

              <button
                onClick={() => { setResetSent(false); setError(null); }}
                className="w-full py-3.5 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:border-primary hover:text-primary transition-all"
              >
                ← Back to Log In
              </button>
            </div>
          ) : (
          <>
          {/* Social login */}
          <div className="space-y-3 mb-6">
            <button
              onClick={async () => {
                setError(null);
                const { error: oauthError } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: window.location.origin },
                });
                // On success this redirects the browser to Google — nothing
                // after this line runs. We only reach here if the redirect
                // itself failed to even start (e.g. Google isn't enabled
                // yet in Supabase's Auth settings).
                if (oauthError) setError(oauthError.message);
              }}
              className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-like-light border border-like/30 rounded-xl px-4 py-3 text-sm text-like font-medium">
                {error}
              </div>
            )}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-[#1A1033] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-[#1A1033] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#1A1033]">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) { setError("Enter your email above first, then click 'Forgot password?'"); return; }
                      setError(null);
                      setForgotLoading(true);
                      try {
                        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}`,
                        });
                        if (resetError) throw resetError;
                        setError(null);
                        setResetSent(true);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to send reset email. Check your SMTP settings.");
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                    disabled={forgotLoading}
                    className="text-xs text-primary hover:underline font-medium disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending…" : "Forgot password?"}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-primary transition-colors"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium hover:text-primary">
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-[#1A1033] mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            )}
            {isLogin && (
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" className="accent-primary w-4 h-4 rounded" />
                Remember me
              </label>
            )}
            {!isLogin && (
              <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" className="accent-primary w-4 h-4 rounded mt-0.5" required />
                <span>
                  I agree to the{" "}
                  <button type="button" onClick={() => onNavigate("terms")} className="text-primary font-semibold hover:underline">Terms</button>
                  {" "}and{" "}
                  <button type="button" onClick={() => onNavigate("privacy")} className="text-primary font-semibold hover:underline">Privacy Policy</button>.
                </span>
              </label>
            )}
            <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors mt-2 disabled:opacity-60">
              {loading ? "Please wait…" : isLogin ? "Log In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => onNavigate(isLogin ? "signup" : "login")} className="text-primary font-bold hover:underline">
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
          </>
          )}
        </div>

        <div className="text-center mt-6">
          <button onClick={() => onNavigate("landing")} className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
