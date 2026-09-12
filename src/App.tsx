import { useState, useEffect } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import VerificationPending from "./pages/VerificationPending";
import ResetPassword from "./pages/ResetPassword";
import LegalPage from "./pages/LegalPage";
import InfoPage from "./pages/InfoPage";
import Dashboard from "./pages/Dashboard";
import { supabase, getMyVerificationStatus } from "./lib/supabase";

type View = "landing" | "login" | "signup" | "onboarding" | "verification-pending" | "reset-password" | "terms" | "privacy" | "about" | "safety" | "contact" | "discover" | "likes" | "matches" | "messages" | "feed" | "notifications" | "profile" | "premium" | "admin";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [checkingSession, setCheckingSession] = useState(true);
  // Check URL hash immediately on load — if it contains type=recovery,
  // we know this is a password reset redirect BEFORE any auth events fire.
  // This prevents INITIAL_SESSION (which fires first) from routing to
  // Discover and wiping out the reset page before PASSWORD_RECOVERY fires.
  const [isRecoveryMode, setIsRecoveryMode] = useState(
    () => window.location.hash.includes("type=recovery") ||
          window.location.search.includes("type=recovery")
  );

  useEffect(() => {
    // If we detected recovery in the URL, go straight to reset page
    // without waiting for the auth event sequence
    if (isRecoveryMode) {
      setView("reset-password");
      setCheckingSession(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AUTH EVENT:", event, "recovery mode:", isRecoveryMode, "session:", !!session);
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setView("reset-password");
        setCheckingSession(false);
        return;
      }

      // Ignore SIGNED_IN during recovery — it fires right after
      // PASSWORD_RECOVERY as Supabase establishes the reset session,
      // not a real login we should route away from.
      if (isRecoveryMode && event === "SIGNED_IN") {
        return;
      }

      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session) {
        // Skip routing if we're in recovery mode — reset page stays
        if (isRecoveryMode) {
          if (event === "INITIAL_SESSION") setCheckingSession(false);
          return;
        }

        const { data: statusRow, error: statusError } = await supabase
          .from("users")
          .select("is_banned, is_suspended_until, deletion_requested_at")
          .eq("auth_id", session.user.id)
          .maybeSingle();

        if (statusError) {
          console.error("Failed to fetch account status:", statusError);
        }

        const suspendedNow = statusRow?.is_suspended_until && new Date(statusRow.is_suspended_until) > new Date();
        if (statusRow?.deletion_requested_at || statusRow?.is_banned || suspendedNow) {
          await supabase.auth.signOut();
          setView("landing");
        } else {
          try {
            const status = await getMyVerificationStatus();
            setView(status.verification_status === "approved" ? "discover" : "verification-pending");
          } catch {
            setView("onboarding");
          }
        }
      }
      if (event === "INITIAL_SESSION") setCheckingSession(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [isRecoveryMode]);

  const dashboardViews: View[] = ["discover", "likes", "matches", "messages", "feed", "notifications", "profile", "premium", "admin"];

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-display">
        Loading…
      </div>
    );
  }

  if (dashboardViews.includes(view)) {
    return <Dashboard initialView={view as any} onNavigate={(v) => setView(v as View)} />;
  }

  return (
    <>
      {view === "landing" && <Landing onNavigate={(v) => setView(v as View)} />}
      {view === "login" && <Auth mode="login" onNavigate={(v) => setView(v as View)} />}
      {view === "signup" && <Auth mode="signup" onNavigate={(v) => setView(v as View)} />}
      {view === "onboarding" && <Onboarding onNavigate={(v) => setView(v as View)} />}
      {view === "verification-pending" && <VerificationPending onNavigate={(v) => setView(v as View)} />}
      {view === "reset-password" && <ResetPassword onNavigate={(v) => { setIsRecoveryMode(false); setView(v as View); }} />}
      {view === "terms" && <LegalPage page="terms" onNavigate={(v) => setView(v as View)} />}
      {view === "privacy" && <LegalPage page="privacy" onNavigate={(v) => setView(v as View)} />}
      {view === "about" && <InfoPage page="about" onNavigate={(v) => setView(v as View)} />}
      {view === "safety" && <InfoPage page="safety" onNavigate={(v) => setView(v as View)} />}
      {view === "contact" && <InfoPage page="contact" onNavigate={(v) => setView(v as View)} />}
    </>
  );
}
