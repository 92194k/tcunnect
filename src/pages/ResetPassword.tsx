import { useState } from "react";
import { supabase } from "../lib/supabase";

type Props = { onNavigate: (v: string) => void };

export default function ResetPassword({ onNavigate }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must contain at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
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

  return (
    <div style={{
      margin: 0,
      minHeight: "100vh",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
      background: "radial-gradient(circle at 20% 15%, rgba(124,58,237,0.07), transparent 32%), radial-gradient(circle at 85% 85%, rgba(236,72,153,0.06), transparent 30%), #fafafa",
      color: "#171329",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 430 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 30, fontSize: 22, fontWeight: 800, letterSpacing: "-0.6px" }}>
          <div style={{ width: 27, height: 20, position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, width: 14, height: 14, borderRadius: "50%", background: "#7c3aed" }} />
            <div style={{ position: "absolute", right: 0, width: 14, height: 14, borderRadius: "50%", background: "#7c3aed", opacity: 0.82 }} />
          </div>
          <div style={{ color: "#25203b" }}>TCU<span style={{ color: "#7c3aed" }}>nnect</span></div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", border: "1px solid #ebe9f1", borderRadius: 18, padding: "38px 36px 32px", boxShadow: "0 18px 45px rgba(35,25,70,0.07), 0 2px 8px rgba(35,25,70,0.03)" }}>

          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 52, height: 52, margin: "0 auto 22px", borderRadius: 14, background: "#f3efff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎉</div>
              <h1 style={{ margin: "0 0 12px", fontSize: 25, fontWeight: 750, letterSpacing: "-0.6px", color: "#1e1933" }}>Password updated!</h1>
              <p style={{ margin: "0 0 28px", fontSize: 14, color: "#8a849c", lineHeight: 1.55 }}>Your new password is active. You can now log in.</p>
              <button
                onClick={() => onNavigate("login")}
                style={{ width: "100%", height: 50, border: 0, borderRadius: 10, background: "#6d28d9", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Go to Log In →
              </button>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div style={{ width: 52, height: 52, margin: "0 auto 22px", borderRadius: 14, background: "#f3efff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "relative", marginTop: 7 }}>
                  <div style={{ width: 19, height: 15, border: "2px solid #6d28d9", borderRadius: 4, position: "relative" }}>
                    <div style={{ position: "absolute", width: 10, height: 10, border: "2px solid #6d28d9", borderBottom: 0, borderRadius: "8px 8px 0 0", left: "50%", top: -10, transform: "translateX(-50%)" }} />
                    <div style={{ position: "absolute", width: 3, height: 6, background: "#6d28d9", borderRadius: 3, left: "50%", top: 4, transform: "translateX(-50%)" }} />
                  </div>
                </div>
              </div>

              {/* Heading */}
              <div style={{ textAlign: "center", marginBottom: 30 }}>
                <h1 style={{ margin: "0 0 9px", fontSize: 25, lineHeight: 1.25, letterSpacing: "-0.6px", fontWeight: 750, color: "#1e1933" }}>Set a new password</h1>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#8a849c" }}>Create a new password to secure your account.</p>
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#dc2626" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* New Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 650, color: "#342f47" }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      style={{ width: "100%", height: 50, padding: "0 48px 0 15px", border: "1px solid #ddd9e8", borderRadius: 10, background: "#fff", fontFamily: "inherit", fontSize: 14, color: "#272238", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#8b5cf6"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.09)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#ddd9e8"; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", padding: 4, color: "#9690a4", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#8b8796" }}>Minimum 8 characters</div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 650, color: "#342f47" }}>
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      style={{ width: "100%", height: 50, padding: "0 48px 0 15px", border: `1px solid ${confirmPassword.length > 0 && confirmPassword !== password ? "#f87171" : "#ddd9e8"}`, borderRadius: 10, background: "#fff", fontFamily: "inherit", fontSize: 14, color: "#272238", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = "#8b5cf6"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.09)"; }}
                      onBlur={(e) => { e.target.style.borderColor = confirmPassword !== password && confirmPassword.length > 0 ? "#f87171" : "#ddd9e8"; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", padding: 4, color: "#9690a4", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", height: 50, marginTop: 7, border: 0, borderRadius: 10, background: loading ? "#a78bfa" : "#6d28d9", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? "Updating…" : "Update Password"}
                </button>

              </form>

              {/* Back */}
              <button onClick={() => onNavigate("login")}
                style={{ display: "block", textAlign: "center", marginTop: 22, color: "#77718a", border: 0, background: "transparent", fontFamily: "inherit", fontSize: 13, fontWeight: 550, cursor: "pointer", width: "100%" }}>
                ← Back to Login
              </button>

              {/* Security note */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 26, paddingTop: 20, borderTop: "1px solid #eeeaf3", fontSize: 11.5, lineHeight: 1.55, color: "#9691a0" }}>
                <div style={{ width: 7, height: 7, minWidth: 7, marginTop: 5, borderRadius: "50%", background: "#8b5cf6" }} />
                <div>Your password is securely updated and can be used immediately after the reset is completed.</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
