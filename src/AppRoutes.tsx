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
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";

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
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-sky-50"><div className="h-8 w-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" /></div>;
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
        if (event === "SIGNED_IN" && session?.user) {
          // Re-load the full profile into the store
          await loadSession();

          // Only auto-navigate if we're still on a "public-only" page
          const currentPath = window.location.pathname;
          const publicPaths = ["/", "/login", "/signup", "/auth/callback"];
          if (publicPaths.includes(currentPath)) {
            // Check if Google-only user (no password set)
            const identities = session.user.identities ?? [];
            const hasEmailIdentity = identities.some((id: { provider: string }) => id.provider === "email");
            const hasGoogleIdentity = identities.some((id: { provider: string }) => id.provider === "google");
            if (hasGoogleIdentity && !hasEmailIdentity) {
              navigate("/set-password", { replace: true });
              return;
            }
            const { data: profile } = await supabase
              .from("profiles")
              .select("travel_interests")
              .eq("id", session.user.id)
              .single();
            const hasInterests = ((profile?.travel_interests as string[] | null)?.length ?? 0) > 0;
            navigate(hasInterests ? "/dashboard" : "/onboarding", { replace: true });
          }
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
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
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
