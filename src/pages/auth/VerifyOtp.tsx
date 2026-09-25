import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Compass, Loader2, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { useAuthStore } from "../../stores";

const RESEND_COUNTDOWN = 60;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { loadSession } = useAuthStore();

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Redirect if no email in URL
  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  const focusNext = (index: number) => {
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleDigitChange = (index: number, value: string) => {
    // Allow only digits; handle paste of full code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length === 6) {
        const next = pasted.split("");
        setDigits(next);
        inputRefs.current[5]?.focus();
        return;
      }
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpCode = digits.join("");

  const handleVerify = useCallback(async () => {
    if (otpCode.length < 6) return setError("Please enter the full 6-digit code.");
    setError("");
    setIsVerifying(true);

    try {
      if (!isSupabaseConfigured) {
        // Demo mode: accept any 6-digit code
        await new Promise((r) => setTimeout(r, 1000));
        navigate("/onboarding", { replace: true });
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "signup",
      });

      if (verifyError) throw new Error(verifyError.message);

      // Get session to create profile row
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("profiles").upsert(
          {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name ?? "",
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
        await loadSession();
      }

      navigate("/onboarding", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid code.";
      setError(
        msg.toLowerCase().includes("expired")
          ? "This code has expired. Please request a new one."
          : msg.toLowerCase().includes("invalid")
          ? "Incorrect code. Please double-check and try again."
          : msg
      );
    } finally {
      setIsVerifying(false);
    }
  }, [otpCode, email, navigate, loadSession]);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otpCode.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [otpCode, handleVerify, isVerifying]);

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError("");
    setResendSuccess(false);
    setIsResending(true);

    try {
      if (!isSupabaseConfigured) {
        await new Promise((r) => setTimeout(r, 800));
        setResendSuccess(true);
        setCountdown(RESEND_COUNTDOWN);
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) throw new Error(resendError.message);

      setResendSuccess(true);
      setCountdown(RESEND_COUNTDOWN);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="h-11 w-11 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:bg-sky-700 transition">
              <Compass className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold text-slate-900">
              TC<span className="text-sky-600">U</span>nnect
            </span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">Travel. Connect. Unwind.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📩</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Verify your email</h1>
            <p className="text-slate-500 text-sm">
              We sent a 6-digit code to
            </p>
            <p className="font-semibold text-sky-700 text-sm mt-0.5 break-all">{email}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Resend success */}
          {resendSuccess && (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm text-center">
              ✅ New code sent! Check your inbox.
            </div>
          )}

          {/* OTP input boxes */}
          <div className="flex justify-center gap-3 mb-6">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition
                  ${digit ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-900"}
                  focus:border-sky-500 focus:ring-2 focus:ring-sky-200`}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || otpCode.length < 6}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
              </>
            ) : (
              "Verify & Continue"
            )}
          </button>

          {/* Resend */}
          <div className="mt-5 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-slate-400">
                Resend code in{" "}
                <span className="font-semibold text-slate-600 tabular-nums">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium transition disabled:opacity-60"
              >
                {isResending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Resend code
              </button>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Wrong email?{" "}
            <Link to="/signup" className="text-sky-600 hover:text-sky-700 font-medium">
              Go back
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
