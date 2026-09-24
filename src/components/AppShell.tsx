import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useNotificationStore } from "../stores";
import {
  Compass, Home, Users, Star, Map, MessageCircle,
  Bell, LogOut, Crown, Menu, X, Shield, BookOpen, ChevronDown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ScrollArrow from "./ScrollArrow";

const NAV = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/discover-people", label: "People", Icon: Users },
  { to: "/featured", label: "Featured", Icon: Star },
  { to: "/hidden-gems", label: "Gems", Icon: Map },
  { to: "/community", label: "Community", Icon: MessageCircle },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (to: string) => location.pathname === to;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Desktop Nav ── */}
      <header className="hidden lg:block fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <nav className="mx-auto max-w-7xl flex items-center h-16 px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 mr-8 shrink-0">
            <span className="h-8 w-8 bg-sky-600 rounded-lg flex items-center justify-center text-white">
              <Compass className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900">TC<span className="text-sky-600">U</span>nnect</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-1 flex-1">
            {NAV.map(({ to, label }) => (
              <Link
                key={to} to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(to)
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link to="/notifications" className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Chat */}
            <Link to="/chat" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition">
              <MessageCircle className="h-5 w-5" />
            </Link>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative ml-1 pl-3 border-l border-slate-200">
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-xl px-2 py-1.5 transition"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                  {user?.profilePhoto
                    ? <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                    : user?.fullName?.[0]}
                </div>
                <span className="text-sm font-medium text-slate-700">{user?.fullName?.split(" ")[0]}</span>
                {user?.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                {user?.isAdmin && <Shield className="h-3.5 w-3.5 text-violet-500" />}
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  {/* User info */}
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.location || "No location set"}</p>
                    {user?.isPremium && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Crown className="h-3 w-3" /> TCUnnect Plus
                      </span>
                    )}
                    {user?.isAdmin && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        <Shield className="h-3 w-3" /> Administrator
                      </span>
                    )}
                  </div>

                  <Link to="/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                    <div className="h-4 w-4 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-[10px] font-bold">
                      {user?.fullName?.[0]}
                    </div>
                    My Profile
                  </Link>

                  <Link to="/my-bookings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    My Bookings
                  </Link>

                  {!user?.isPremium && (
                    <Link to="/premium" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition font-medium">
                      <Crown className="h-4 w-4" />
                      Upgrade to Plus
                    </Link>
                  )}

                  {user?.isPremium && (
                    <Link to="/premium" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                      <Crown className="h-4 w-4 text-amber-500" />
                      Manage Plan
                    </Link>
                  )}

                  {user?.isAdmin && (
                    <>
                      <div className="h-px bg-slate-100 my-1" />
                      <Link to="/admin" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 transition font-medium">
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </>
                  )}

                  <div className="h-px bg-slate-100 my-1" />
                  <button onClick={() => { setProfileOpen(false); handleLogout(); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition">
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-1.5">
            <span className="h-7 w-7 bg-sky-600 rounded-lg flex items-center justify-center text-white">
              <Compass className="h-3.5 w-3.5" />
            </span>
            <span className="font-bold text-slate-900 text-sm">TC<span className="text-sky-600">U</span>nnect</span>
          </Link>
          <div className="flex-1" />
          <Link to="/notifications" className="relative p-2 text-slate-500">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-500">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.fullName?.[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.location}</p>
              </div>
              {user?.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500 ml-auto" />}
            </Link>
            <div className="h-px bg-slate-100 my-2" />
            <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-sm">
              <BookOpen className="h-4 w-4 text-slate-400" /> My Bookings
            </Link>
            {!user?.isPremium ? (
              <Link to="/premium" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-600 hover:bg-amber-50 text-sm font-medium">
                <Crown className="h-4 w-4" /> Upgrade to Plus
              </Link>
            ) : (
              <Link to="/premium" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-sm">
                <Crown className="h-4 w-4 text-amber-500" /> Manage Plan
              </Link>
            )}
            {user?.isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-violet-600 hover:bg-violet-50 text-sm font-medium">
                <Shield className="h-4 w-4" /> Admin Panel
              </Link>
            )}
            <div className="h-px bg-slate-100 my-2" />
            <button onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm">
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <div className="pt-16 lg:pt-16 pb-20 lg:pb-8">
        {children}
      </div>

      <ScrollArrow />

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { to: "/dashboard", Icon: Home, label: "Home" },
            { to: "/discover-people", Icon: Users, label: "People" },
            { to: "/featured", Icon: Star, label: "Featured" },
            { to: "/hidden-gems", Icon: Map, label: "Gems" },
            { to: "/chat", Icon: MessageCircle, label: "Chat" },
          ].map(({ to, Icon, label }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
                isActive(to) ? "text-sky-600" : "text-slate-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive(to) ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              <span className={`text-[10px] font-medium ${isActive(to) ? "text-sky-600" : ""}`}>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
