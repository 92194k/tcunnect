import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./stores";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

// Public pages
import LandingPage from "./LandingPage";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Onboarding from "./pages/auth/Onboarding";
import AuthCallback from "./pages/auth/AuthCallback";
import SetPassword from "./pages/auth/SetPassword";

// App pages
import Dashboard from "./pages/Dashboard";
import DiscoverPeople from "./pages/DiscoverPeople";
import HiddenGems from "./pages/HiddenGems";
import GemDetail from "./pages/GemDetail";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Chat from "./pages/Chat";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Premium from "./pages/Premium";
import Featured from "./pages/Featured";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Legal pages
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Safety from "./pages/legal/Safety";
import HelpCenter from "./pages/legal/HelpCenter";

// ─── Root: redirects logged-in users away from landing ─────────
function RootPage() {
  const { isLoggedIn, onboardingComplete, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="h-8 w-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (isLoggedIn && onboardingComplete) return <Navigate to="/dashboard" replace />;
  if (isLoggedIn && !onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <LandingPage />;
}

// ─── Guard components ──────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, onboardingComplete, isLoading } = useAuthStore();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-sky-50"><div className="h-8 w-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RedirectIfLoggedIn({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, onboardingComplete, isLoading } = useAuthStore();
  // NOTE: while isLoading (initial session check), show children, NOT a spinner.
  // Showing a spinner here unmounts the form component (Login/SignUp) mid-submission,
  // which silently drops in-flight state updates (e.g. setEmailSent(true)).
  // Public auth pages are safe to render while session loads — they redirect after.
  if (isLoading) return <>{children}</>;
  if (isLoggedIn && onboardingComplete) return <Navigate to="/dashboard" replace />;
  if (isLoggedIn && !onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

// ─── Routes ───────────────────────────────────────────────────
export default function AppRoutes() {
  const { loadSession } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial session load
    loadSession();

    if (!isSupabaseConfigured) return;

    // Global auth listener — handles OAuth redirects landing on ANY page
    // (e.g. when Supabase redirects back to "/" instead of "/auth/callback"
    // because the callback URL wasn't added to the Supabase allowed list)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only act on a real, confirmed sign-in (has access_token).
        // Supabase also fires SIGNED_IN when an email OTP is issued (email confirmation pending),
        // but in that case session.access_token is null — we must NOT call loadSession() there,
        // because loadSession() sets isLoading:true which unmounts the SignUp form component.
        if (event === "SIGNED_IN" && session?.user && session?.access_token) {
          console.log("[onAuthStateChange] SIGNED_IN with access_token — loading session");
          // Re-load the full profile into the store
          await loadSession();

          // Only auto-navigate if we're still on a "public-only" page
          const path = window.location.pathname;
          const publicPaths = ["/", "/login", "/signup", "/auth/callback"];
          if (publicPaths.includes(path)) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("travel_interests")
              .eq("id", session.user.id)
              .single();
            const hasInterests = ((profile?.travel_interests as string[] | null)?.length ?? 0) > 0;
            console.log("[onAuthStateChange] navigating to", hasInterests ? "/dashboard" : "/onboarding");
            navigate(hasInterests ? "/dashboard" : "/onboarding", { replace: true });
          }
        } else if (event === "SIGNED_IN" && session?.user && !session?.access_token) {
          console.log("[onAuthStateChange] SIGNED_IN but no access_token — email confirmation pending, ignoring");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      {/* Public — RootPage redirects logged-in users to dashboard/onboarding */}
      <Route path="/" element={<RootPage />} />
      <Route
        path="/login"
        element={
          <RedirectIfLoggedIn>
            <Login />
          </RedirectIfLoggedIn>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfLoggedIn>
            <SignUp />
          </RedirectIfLoggedIn>
        }
      />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/password-setup" element={<SetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/safety" element={<Safety />} />
      <Route path="/help" element={<HelpCenter />} />

      {/* Protected App */}
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/discover-people" element={<RequireAuth><DiscoverPeople /></RequireAuth>} />
      <Route path="/featured" element={<RequireAuth><Featured /></RequireAuth>} />
      <Route path="/hidden-gems" element={<RequireAuth><HiddenGems /></RequireAuth>} />
      <Route path="/gems/:gemId" element={<RequireAuth><GemDetail /></RequireAuth>} />
      <Route path="/booking/:gemId" element={<RequireAuth><Booking /></RequireAuth>} />
      <Route path="/my-bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
      <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
      <Route path="/chat/:matchId" element={<RequireAuth><Chat /></RequireAuth>} />
      <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/profile/:userId" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="/premium" element={<RequireAuth><Premium /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminDashboard /></RequireAdmin></RequireAuth>} />
      <Route path="/admin/*" element={<RequireAuth><RequireAdmin><AdminDashboard /></RequireAdmin></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
