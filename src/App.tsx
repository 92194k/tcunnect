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

  useEffect(() => {
    // Both "is there an existing session to restore" and "did they arrive
    // via a password-recovery link" are handled through the SAME ordered
    // event stream here, on purpose — running them as two independent
    // effects (one calling getSession(), one listening separately for
    // PASSWORD_RECOVERY) created a race: if the session-restore check
    // resolved after the recovery redirect fired, it could silently
    // overwrite the view back to Discover and break password reset.
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset-password");
        setCheckingSession(false);
        return;
      }

      // INITIAL_SESSION covers a normal page load/refresh with an existing
      // session. SIGNED_IN additionally covers completing Google OAuth —
      // that flow redirects the whole browser away and back, and while the
      // return trip is usually a fresh page load (making INITIAL_SESSION
      // fire correctly on its own), routing through SIGNED_IN too is a
      // defensive belt-and-suspenders in case any browser/flow completes
      // the OAuth redirect via history navigation instead of a hard reload.
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session) {
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
            // No users row yet — either a brand-new email signup that
            // hasn't finished Onboarding, OR a first-time Google sign-in
            // (new account, per the "same button handles sign-in and
            // sign-up" flow) — both correctly land here to complete their
            // profile before the app unlocks.
            setView("onboarding");
          }
        }
      }
      if (event === "INITIAL_SESSION") setCheckingSession(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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
      {view === "reset-password" && <ResetPassword onNavigate={(v) => setView(v as View)} />}
      {view === "terms" && <LegalPage page="terms" onNavigate={(v) => setView(v as View)} />}
      {view === "privacy" && <LegalPage page="privacy" onNavigate={(v) => setView(v as View)} />}
      {view === "about" && <InfoPage page="about" onNavigate={(v) => setView(v as View)} />}
      {view === "safety" && <InfoPage page="safety" onNavigate={(v) => setView(v as View)} />}
      {view === "contact" && <InfoPage page="contact" onNavigate={(v) => setView(v as View)} />}
    </>
  );
}
