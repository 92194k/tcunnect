import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores";

// Public pages
import LandingPage from "./LandingPage";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import Onboarding from "./pages/auth/Onboarding";

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

// ─── Guard components ──────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, onboardingComplete } = useAuthStore();
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
  const { isLoggedIn, onboardingComplete } = useAuthStore();
  if (isLoggedIn && onboardingComplete) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── Routes ───────────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
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
