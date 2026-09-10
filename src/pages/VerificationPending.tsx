import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import { supabase, getMyVerificationStatus, type MyVerificationStatus } from "../lib/supabase";

type Props = { onNavigate: (v: string) => void };

/**
 * Shown after signup+onboarding while the ID/selfie submission is in the
 * admin review queue. Per Phase 1 backend design: users CANNOT reach
 * Discover/Likes/Matches/Messages/Feed until verification_status = 'approved'.
 *
 * Now reads the REAL status from the database instead of being hardcoded.
 */
export default function VerificationPending({ onNavigate }: Props) {
  const [status, setStatus] = useState<MyVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const s = await getMyVerificationStatus();
      setStatus(s);
      if (s.verification_status === "approved") {
        onNavigate("discover"); // no need to sit on this screen once approved
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your verification status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0EBFF] via-white to-[#FFE8F0] flex items-center justify-center p-4 font-display">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Logo />
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center slide-up">
          {loading ? (
            <p className="text-slate-400 py-8">Loading…</p>
          ) : error ? (
            <p className="text-like font-medium py-8">{error}</p>
          ) : status?.verification_status === "rejected" ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-like-light flex items-center justify-center text-4xl">
                ⚠️
              </div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">Verification didn't pass</h2>
              <p className="text-slate-500 text-sm mb-6">
                {status.rejection_notes || "Your submission wasn't approved. Please resubmit with a clearer photo of your ID and selfie."}
              </p>
              <button
                onClick={() => onNavigate("onboarding")}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors"
              >
                Resubmit ID & Selfie
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-light flex items-center justify-center text-4xl">
                🕒
              </div>
              <h2 className="text-2xl font-extrabold text-[#1A1033] mb-2">Verification pending</h2>
              <p className="text-slate-500 text-sm mb-6">
                We're reviewing your student ID and selfie. This usually takes a few hours.
                You'll get an email once you're verified — then you can start discovering.
              </p>
              <div className="bg-[#F8F7FF] rounded-2xl p-4 text-left text-xs text-slate-500 space-y-1.5 mb-4">
                <p>✓ Account created</p>
                <p>✓ ID and selfie submitted</p>
                <p className="text-primary font-semibold">⏳ Awaiting review</p>
                <p className="text-slate-300">Full access unlocked</p>
              </div>
              <button onClick={load} className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:border-primary hover:text-primary transition-colors">
                Refresh Status
              </button>
            </>
          )}

          <button
            onClick={async () => { await supabase.auth.signOut(); onNavigate("landing"); }}
            className="w-full py-3 mt-3 text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
