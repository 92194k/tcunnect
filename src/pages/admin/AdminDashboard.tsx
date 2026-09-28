import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useNotificationStore } from "../../stores";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import {
  LayoutDashboard, Users, Briefcase, CreditCard, Star, MapPin, Gem,
  BookOpen, BarChart2, Settings, Bell, LogOut, ChevronRight, Check,
  X, Eye, Shield, Clock, TrendingUp, AlertCircle, CheckCircle2,
  XCircle, FileText, RefreshCw, Search, Filter, Download,
  MessageSquare, Compass, Home, Image, Save, Loader2, Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────
type TabId =
  | "dashboard" | "users" | "businesses" | "payments"
  | "subscriptions" | "bookings" | "gems" | "featured"
  | "reviews" | "reports" | "settings";

type PaymentStatus = "pending" | "approved" | "rejected";

interface DBPayment {
  id: string;
  user_id: string;
  plan_id: string;
  plan_label: string;
  amount: number;
  method: string;
  receipt_url: string | null;
  reference_id: string | null;
  ocr_data: {
    rawText: string;
    confidence: number;
    extracted: {
      referenceId: string | null;
      amount: number | null;
      date: string | null;
      method: string | null;
    };
  } | null;
  status: PaymentStatus;
  created_at: string;
  profiles?: { full_name: string | null };
}

interface DBProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_premium: boolean;
  is_admin: boolean;
  account_status: string | null;
  created_at: string;
  location: string | null;
  bio: string | null;
  age: number | null;
  university: string | null;
  avatar_url: string | null;
}

interface DBGem {
  id: string;
  name: string;
  location: string | null;
  category: string | null;
  status: string;
  created_at: string;
  submitted_by: string | null;
  is_featured: boolean;
  profiles?: { full_name: string | null };
}

interface DBReport {
  id: string;
  reported_by: string | null;
  reported_user_id: string | null;
  reported_item_type: string;
  reported_item_id: string | null;
  reported_post_id: string | null;
  match_id: string | null;
  message_content: string | null;
  reason: string | null;
  details: string | null;
  status: string | null;
  created_at: string;
  // joined
  reporter?: { full_name: string | null; email: string | null };
  reported_user?: { full_name: string | null; email: string | null; is_admin: boolean; account_status: string };
  post?: { content: string | null; created_at: string | null } | null;
}

interface PlatformSettings {
  allow_user_registrations: boolean;
  enable_community_posts: boolean;
  gcash_number: string;
  maya_number: string;
  account_name: string;
  gcash_qr_url: string;
  maya_qr_url: string;
}

interface DashStats {
  users: number;
  bookings: number;
  revenue: number;
  pendingPayments: number;
  pendingGems: number;
  approvedGems: number;
  premiumUsers: number;
  reports: number;
}

// ─── Helpers ──────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    "bg-emerald-500",
    pending:   "bg-amber-400",
    suspended: "bg-red-500",
    approved:  "bg-emerald-500",
    rejected:  "bg-red-500",
    published: "bg-emerald-500",
    confirmed: "bg-emerald-500",
    cancelled: "bg-red-500",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status] ?? "bg-slate-300"}`} />;
}

function Pill({ text, color }: { text: string; color: string }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{text}</span>;
}

function StatCard({ icon: Icon, label, value, sub, color = "sky" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    sky:     "bg-sky-50 text-sky-600",
    amber:   "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet:  "bg-violet-50 text-violet-600",
    rose:    "bg-rose-50 text-rose-600",
    slate:   "bg-slate-100 text-slate-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function NotImplemented({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <AlertCircle className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{feature} not implemented</h3>
      <p className="text-sm text-slate-400 max-w-xs">
        This feature doesn't exist in TCUnnect yet. No data is available.
      </p>
    </div>
  );
}

// ─── Tab Panels ──────────────────────────────────────────────────

function DashboardTab({ stats, loading }: { stats: DashStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Users"       value={stats.users.toLocaleString()}   color="sky" />
        <StatCard icon={CreditCard} label="Revenue (total)"   value={`₱${stats.revenue.toLocaleString()}`} sub="Approved payments" color="emerald" />
        <StatCard icon={BookOpen}   label="Total Bookings"    value={stats.bookings.toLocaleString()} color="amber" />
        <StatCard icon={Star}       label="Premium Users"     value={stats.premiumUsers.toLocaleString()} color="violet" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Pending Actions</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="text-slate-700 flex-1">
                <strong>{stats.pendingPayments}</strong> payment receipt{stats.pendingPayments !== 1 ? "s" : ""} awaiting verification
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Gem className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span className="text-slate-700 flex-1">
                <strong>{stats.pendingGems}</strong> hidden gem submission{stats.pendingGems !== 1 ? "s" : ""} pending review
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
              <span className="text-slate-700 flex-1">
                <strong>{stats.reports}</strong> report{stats.reports !== 1 ? "s" : ""} filed
              </span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Platform Stats</h3>
          <ul className="space-y-3">
            {[
              { label: "Total registered users",    value: stats.users.toLocaleString() },
              { label: "Premium (Plus) subscribers",value: stats.premiumUsers.toLocaleString() },
              { label: "Hidden gems approved",      value: stats.approvedGems.toLocaleString() },
              { label: "Gems pending review",       value: stats.pendingGems.toLocaleString() },
              { label: "Total bookings",            value: stats.bookings.toLocaleString() },
              { label: "Payments awaiting verify",  value: stats.pendingPayments.toLocaleString() },
            ].map((s, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{s.label}</span>
                <span className="font-semibold text-slate-800">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type ModerationAction = "suspend" | "ban" | "reactivate";
type ConfirmModal =
  | { kind: "delete";     userId: string; name: string }
  | { kind: "suspend";    userId: string; name: string }
  | { kind: "ban";        userId: string; name: string }
  | { kind: "reactivate"; userId: string; name: string }
  | null;

function UsersTab() {
  const [search, setSearch]         = useState("");
  const [users, setUsers]           = useState<DBProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionError, setActionError] = useState("");
  const [confirm, setConfirm]       = useState<ConfirmModal>(null);
  const [acting, setActing]         = useState<string | null>(null); // userId being acted on
  const [viewUser, setViewUser]     = useState<DBProfile | null>(null);
  const { user: adminUser }         = useAuthStore();

  const fetchUsers = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    // Step 1: base query — columns that have always existed since day 1
    const { data: baseData, error: baseError } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_premium, created_at, location")
      .order("created_at", { ascending: false })
      .limit(200);

    if (baseError) {
      console.error("[UsersTab] base query failed:", baseError);
      setLoading(false);
      return;
    }
    if (!baseData) { setLoading(false); return; }

    let rows: DBProfile[] = baseData as unknown as DBProfile[];

    // Step 2: try to enrich with columns added by migration 21 — fail silently
    const { data: extraData } = await supabase
      .from("profiles")
      .select("id, is_admin, account_status, bio, age, university, avatar_url")
      .order("created_at", { ascending: false })
      .limit(200);

    if (extraData) {
      const extraMap = new Map((extraData as any[]).map((r: any) => [r.id, r]));
      rows = rows.map(r => ({ ...r, ...(extraMap.get(r.id) ?? {}) }));
    }

    setUsers(rows);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Moderation: Suspend / Ban / Reactivate ──────────────────────────────
  const moderateUser = async (userId: string, action: ModerationAction) => {
    setConfirm(null);
    setActionError("");
    setActing(userId);
    const expectedStatus = action === "suspend" ? "suspended" : action === "ban" ? "banned" : "active";

    // Step 1: attempt the UPDATE
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ account_status: expectedStatus })
      .eq("id", userId);

    if (updateError) {
      setActionError(`Failed to ${action} user: ${updateError.message}`);
      setActing(null);
      return;
    }

    // Step 2: re-fetch from DB to verify the change actually persisted.
    // Supabase RLS silently blocks UPDATEs (0 rows affected, no error returned) —
    // so we NEVER trust the absence of an error; we always confirm with a SELECT.
    const { data: freshUser, error: fetchError } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_premium, is_admin, account_status, bio, age, university, avatar_url, created_at, location")
      .eq("id", userId)
      .single();

    if (fetchError || !freshUser) {
      setActionError(`Action sent but could not verify: ${fetchError?.message ?? "user not found"}`);
      setActing(null);
      return;
    }

    // Step 3: check DB value matches what we expected
    const actualStatus = (freshUser as any).account_status as string | null;
    if (actualStatus !== expectedStatus) {
      setActionError(
        `${action.charAt(0).toUpperCase() + action.slice(1)} failed silently — ` +
        `DB still shows "${actualStatus ?? "null"}". ` +
        `Run sql/25_admin_profiles_update_policy.sql in Supabase SQL Editor to fix admin RLS permissions, then try again.`
      );
      setActing(null);
      return;
    }

    // Step 4: update local state from the real DB row (not the optimistic value)
    const updatedProfile = freshUser as unknown as DBProfile;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedProfile } : u));
    if (viewUser?.id === userId) setViewUser(updatedProfile);
    setActing(null);
  };

  // ── Delete via Edge Function ────────────────────────────────────────────
  const handleDelete = async (userId: string) => {
    setConfirm(null);
    setActionError("");
    setActing(userId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ userId }),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error ?? "Delete failed");
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (viewUser?.id === userId) setViewUser(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setActing(null);
    }
  };

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === "delete")     handleDelete(confirm.userId);
    else if (confirm.kind === "suspend")    moderateUser(confirm.userId, "suspend");
    else if (confirm.kind === "ban")        moderateUser(confirm.userId, "ban");
    else if (confirm.kind === "reactivate") moderateUser(confirm.userId, "reactivate");
  };

  const canModerate = (u: DBProfile) =>
    u.id !== adminUser?.id && !u.is_admin;

  const statusBadge = (s: string | null) => {
    if (s === "suspended") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Suspended</span>;
    if (s === "banned")    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Banned</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>;
  };

  const filtered = users.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // ── User detail panel ───────────────────────────────────────────────────
  if (viewUser) {
    const u = viewUser;
    const modOk = canModerate(u);
    const isActing = acting === u.id;
    return (
      <div className="space-y-4">
        <button onClick={() => setViewUser(null)}
          className="flex items-center gap-1.5 text-sm text-sky-600 hover:underline">
          ← Back to Users
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-xl flex-shrink-0 overflow-hidden">
              {u.avatar_url
                ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                : (u.full_name ?? "?")[0].toUpperCase()
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{u.full_name ?? "Unknown"}</h2>
                {u.is_admin && <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
                {u.is_premium && <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">PLUS</span>}
                {statusBadge(u.account_status)}
              </div>
              <p className="text-sm text-slate-500">{u.email ?? "—"}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: "Location",   value: u.location },
              { label: "University", value: u.university },
              { label: "Age",        value: u.age?.toString() },
              { label: "Joined",     value: new Date(u.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{f.label}</p>
                <p className="text-slate-700">{f.value ?? "—"}</p>
              </div>
            ))}
            {u.bio && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bio</p>
                <p className="text-slate-700">{u.bio}</p>
              </div>
            )}
          </div>

          {/* Moderation actions */}
          {modOk && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Moderation</p>
              <div className="flex flex-wrap gap-2">
                {u.account_status !== "suspended" && u.account_status !== "banned" && (
                  <button disabled={isActing} onClick={() => setConfirm({ kind: "suspend", userId: u.id, name: u.full_name ?? "this user" })}
                    className="px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50 transition">
                    {isActing ? "…" : "Suspend User"}
                  </button>
                )}
                {u.account_status !== "banned" && (
                  <button disabled={isActing} onClick={() => setConfirm({ kind: "ban", userId: u.id, name: u.full_name ?? "this user" })}
                    className="px-3 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition">
                    {isActing ? "…" : "Ban User"}
                  </button>
                )}
                {(u.account_status === "suspended" || u.account_status === "banned") && (
                  <button disabled={isActing} onClick={() => setConfirm({ kind: "reactivate", userId: u.id, name: u.full_name ?? "this user" })}
                    className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition">
                    {isActing ? "…" : "Reactivate Account"}
                  </button>
                )}
                <button disabled={isActing} onClick={() => setConfirm({ kind: "delete", userId: u.id, name: u.full_name ?? "this user" })}
                  className="px-3 py-2 text-xs font-semibold bg-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-lg disabled:opacity-50 transition">
                  {isActing ? "…" : "Delete Account"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Admins cannot be suspended or banned.</p>
            </div>
          )}
          {u.is_admin && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 italic">This is an admin account — moderation actions are not available.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} users</span>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {actionError}
          <button onClick={() => setActionError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                confirm.kind === "ban" ? "bg-red-100" : confirm.kind === "suspend" ? "bg-amber-100"
                : confirm.kind === "reactivate" ? "bg-emerald-100" : "bg-red-100"
              }`}>
                {confirm.kind === "suspend" ? <Shield className="h-5 w-5 text-amber-600" />
                 : confirm.kind === "ban" ? <Shield className="h-5 w-5 text-red-600" />
                 : confirm.kind === "reactivate" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                 : <Trash2 className="h-5 w-5 text-red-600" />}
              </div>
              <div>
                <p className="font-semibold text-slate-900 capitalize">{confirm.kind} user?</p>
                <p className="text-xs text-slate-500">{confirm.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              {confirm.kind === "suspend"
                ? "This user will be temporarily restricted from using TCUnnect. Their data will be kept. You can reactivate them later."
                : confirm.kind === "ban"
                ? "This user will be permanently banned from TCUnnect. Their data will be kept but they cannot log in."
                : confirm.kind === "reactivate"
                ? "This user's account will be restored to active status."
                : "All data will be permanently removed: profile, likes, matches, messages, bookings, payments, posts, notifications, and reports."}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)}
                className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleConfirm}
                className={`flex-1 text-white rounded-lg py-2 text-sm font-semibold transition ${
                  confirm.kind === "reactivate" ? "bg-emerald-600 hover:bg-emerald-700"
                  : confirm.kind === "suspend" ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-red-600 hover:bg-red-700"
                }`}>
                {confirm.kind === "suspend" ? "Yes, Suspend"
                 : confirm.kind === "ban" ? "Yes, Ban"
                 : confirm.kind === "reactivate" ? "Yes, Reactivate"
                 : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["User", "Email", "Plan", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => {
                const isActing = acting === u.id;
                const mod = canModerate(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0 overflow-hidden">
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                            : (u.full_name ?? "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-xs">{u.full_name ?? "—"}</p>
                          {u.is_admin && <span className="text-[9px] text-sky-600 font-bold">ADMIN</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      {u.is_premium
                        ? <Pill text="Plus" color="bg-sky-100 text-sky-700" />
                        : <Pill text="Free" color="bg-slate-100 text-slate-600" />}
                    </td>
                    <td className="px-4 py-3">{statusBadge(u.account_status)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      {isActing ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => setViewUser(u)}
                            className="text-xs text-sky-600 hover:underline font-medium">View</button>
                          {mod && u.account_status !== "suspended" && u.account_status !== "banned" && (
                            <button onClick={() => setConfirm({ kind: "suspend", userId: u.id, name: u.full_name ?? "this user" })}
                              className="text-xs text-amber-600 hover:underline font-medium">Suspend</button>
                          )}
                          {mod && u.account_status !== "banned" && (
                            <button onClick={() => setConfirm({ kind: "ban", userId: u.id, name: u.full_name ?? "this user" })}
                              className="text-xs text-red-600 hover:underline font-medium">Ban</button>
                          )}
                          {mod && (u.account_status === "suspended" || u.account_status === "banned") && (
                            <button onClick={() => setConfirm({ kind: "reactivate", userId: u.id, name: u.full_name ?? "this user" })}
                              className="text-xs text-emerald-600 hover:underline font-medium">Reactivate</button>
                          )}
                          {mod && (
                            <button onClick={() => setConfirm({ kind: "delete", userId: u.id, name: u.full_name ?? "this user" })}
                              className="text-xs text-slate-400 hover:text-red-500 hover:underline font-medium">Delete</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No users found.</div>
        )}
      </div>
    </div>
  );
}

function BusinessesTab() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<{ month: string; amount: number; count: number }[]>([]);
  const [totals, setTotals]   = useState({ revenue: 0, approved: 0, pending: 0, rejected: 0, convRate: 0 });
  const [topPlans, setTopPlans] = useState<{ label: string; count: number; revenue: number }[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("payments").select("amount, status, plan_label, created_at"),
    ]).then(([paymentsRes]) => {
      const all = (paymentsRes.data ?? []) as { amount: number; status: string; plan_label: string; created_at: string }[];

      // Monthly revenue (approved only, last 6 months)
      const now   = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" }) };
      });
      const byMonth = months.map(m => {
        const rows = all.filter(p => p.status === "approved" && p.created_at.startsWith(m.key));
        return { month: m.label, amount: rows.reduce((s, r) => s + (r.amount ?? 0), 0), count: rows.length };
      });
      setRevenue(byMonth);

      // Totals
      const approved = all.filter(p => p.status === "approved");
      const pending  = all.filter(p => p.status === "pending");
      const rejected = all.filter(p => p.status === "rejected");
      const totalRev = approved.reduce((s, p) => s + (p.amount ?? 0), 0);
      const convRate = all.length > 0 ? Math.round((approved.length / all.length) * 100) : 0;
      setTotals({ revenue: totalRev, approved: approved.length, pending: pending.length, rejected: rejected.length, convRate });

      // Top plans
      const planMap: Record<string, { count: number; revenue: number }> = {};
      for (const p of approved) {
        if (!planMap[p.plan_label]) planMap[p.plan_label] = { count: 0, revenue: 0 };
        planMap[p.plan_label].count++;
        planMap[p.plan_label].revenue += p.amount ?? 0;
      }
      setTopPlans(Object.entries(planMap).map(([label, v]) => ({ label, ...v })).sort((a, b) => b.revenue - a.revenue));
      setLoading(false);
    });
  }, []);

  const maxBar = Math.max(...revenue.map(r => r.amount), 1);

  if (loading) return <div className="flex justify-center py-20"><div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Total Revenue"      value={`₱${totals.revenue.toLocaleString()}`} sub="From approved payments" color="emerald" />
        <StatCard icon={CheckCircle2} label="Approved Payments" value={totals.approved} sub={`${totals.convRate}% approval rate`} color="sky" />
        <StatCard icon={Clock}       label="Pending Payments"   value={totals.pending}  sub="Awaiting verification" color="amber" />
        <StatCard icon={XCircle}     label="Rejected Payments"  value={totals.rejected} color="rose" />
      </div>

      {/* Monthly revenue bar chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Monthly Revenue (Last 6 Months)</h3>
        <p className="text-xs text-slate-400 mb-5">Approved payments only</p>
        <div className="flex items-end gap-3 h-40">
          {revenue.map(r => (
            <div key={r.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-500">
                {r.amount > 0 ? `₱${r.amount >= 1000 ? `${(r.amount/1000).toFixed(1)}k` : r.amount}` : ""}
              </span>
              <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                <div
                  className="w-full bg-sky-500 rounded-t-lg transition-all"
                  style={{ height: `${Math.max((r.amount / maxBar) * 96, r.amount > 0 ? 8 : 2)}px` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{r.month}</span>
              {r.count > 0 && <span className="text-[9px] text-slate-300">{r.count} sale{r.count !== 1 ? "s" : ""}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Plans breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Revenue by Plan</h3>
        {topPlans.length === 0 ? (
          <p className="text-sm text-slate-400">No approved payments yet.</p>
        ) : (
          <div className="space-y-3">
            {topPlans.map(p => (
              <div key={p.label} className="flex items-center gap-4">
                <span className="text-sm text-slate-700 font-medium w-32 truncate">{p.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${Math.round((p.revenue / totals.revenue) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-20 text-right">₱{p.revenue.toLocaleString()}</span>
                <span className="text-xs text-slate-400 w-16 text-right">{p.count} sale{p.count !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment status breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Payment Status Breakdown</h3>
        <div className="flex gap-4">
          {[
            { label: "Approved", value: totals.approved, color: "bg-emerald-500" },
            { label: "Pending",  value: totals.pending,  color: "bg-amber-400" },
            { label: "Rejected", value: totals.rejected, color: "bg-red-400" },
          ].map(s => {
            const total = totals.approved + totals.pending + totals.rejected;
            const pct   = total > 0 ? Math.round((s.value / total) * 100) : 0;
            return (
              <div key={s.label} className="flex-1 text-center">
                <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                <div className="mt-2 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PaymentsTab({ onBadgeChange }: { onBadgeChange: (n: number) => void }) {
  const [payments, setPayments] = useState<DBPayment[]>([]);
  const [selected, setSelected] = useState<DBPayment | null>(null);
  const [filter, setFilter]     = useState<PaymentStatus | "all">("all");
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);

  const fetchPayments = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data } = await supabase
      .from("payments")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) {
      setPayments(data as DBPayment[]);
      onBadgeChange((data as DBPayment[]).filter(p => p.status === "pending").length);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);

  const act = async (payment: DBPayment, action: "approved" | "rejected") => {
    if (!isSupabaseConfigured) return;
    setActing(true);
    // 1. Update payment status — do NOT include updated_at (column doesn't exist in schema)
    const { error: updateErr } = await supabase
      .from("payments")
      .update({ status: action })
      .eq("id", payment.id);
    if (updateErr) {
      console.error("Payment status update failed:", updateErr.message);
      setActing(false);
      return;
    }
    // 2. If approved, activate is_premium on user
    if (action === "approved") {
      await supabase.from("profiles").update({ is_premium: true }).eq("id", payment.user_id);
    }
    // 3. Notify the user directly (not through createNotification which would pollute admin store)
    await supabase.from("notifications").insert({
      user_id: payment.user_id,
      type: "system",
      title: action === "approved" ? "Payment Approved! 🎉" : "Payment Rejected",
      body: action === "approved"
        ? `Your ${payment.plan_label} payment has been verified. Your plan is now active!`
        : `Your ${payment.plan_label} payment was rejected. Please contact support if you believe this is an error.`,
      reference_id: payment.id,
    });
    await fetchPayments();
    setSelected(prev => prev?.id === payment.id ? { ...prev, status: action } : prev);
    setActing(false);
  };

  const statusStyle = (s: string) => ({
    pending:  "bg-amber-50 text-amber-700 border border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rejected: "bg-red-50 text-red-700 border border-red-200",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize transition ${
                filter === f ? "bg-sky-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Account", "Plan", "Amount", "Method", "Ref ID", "Date", "Status", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} onClick={() => setSelected(p)}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selected?.id === p.id ? "bg-sky-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.profiles?.full_name ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{p.plan_label}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">₱{p.amount}</td>
                    <td className="px-4 py-3 text-slate-600">{p.method}</td>
                    <td className="px-4 py-3">
                      {p.reference_id
                        ? <span className="font-mono text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{p.reference_id}</span>
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); setSelected(p); }}
                        className="flex items-center gap-1 text-xs text-sky-600 hover:underline font-medium">
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No payments found.</div>
          )}
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 self-start sticky top-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-800">Payment Detail</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-2.5 text-sm">
            {[
              ["Account",  selected.profiles?.full_name ?? "—"],
              ["Plan",     selected.plan_label],
              ["Amount",   `₱${selected.amount}`],
              ["Method",   selected.method],
              ["Date",     new Date(selected.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
            {/* Reference ID — prominent */}
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference ID</span>
              {selected.reference_id
                ? <span className="font-mono text-sm text-slate-800 bg-slate-100 px-2 py-1 rounded break-all">{selected.reference_id}</span>
                : <span className="text-xs text-slate-400 italic">Not provided</span>}
            </div>
          </div>

          {/* OCR extracted data */}
          {selected.ocr_data && (
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 space-y-1">
              <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wide mb-1.5">
                🔍 OCR Scan (confidence: {Math.round((selected.ocr_data.confidence ?? 0) * 100)}%)
              </p>
              {selected.ocr_data.extracted?.method && (
                <div className="flex justify-between text-xs">
                  <span className="text-sky-600">Method</span>
                  <span className="font-medium text-slate-700">{selected.ocr_data.extracted.method}</span>
                </div>
              )}
              {selected.ocr_data.extracted?.amount && (
                <div className="flex justify-between text-xs">
                  <span className="text-sky-600">Amount</span>
                  <span className="font-medium text-slate-700">₱{selected.ocr_data.extracted.amount.toFixed(2)}</span>
                </div>
              )}
              {selected.ocr_data.extracted?.date && (
                <div className="flex justify-between text-xs">
                  <span className="text-sky-600">Date</span>
                  <span className="font-medium text-slate-700">
                    {new Date(selected.ocr_data.extracted.date).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 flex flex-col items-center gap-2 bg-slate-50">
            <Image className="h-8 w-8 text-slate-300" />
            {selected.receipt_url ? (
              <a href={selected.receipt_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-sky-600 underline">Open receipt</a>
            ) : (
              <p className="text-xs text-slate-400 text-center">No receipt uploaded</p>
            )}
          </div>

          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle(selected.status)}`}>
            {selected.status}
          </span>

          {selected.status === "pending" && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => act(selected, "approved")} disabled={acting}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition">
                {acting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
              </button>
              <button onClick={() => act(selected, "rejected")} disabled={acting}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition">
                {acting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5" />} Reject
              </button>
            </div>
          )}
          {selected.status === "approved" && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg p-3 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Payment approved. User's plan is active.
            </div>
          )}
          {selected.status === "rejected" && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-3 text-xs">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              Payment rejected. User has been notified.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubscriptionsTab() {
  const [counts, setCounts] = useState({ premium: 0, free: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [recentUpgrades, setRecentUpgrades] = useState<DBPayment[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", false),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("payments")
        .select("*, profiles(full_name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(([prem, free, total, upgrades]) => {
      setCounts({
        premium: prem.count ?? 0,
        free: free.count ?? 0,
        total: total.count ?? 0,
      });
      if (upgrades.data) setRecentUpgrades(upgrades.data as DBPayment[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users}  label="Total Users"   value={counts.total.toLocaleString()} color="sky" />
        <StatCard icon={Star}   label="Plus (Premium)" value={counts.premium.toLocaleString()} color="amber" />
        <StatCard icon={Shield} label="Free Users"    value={counts.free.toLocaleString()} color="slate" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Recent Approved Upgrades</h3>
        {recentUpgrades.length === 0 ? (
          <p className="text-sm text-slate-400">No approved payments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr>
                {["User", "Plan", "Amount", "Method", "Date"].map(h => (
                  <th key={h} className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentUpgrades.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="py-3 font-medium text-slate-800">{r.profiles?.full_name ?? "—"}</td>
                  <td className="py-3 text-slate-600 text-xs">{r.plan_label}</td>
                  <td className="py-3 font-semibold text-slate-800">₱{r.amount}</td>
                  <td className="py-3 text-slate-500">{r.method}</td>
                  <td className="py-3 text-slate-500 text-xs">
                    {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface RealBooking {
  id: string;
  user_id: string;
  tourist_name: string | null;
  gem_name: string | null;
  gem_id: string | null;
  date: string | null;
  trip_type: string | null;
  guests: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

// ─── Booking detail modal ────────────────────────────────────────
function BookingDetailModal({ booking, onClose }: { booking: RealBooking; onClose: () => void }) {
  const statusStyle: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending:   "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-sky-100 text-sky-700",
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Booking Details</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Tourist</span>
            <span className="font-semibold text-slate-800">{booking.tourist_name ?? "—"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Destination</span>
            <span className="font-semibold text-slate-800">{booking.gem_name ?? "—"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Trip Date</span>
            <span className="font-semibold text-slate-800">{booking.date ?? "—"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Trip Type</span>
            <span className="font-semibold text-slate-800 capitalize">{booking.trip_type ?? "—"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Guests</span>
            <span className="font-semibold text-slate-800">{booking.guests ?? 1}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Status</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusStyle[booking.status] ?? "bg-slate-100 text-slate-600"}`}>
              {booking.status}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Submitted</span>
            <span className="font-semibold text-slate-800">
              {new Date(booking.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {booking.notes && (
            <div className="py-2">
              <p className="text-slate-500 mb-1">Notes</p>
              <p className="text-slate-700 bg-slate-50 rounded-lg px-3 py-2 text-xs">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cancel confirmation modal ───────────────────────────────────
function CancelModal({ booking, onConfirm, onClose, loading }: {
  booking: RealBooking;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 text-center mb-1">Cancel Booking?</h2>
        <p className="text-sm text-slate-500 text-center mb-1">
          <span className="font-semibold text-slate-700">{booking.tourist_name}</span> — {booking.gem_name}
        </p>
        <p className="text-xs text-slate-400 text-center mb-5">This will notify the user that their booking was cancelled.</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition">
            Keep Booking
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Cancel It
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings]         = useState<RealBooking[]>([]);
  const [loadingBookings, setLoading]   = useState(true);
  const [counts, setCounts]             = useState({ confirmed: 0, pending: 0, cancelled: 0 });
  const [detailBooking, setDetailBooking] = useState<RealBooking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<RealBooking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const recompute = (list: RealBooking[]) => {
    setCounts({
      confirmed: list.filter(b => b.status === "confirmed").length,
      pending:   list.filter(b => b.status === "pending").length,
      cancelled: list.filter(b => b.status === "cancelled").length,
    });
  };

  async function fetchBookings() {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data } = await supabase
      .from("bookings")
      .select(`id, user_id, gem_id, gem_name, date, trip_type, guests, notes, status, created_at, profiles ( full_name )`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (data) {
      const mapped: RealBooking[] = data.map((b: any) => ({
        id:           b.id,
        user_id:      b.user_id,
        tourist_name: b.profiles?.full_name ?? "—",
        gem_name:     b.gem_name ?? "—",
        gem_id:       b.gem_id ?? null,
        date:         b.date ?? "—",
        trip_type:    b.trip_type ?? "—",
        guests:       b.guests ?? 1,
        notes:        b.notes ?? null,
        status:       b.status ?? "pending",
        created_at:   b.created_at,
      }));
      setBookings(mapped);
      recompute(mapped);
    }
    setLoading(false);
  }

  useEffect(() => { fetchBookings(); }, []);

  async function updateStatus(bookingId: string, newStatus: "confirmed" | "cancelled") {
    setActionLoading(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      console.error("Booking update error:", error);
      setActionLoading(null);
      setCancelBooking(null);
      return;
    }

    // Update local state immediately
    const updated = bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
    setBookings(updated);
    recompute(updated);

    // Notify the user
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      const { createNotification } = await import("../../stores");
      if (newStatus === "confirmed") {
        await createNotification(booking.user_id, {
          type: "booking_confirmed",
          title: "Booking Confirmed! ✅",
          body: `Your trip to ${booking.gem_name} on ${booking.date} has been confirmed by TCUnnect.`,
          linkTo: "/my-bookings",
          referenceId: bookingId,
        });
      } else {
        await createNotification(booking.user_id, {
          type: "booking_cancelled",
          title: "Booking Cancelled",
          body: `Your trip to ${booking.gem_name} on ${booking.date} has been cancelled by TCUnnect.`,
          linkTo: "/my-bookings",
          referenceId: bookingId,
        });
      }
    }

    setActionLoading(null);
    setCancelBooking(null);
  }

  const statusStyle = (s: string) => ({
    confirmed: "bg-emerald-50 text-emerald-700",
    pending:   "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
    completed: "bg-sky-50 text-sky-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-4">
      {detailBooking && <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />}
      {cancelBooking && (
        <CancelModal
          booking={cancelBooking}
          loading={actionLoading === cancelBooking.id}
          onConfirm={() => updateStatus(cancelBooking.id, "cancelled")}
          onClose={() => setCancelBooking(null)}
        />
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={CheckCircle2} label="Confirmed" value={counts.confirmed} color="emerald" />
        <StatCard icon={Clock}        label="Pending"   value={counts.pending}   color="amber" />
        <StatCard icon={XCircle}      label="Cancelled" value={counts.cancelled} color="rose" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        {loadingBookings ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No bookings yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Tourist", "Destination", "Date", "Type", "Guests", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map(b => {
                const isActing = actionLoading === b.id;
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{b.tourist_name}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{b.gem_name}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{b.date}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize whitespace-nowrap">{b.trip_type}</td>
                    <td className="px-4 py-3 text-slate-600 text-center">{b.guests}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {/* View Details — always available */}
                        <button
                          onClick={() => setDetailBooking(b)}
                          title="View Details"
                          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-medium px-2 py-1 rounded-lg hover:bg-sky-50 transition"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>

                        {/* Confirm — only for pending */}
                        {b.status === "pending" && (
                          <button
                            onClick={() => updateStatus(b.id, "confirmed")}
                            disabled={isActing}
                            title="Confirm Booking"
                            className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition disabled:opacity-50"
                          >
                            {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Confirm
                          </button>
                        )}

                        {/* Cancel — for pending or confirmed */}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button
                            onClick={() => setCancelBooking(b)}
                            disabled={isActing}
                            title="Cancel Booking"
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Gem Content Item Types ───────────────────────────────────────────────────
type ContentSection = "places" | "activities" | "food" | "products" | "stays" | "experiences";

interface ContentItemDraft {
  _key: string; // local draft key
  id?: string;  // set if persisted
  section: ContentSection;
  sort_order: number;
  name: string;
  description: string;
  distance: string;
  tag: string;
  duration: string;
  category_label: string;
  price_range: string;
  seller: string;
  action_type: string;
}

function emptyItem(section: ContentSection, idx: number): ContentItemDraft {
  return {
    _key: `${section}_${Date.now()}_${idx}`,
    section,
    sort_order: idx,
    name: "",
    description: "",
    distance: "",
    tag: "",
    duration: "",
    category_label: "",
    price_range: "",
    seller: "",
    action_type: "Inquire",
  };
}

interface GemFormState {
  name: string;
  location: string;
  category: string;
  budget_level: string;
  description: string;
  tip: string;
  images: string;       // comma-separated
  status: string;
  is_featured: boolean;
}

const EMPTY_GEM_FORM: GemFormState = {
  name: "", location: "", category: "Mountain", budget_level: "₱₱",
  description: "", tip: "", images: "", status: "approved", is_featured: false,
};

// ─── Gem Editor Modal ─────────────────────────────────────────────────────────

function GemEditorModal({
  gemId,
  onClose,
  onSaved,
}: {
  gemId: string | null; // null = create new
  onClose: () => void;
  onSaved: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"basic" | ContentSection>("basic");
  const [form, setForm] = useState<GemFormState>(EMPTY_GEM_FORM);
  const [items, setItems] = useState<Record<ContentSection, ContentItemDraft[]>>({
    places: [], activities: [], food: [], products: [], stays: [], experiences: [],
  });
  const [loading, setLoading] = useState(!!gemId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing gem + content items when editing
  useEffect(() => {
    if (!gemId || !isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const [gemRes, contentRes] = await Promise.all([
        supabase.from("hidden_gems")
          .select("name, location, category, budget_level, description, tip, images, status, is_featured")
          .eq("id", gemId).single(),
        supabase.from("gem_content_items")
          .select("*")
          .eq("gem_id", gemId)
          .order("sort_order", { ascending: true }),
      ]);
      if (gemRes.data) {
        const g = gemRes.data as any;
        setForm({
          name: g.name ?? "",
          location: g.location ?? "",
          category: g.category ?? "Mountain",
          budget_level: g.budget_level ?? "₱₱",
          description: g.description ?? "",
          tip: g.tip ?? "",
          images: (g.images ?? []).join(", "),
          status: g.status ?? "approved",
          is_featured: g.is_featured ?? false,
        });
      }
      if (contentRes.data) {
        const grouped: Record<ContentSection, ContentItemDraft[]> = {
          places: [], activities: [], food: [], products: [], stays: [], experiences: [],
        };
        (contentRes.data as any[]).forEach((row, i) => {
          const s = row.section as ContentSection;
          grouped[s].push({
            _key: row.id,
            id: row.id,
            section: s,
            sort_order: row.sort_order ?? i,
            name: row.name ?? "",
            description: row.description ?? "",
            distance: row.distance ?? "",
            tag: row.tag ?? "",
            duration: row.duration ?? "",
            category_label: row.category_label ?? "",
            price_range: row.price_range ?? "",
            seller: row.seller ?? "",
            action_type: row.action_type ?? "Inquire",
          });
        });
        setItems(grouped);
      }
      setLoading(false);
    })();
  }, [gemId]);

  function updateItem(section: ContentSection, key: string, field: keyof ContentItemDraft, value: string) {
    setItems(prev => ({
      ...prev,
      [section]: prev[section].map(it => it._key === key ? { ...it, [field]: value } : it),
    }));
  }

  function addItem(section: ContentSection) {
    setItems(prev => ({
      ...prev,
      [section]: [...prev[section], emptyItem(section, prev[section].length)],
    }));
  }

  function removeItem(section: ContentSection, key: string) {
    setItems(prev => ({ ...prev, [section]: prev[section].filter(it => it._key !== key) }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.location.trim() || !form.category || !form.description.trim()) {
      setError("Gem Name, Location, Category, and Description are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const imageArr = form.images.split(",").map(s => s.trim()).filter(Boolean);
    const gemPayload = {
      name: form.name.trim(),
      location: form.location.trim(),
      category: form.category,
      budget_level: form.budget_level,
      description: form.description.trim(),
      tip: form.tip.trim(),
      images: imageArr,
      status: form.status,
      is_featured: form.is_featured,
    };

    let finalGemId = gemId;

    if (gemId) {
      const { error: ue } = await supabase.from("hidden_gems").update(gemPayload).eq("id", gemId);
      if (ue) { setError(ue.message); setSaving(false); return; }
    } else {
      const { data, error: ie } = await supabase.from("hidden_gems").insert(gemPayload).select("id").single();
      if (ie || !data) { setError(ie?.message ?? "Insert failed"); setSaving(false); return; }
      finalGemId = data.id;
    }

    // Replace all content items: delete existing then insert new
    if (finalGemId) {
      await supabase.from("gem_content_items").delete().eq("gem_id", finalGemId);

      const allItems: any[] = [];
      (Object.keys(items) as ContentSection[]).forEach(section => {
        items[section].forEach((it, idx) => {
          if (!it.name.trim()) return; // skip blank items
          allItems.push({
            gem_id: finalGemId,
            section,
            sort_order: idx,
            name: it.name.trim(),
            description: it.description.trim(),
            distance: it.distance.trim() || null,
            tag: it.tag.trim() || null,
            duration: it.duration.trim() || null,
            category_label: it.category_label.trim() || null,
            price_range: it.price_range.trim() || null,
            seller: it.seller.trim() || null,
            action_type: it.action_type || null,
          });
        });
      });

      if (allItems.length > 0) {
        const { error: ci } = await supabase.from("gem_content_items").insert(allItems);
        if (ci) { setError(ci.message); setSaving(false); return; }
      }
    }

    setSaving(false);
    onSaved();
  }

  const SECTIONS: { key: ContentSection; label: string }[] = [
    { key: "places",      label: "Places to Visit" },
    { key: "activities",  label: "Things to Do" },
    { key: "food",        label: "Food & Drinks" },
    { key: "products",    label: "Products & Local Finds" },
    { key: "stays",       label: "Where to Stay" },
    { key: "experiences", label: "Experiences" },
  ];

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400";
  const labelCls = "text-xs font-semibold text-slate-600 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">{gemId ? "Edit Destination" : "Add New Destination"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Tab Bar */}
            <div className="flex overflow-x-auto border-b border-slate-100 px-6 gap-1 pt-2">
              <button
                onClick={() => setActiveTab("basic")}
                className={`text-xs font-semibold px-3 py-2 rounded-t-lg whitespace-nowrap transition ${activeTab === "basic" ? "bg-sky-50 text-sky-700 border border-b-white border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                Basic Info
              </button>
              {SECTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setActiveTab(s.key)}
                  className={`text-xs font-semibold px-3 py-2 rounded-t-lg whitespace-nowrap transition ${activeTab === s.key ? "bg-sky-50 text-sky-700 border border-b-white border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {s.label}
                  {items[s.key].length > 0 && (
                    <span className="ml-1 bg-sky-100 text-sky-700 text-[10px] px-1.5 rounded-full">{items[s.key].length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-4">
              {/* ── Basic Info ── */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Gem Name *</label>
                      <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mt. Daraitan" />
                    </div>
                    <div>
                      <label className={labelCls}>Location *</label>
                      <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Tanay, Rizal" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Category *</label>
                      <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                        {["Beach","Mountain","Nature","Food","Heritage","Cafe","Waterfalls","City"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Budget Level</label>
                      <select className={inputCls} value={form.budget_level} onChange={e => setForm(f => ({ ...f, budget_level: e.target.value }))}>
                        <option value="₱">₱ Budget</option>
                        <option value="₱₱">₱₱ Mid-range</option>
                        <option value="₱₱₱">₱₱₱ Premium</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description *</label>
                    <textarea className={`${inputCls} resize-none`} rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this destination..." />
                  </div>
                  <div>
                    <label className={labelCls}>Insider Tip</label>
                    <input className={inputCls} value={form.tip} onChange={e => setForm(f => ({ ...f, tip: e.target.value }))} placeholder="e.g. Best visited at dawn for sunrise views" />
                  </div>
                  <div>
                    <label className={labelCls}>Image URLs (comma-separated)</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} placeholder="https://..., https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Status</label>
                      <select className={inputCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        <option value="approved">Approved (Public)</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input type="checkbox" id="is_featured" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="h-4 w-4 rounded" />
                      <label htmlFor="is_featured" className="text-sm text-slate-700">Feature this gem ✨</label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Places to Visit ── */}
              {activeTab === "places" && (
                <ContentItemList
                  items={items.places}
                  onAdd={() => addItem("places")}
                  onRemove={key => removeItem("places", key)}
                  onUpdate={(key, field, val) => updateItem("places", key, field, val)}
                  fields={[
                    { key: "name", label: "Place Name *", placeholder: "e.g. Summit Viewdeck" },
                    { key: "description", label: "Description", placeholder: "Brief description...", multiline: true },
                    { key: "distance", label: "Distance", placeholder: "e.g. 1.5 km" },
                    { key: "tag", label: "Type Tag", placeholder: "e.g. 🏔 Viewpoint" },
                  ]}
                  addLabel="+ Add Place"
                />
              )}

              {/* ── Things to Do ── */}
              {activeTab === "activities" && (
                <ContentItemList
                  items={items.activities}
                  onAdd={() => addItem("activities")}
                  onRemove={key => removeItem("activities", key)}
                  onUpdate={(key, field, val) => updateItem("activities", key, field, val)}
                  fields={[
                    { key: "name", label: "Activity Name *", placeholder: "e.g. Guided Summit Trek" },
                    { key: "description", label: "Description", placeholder: "Brief description...", multiline: true },
                    { key: "duration", label: "Duration", placeholder: "e.g. 6–8 hrs" },
                    { key: "tag", label: "Type Tag", placeholder: "e.g. 🥾 Hiking" },
                  ]}
                  addLabel="+ Add Activity"
                />
              )}

              {/* ── Food & Drinks ── */}
              {activeTab === "food" && (
                <ContentItemList
                  items={items.food}
                  onAdd={() => addItem("food")}
                  onRemove={key => removeItem("food", key)}
                  onUpdate={(key, field, val) => updateItem("food", key, field, val)}
                  fields={[
                    { key: "name", label: "Name *", placeholder: "e.g. Mountain View Eatery" },
                    { key: "category_label", label: "Category", placeholder: "e.g. Filipino / Comfort Food" },
                    { key: "price_range", label: "Price Range", placeholder: "e.g. ₱250–₱500 / meal" },
                    { key: "description", label: "Description", placeholder: "Brief description...", multiline: true },
                  ]}
                  addLabel="+ Add Food & Drink"
                />
              )}

              {/* ── Products & Local Finds ── */}
              {activeTab === "products" && (
                <ContentItemList
                  items={items.products}
                  onAdd={() => addItem("products")}
                  onRemove={key => removeItem("products", key)}
                  onUpdate={(key, field, val) => updateItem("products", key, field, val)}
                  fields={[
                    { key: "name", label: "Product / Find Name *", placeholder: "e.g. Local Strawberry Jam" },
                    { key: "description", label: "Description", placeholder: "Brief description...", multiline: true },
                    { key: "seller", label: "Seller / Store", placeholder: "e.g. Farmers' Roadside Stalls" },
                  ]}
                  addLabel="+ Add Local Find"
                />
              )}

              {/* ── Where to Stay ── */}
              {activeTab === "stays" && (
                <ContentItemList
                  items={items.stays}
                  onAdd={() => addItem("stays")}
                  onRemove={key => removeItem("stays", key)}
                  onUpdate={(key, field, val) => updateItem("stays", key, field, val)}
                  fields={[
                    { key: "name", label: "Accommodation Name *", placeholder: "e.g. Pine Lodge Guesthouse" },
                    { key: "category_label", label: "Type", placeholder: "e.g. 🏡 Guesthouse" },
                    { key: "price_range", label: "Price", placeholder: "e.g. From ₱1,400/night" },
                    { key: "description", label: "Description", placeholder: "Brief description...", multiline: true },
                  ]}
                  addLabel="+ Add Accommodation"
                />
              )}

              {/* ── Experiences ── */}
              {activeTab === "experiences" && (
                <ContentItemList
                  items={items.experiences}
                  onAdd={() => addItem("experiences")}
                  onRemove={key => removeItem("experiences", key)}
                  onUpdate={(key, field, val) => updateItem("experiences", key, field, val)}
                  fields={[
                    { key: "name", label: "Experience Name *", placeholder: "e.g. Coffee Farm Tour" },
                    { key: "description", label: "Description", placeholder: "Brief description...", multiline: true },
                    { key: "price_range", label: "Price", placeholder: "e.g. ₱350/person" },
                    { key: "action_type", label: "Action Button", select: ["Book Now","Inquire","View Details","Get Directions"] },
                  ]}
                  addLabel="+ Add Experience"
                />
              )}
            </div>

            {/* Footer */}
            {error && <p className="px-6 pb-2 text-xs text-red-500">{error}</p>}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
              >
                {saving ? "Saving…" : gemId ? "Save Changes" : "Create Destination"}
              </button>
              <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Content Item List (reusable within GemEditorModal) ───────────────────────
interface FieldDef {
  key: keyof ContentItemDraft;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  select?: string[];
}

function ContentItemList({
  items,
  onAdd,
  onRemove,
  onUpdate,
  fields,
  addLabel,
}: {
  items: ContentItemDraft[];
  onAdd: () => void;
  onRemove: (key: string) => void;
  onUpdate: (key: string, field: keyof ContentItemDraft, value: string) => void;
  fields: FieldDef[];
  addLabel: string;
}) {
  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400";
  const labelCls = "text-xs font-semibold text-slate-600 mb-1 block";

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">No items yet. Click below to add one.</p>
      )}
      {items.map((item, idx) => (
        <div key={item._key} className="bg-slate-50 rounded-xl p-4 space-y-3 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Item #{idx + 1}</span>
            <button onClick={() => onRemove(item._key)} className="text-xs text-red-400 hover:text-red-600">✕ Remove</button>
          </div>
          {fields.map(f => (
            <div key={String(f.key)}>
              <label className={labelCls}>{f.label}</label>
              {f.select ? (
                <select className={inputCls} value={String(item[f.key] ?? "")} onChange={e => onUpdate(item._key, f.key, e.target.value)}>
                  {f.select.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : f.multiline ? (
                <textarea className={`${inputCls} resize-none`} rows={2} value={String(item[f.key] ?? "")} placeholder={f.placeholder} onChange={e => onUpdate(item._key, f.key, e.target.value)} />
              ) : (
                <input className={inputCls} value={String(item[f.key] ?? "")} placeholder={f.placeholder} onChange={e => onUpdate(item._key, f.key, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full border-2 border-dashed border-slate-200 hover:border-sky-300 text-slate-500 hover:text-sky-600 font-semibold py-3 rounded-xl text-sm transition"
      >
        {addLabel}
      </button>
    </div>
  );
}

// ─── GemsTab ──────────────────────────────────────────────────────────────────
function GemsTab({ onBadgeChange }: { onBadgeChange: (n: number) => void }) {
  const [gems, setGems]           = useState<DBGem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState<string | null>(null);
  const [editorGemId, setEditorGemId] = useState<string | "new" | null>(null);

  const fetchGems = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data } = await supabase
      .from("hidden_gems")
      .select("id, name, location, category, status, created_at, submitted_by, is_featured, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) {
      const gems = (data as unknown as DBGem[]);
      setGems(gems);
      onBadgeChange(gems.filter(g => g.status === "pending").length);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGems(); }, []);

  const updateStatus = async (gem: DBGem, newStatus: "approved" | "rejected") => {
    if (!isSupabaseConfigured) return;
    setActing(gem.id);
    await supabase.from("hidden_gems").update({ status: newStatus }).eq("id", gem.id);
    // Notification for gem owner is handled by fn_notify_gem_approved trigger on status→approved
    await fetchGems();
    setActing(null);
  };

  const toggleFeatured = async (gem: DBGem) => {
    if (!isSupabaseConfigured) return;
    setActing(gem.id);
    await supabase.from("hidden_gems").update({ is_featured: !gem.is_featured }).eq("id", gem.id);
    await fetchGems();
    setActing(null);
  };

  const deleteGem = async (gem: DBGem) => {
    if (!isSupabaseConfigured) return;
    if (!window.confirm(`Delete "${gem.name}"? This cannot be undone.`)) return;
    setActing(gem.id);
    await supabase.from("hidden_gems").delete().eq("id", gem.id);
    await fetchGems();
    setActing(null);
  };

  const statusStyle = (s: string) => ({
    approved: "bg-emerald-50 text-emerald-700",
    pending:  "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-4">
      {editorGemId !== null && (
        <GemEditorModal
          gemId={editorGemId === "new" ? null : editorGemId}
          onClose={() => setEditorGemId(null)}
          onSaved={() => { setEditorGemId(null); fetchGems(); }}
        />
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Hidden Gems</h2>
        <button
          onClick={() => setEditorGemId("new")}
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <span className="text-base leading-none">+</span> Add New Destination
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Name", "Location", "Category", "Submitted By", "Date", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {gems.map(g => (
                <tr key={g.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {g.name}
                    {g.is_featured && (
                      <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">★ Featured</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{g.location ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{g.category ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{(g as any).profiles?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(g.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(g.status)}`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setEditorGemId(g.id)}
                        className="text-xs text-sky-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      {g.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(g, "approved")} disabled={acting === g.id}
                            className="text-xs text-emerald-600 hover:underline disabled:opacity-50">
                            {acting === g.id ? "…" : "Approve"}
                          </button>
                          <button onClick={() => updateStatus(g, "rejected")} disabled={acting === g.id}
                            className="text-xs text-rose-500 hover:underline disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                      {g.status === "approved" && (
                        <button onClick={() => toggleFeatured(g)} disabled={acting === g.id}
                          className={`text-xs hover:underline disabled:opacity-50 ${g.is_featured ? "text-amber-600" : "text-slate-500"}`}>
                          {acting === g.id ? "…" : g.is_featured ? "Unfeature" : "Feature"}
                        </button>
                      )}
                      {g.status === "rejected" && (
                        <button onClick={() => updateStatus(g, "approved")} disabled={acting === g.id}
                          className="text-xs text-sky-600 hover:underline disabled:opacity-50">
                          Re-approve
                        </button>
                      )}
                      <button onClick={() => deleteGem(g)} disabled={acting === g.id}
                        className="text-xs text-rose-500 hover:underline disabled:opacity-50">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && gems.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No gems submitted yet.</div>
        )}
      </div>
    </div>
  );
}

function FeaturedTab() {
  const [gems, setGems]       = useState<DBGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);

  const fetchFeatured = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data } = await supabase
      .from("hidden_gems")
      .select("id, name, location, category, status, created_at, is_featured")
      .eq("status", "approved")
      .order("name")
      .limit(200);
    if (data) setGems(data as DBGem[]);
    setLoading(false);
  };

  useEffect(() => { fetchFeatured(); }, []);

  const toggleFeatured = async (gem: DBGem) => {
    if (!isSupabaseConfigured) return;
    setActing(gem.id);
    await supabase.from("hidden_gems").update({ is_featured: !gem.is_featured }).eq("id", gem.id);
    await fetchFeatured();
    setActing(null);
  };

  const featured = gems.filter(g => g.is_featured);
  const all      = gems.filter(g => !g.is_featured);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          <strong>{featured.length}</strong> featured place{featured.length !== 1 ? "s" : ""} · {gems.length} approved total
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-slate-700">★ Currently Featured</h3>
          {featured.length === 0 ? (
            <p className="text-sm text-slate-400">No featured places yet. Feature some approved gems below.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {featured.map(g => (
                <div key={g.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{g.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{g.location} · {g.category}</p>
                  </div>
                  <button onClick={() => toggleFeatured(g)} disabled={acting === g.id}
                    className="text-xs text-rose-500 hover:underline disabled:opacity-50 whitespace-nowrap">
                    {acting === g.id ? "…" : "Unfeature"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {all.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-slate-700 pt-2">Approved gems (not featured)</h3>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Name", "Location", "Category", "Action"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {all.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800">{g.name}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{g.location ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{g.category ?? "—"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleFeatured(g)} disabled={acting === g.id}
                            className="text-xs text-amber-600 hover:underline disabled:opacity-50">
                            {acting === g.id ? "…" : "+ Feature"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

interface DBReview {
  id: string;
  user_id: string;
  booking_id: string;
  gem_id: string;
  gem_name: string;
  rating: number;
  review_text: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: { full_name: string | null; profile_photo: string | null };
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<DBReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReview, setViewReview] = useState<DBReview | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("reviews")
      .select("id, user_id, booking_id, gem_id, gem_name, rating, review_text, status, created_at, profiles(full_name, profile_photo)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) setReviews(data as unknown as DBReview[]);
        setLoading(false);
      });
  }, []);

  const total = reviews.length;
  const pending = reviews.filter(r => r.status === "pending").length;
  const approved = reviews.filter(r => r.status === "approved").length;
  const rejected = reviews.filter(r => r.status === "rejected").length;

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);

  async function updateReview(id: string, status: "approved" | "rejected") {
    setActionLoading(id + status);
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (!error) {
      setReviews(rs => rs.map(r => r.id === id ? { ...r, status } : r));
      if (viewReview?.id === id) setViewReview(prev => prev ? { ...prev, status } : null);

      // Notify the user
      const review = reviews.find(r => r.id === id);
      if (review) {
        const { createNotification } = await import("../../stores");
        if (status === "approved") {
          await createNotification(review.user_id, {
            type: "review_approved",
            title: "Review Approved ✅",
            body: `Your review for "${review.gem_name}" is now live!`,
            linkTo: `/gems/${review.gem_id}`,
          });
        } else {
          await createNotification(review.user_id, {
            type: "review_rejected",
            title: "Review Not Published",
            body: `Your review for "${review.gem_name}" was not approved for public display.`,
          });
        }
      }
    }
    setActionLoading(null);
  }

  const statusBadge = (s: DBReview["status"]) => ({
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rejected: "bg-red-50 text-red-600 border border-red-200",
  }[s]);

  function StarRow({ rating }: { rating: number }) {
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Star} label="Total Reviews" value={total} color="sky" />
        <StatCard icon={Clock} label="Pending" value={pending} color="amber" />
        <StatCard icon={CheckCircle2} label="Approved" value={approved} color="emerald" />
        <StatCard icon={XCircle} label="Rejected" value={rejected} color="rose" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "all", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
              filter === f
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No {filter !== "all" ? filter : ""} reviews found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Reviewer", "Destination", "Rating", "Preview", "Date", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rv => (
                  <tr key={rv.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {rv.profiles?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{rv.gem_name}</td>
                    <td className="px-4 py-3"><StarRow rating={rv.rating} /></td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate text-xs">{rv.review_text}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(rv.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusBadge(rv.status)}`}>
                        {rv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewReview(rv)}
                          className="text-xs text-sky-600 hover:underline"
                        >View</button>
                        {rv.status !== "approved" && (
                          <button
                            onClick={() => updateReview(rv.id, "approved")}
                            disabled={actionLoading === rv.id + "approved"}
                            className="text-xs text-emerald-600 hover:underline disabled:opacity-50"
                          >Approve</button>
                        )}
                        {rv.status !== "rejected" && (
                          <button
                            onClick={() => updateReview(rv.id, "rejected")}
                            disabled={actionLoading === rv.id + "rejected"}
                            className="text-xs text-red-500 hover:underline disabled:opacity-50"
                          >Reject</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setViewReview(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Review Detail</h3>
              <button onClick={() => setViewReview(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-500">
                  {viewReview.profiles?.profile_photo
                    ? <img src={viewReview.profiles.profile_photo} alt="" className="h-full w-full object-cover" />
                    : viewReview.profiles?.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{viewReview.profiles?.full_name ?? "Unknown"}</p>
                  <p className="text-xs text-slate-500">{new Date(viewReview.created_at).toLocaleString("en-PH")}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Destination</p>
                <p className="font-medium text-slate-800">{viewReview.gem_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Rating</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= viewReview.rating ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`} />
                  ))}
                  <span className="ml-1 text-sm font-semibold text-slate-700">{viewReview.rating}/5</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Review</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3">{viewReview.review_text}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusBadge(viewReview.status)}`}>
                  {viewReview.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              {viewReview.status !== "approved" && (
                <button
                  onClick={() => updateReview(viewReview.id, "approved")}
                  disabled={!!actionLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                >
                  {actionLoading === viewReview.id + "approved" ? "..." : "Approve"}
                </button>
              )}
              {viewReview.status !== "rejected" && (
                <button
                  onClick={() => updateReview(viewReview.id, "rejected")}
                  disabled={!!actionLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
                >
                  {actionLoading === viewReview.id + "rejected" ? "..." : "Reject"}
                </button>
              )}
              <button
                onClick={() => setViewReview(null)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports]     = useState<DBReport[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected]   = useState<DBReport | null>(null);
  const [acting, setActing]       = useState(false);
  const [pendingCount, setPendingCount]   = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [dismissedCount, setDismissedCount] = useState(0);

  const fetchReports = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setFetchError(null);

    // Step 1: safe base columns — only columns guaranteed to exist in the live DB.
    // Do NOT include reported_user_id / reported_post_id / match_id / message_content / details
    // here; they are added as silent enrichment below so a missing column never blocks the list.
    const baseResult = await supabase
      .from("reports")
      .select("id, reported_by, reported_item_type, reported_item_id, reason, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (baseResult.error) {
      console.error("[Reports] base query failed:", baseResult.error);
      setFetchError(`Could not load reports: ${baseResult.error.message}`);
      setLoading(false);
      return;
    }
    if (!baseResult.data) { setLoading(false); return; }

    let rows: DBReport[] = (baseResult.data as any[]).map((r: any) => ({ ...r }));

    // Step 2: newer optional columns (reported_user_id, reported_post_id) — silently ignored if missing
    const { data: extraCols } = await supabase
      .from("reports")
      .select("id, reported_user_id, reported_post_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (extraCols) {
      const extraMap = new Map((extraCols as any[]).map((r: any) => [r.id, r]));
      rows = rows.map(r => ({ ...r, ...(extraMap.get(r.id) ?? {}) }));
    }

    // Step 3: enrich with joined profile names — silently ignored on error
    const { data: richData } = await supabase
      .from("reports")
      .select(`
        id,
        reporter:profiles!reported_by(full_name, email),
        reported_user:profiles!reported_user_id(full_name, email, is_admin, account_status)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (richData) {
      const richMap = new Map((richData as any[]).map((r: any) => [r.id, r]));
      rows = rows.map(r => ({ ...r, ...(richMap.get(r.id) ?? {}) }));
    }

    // Step 4: try to get post content — silently ignored if reported_post_id missing
    const { data: postData } = await supabase
      .from("reports")
      .select("id, reported_post_id, post:posts!reported_post_id(content, created_at)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (postData) {
      const postMap = new Map((postData as any[]).map((r: any) => [r.id, r]));
      rows = rows.map(r => ({ ...r, ...(postMap.get(r.id) ?? {}) }));
    }

    setReports(rows);
    // treat null/undefined status as "pending" (same logic as the badge query)
    setPendingCount(rows.filter(r => !r.status || r.status === "pending").length);
    setResolvedCount(rows.filter(r => r.status === "resolved").length);
    setDismissedCount(rows.filter(r => r.status === "dismissed").length);
    setSelected(prev => prev ? (rows.find(r => r.id === prev.id) ?? null) : null);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    // Realtime: new reports or status changes
    if (!isSupabaseConfigured) return;
    const ch = supabase
      .channel("admin-reports-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        fetchReports();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const statusStyle = (s: string | null) => ({
    pending:   "bg-amber-50 text-amber-700",
    resolved:  "bg-emerald-50 text-emerald-700",
    dismissed: "bg-slate-100 text-slate-500",
  }[s ?? ""] ?? "bg-amber-50 text-amber-700");

  const typeLabel = (t: string) => ({
    user:    "User",
    message: "Message",
    post:    "Community Post",
  }[t] ?? t);

  const typeColor = (t: string) => ({
    user:    "bg-violet-50 text-violet-700",
    message: "bg-sky-50 text-sky-700",
    post:    "bg-amber-50 text-amber-700",
  }[t] ?? "bg-slate-100 text-slate-600");

  const updateStatus = async (id: string, status: string) => {
    if (!isSupabaseConfigured) return;
    await supabase.from("reports").update({ status }).eq("id", id);
    await fetchReports();
  };

  const moderateUser = async (
    report: DBReport,
    action: "suspend" | "ban" | "resolve" | "dismiss"
  ) => {
    if (!isSupabaseConfigured) return;
    // suspend/ban require a reported_user_id — resolve/dismiss do not
    if (action === "suspend" || action === "ban") {
      if (!report.reported_user_id) return;
      const target = report.reported_user;
      if (target?.is_admin) {
        alert("Cannot suspend or ban an administrator.");
        return;
      }
      const msg = action === "ban"
        ? `Are you sure you want to BAN this user? This will permanently restrict their access to TCUnnect.`
        : `Are you sure you want to SUSPEND this user? They will be temporarily restricted from using TCUnnect.`;
      if (!window.confirm(msg)) return;
    }
    setActing(true);
    if (action === "suspend") {
      await supabase.from("profiles").update({ account_status: "suspended" }).eq("id", report.reported_user_id);
      await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id);
    } else if (action === "ban") {
      await supabase.from("profiles").update({ account_status: "banned" }).eq("id", report.reported_user_id);
      await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id);
    } else if (action === "resolve") {
      await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id);
    } else {
      await supabase.from("reports").update({ status: "dismissed" }).eq("id", report.id);
    }
    setActing(false);
    await fetchReports();
  };

  // Detail panel
  if (selected) {
    const r = selected;
    const ru = r.reported_user;
    const reporter = r.reporter;
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-sky-600 hover:underline">
          ← Back to Reports
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${typeColor(r.reported_item_type)}`}>
                {typeLabel(r.reported_item_type)}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(r.status)}`}>
                {r.status ?? "pending"}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(r.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Reporter */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reporter</p>
            <p className="text-sm font-medium text-slate-800">{reporter?.full_name ?? "Unknown"}</p>
            <p className="text-xs text-slate-500">{reporter?.email ?? "—"}</p>
          </div>

          {/* Reported User */}
          {ru && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reported User</p>
              <p className="text-sm font-medium text-slate-800">{ru.full_name ?? "Unknown"}</p>
              <p className="text-xs text-slate-500">{ru.email ?? "—"}</p>
              {ru.is_admin && (
                <span className="inline-block mt-1 text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
              )}
              <span className={`inline-block mt-1 ml-1 text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                ru.account_status === "banned" ? "bg-red-100 text-red-700"
                : ru.account_status === "suspended" ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
              }`}>{ru.account_status ?? "active"}</span>
            </div>
          )}

          {/* Message content */}
          {r.reported_item_type === "message" && r.message_content && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reported Message</p>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm text-slate-700 italic">
                "{r.message_content}"
              </div>
            </div>
          )}

          {/* Community post content */}
          {r.reported_item_type === "post" && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reported Post</p>
              {r.post ? (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm text-slate-700">
                  {r.post.content ?? "—"}
                  {r.post.created_at && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Posted {new Date(r.post.created_at).toLocaleDateString("en-PH")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Post has been deleted.</p>
              )}
            </div>
          )}

          {/* Reason + details */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reason</p>
            <p className="text-sm text-slate-800">{r.reason ?? "—"}</p>
            {r.details && <p className="text-xs text-slate-500 mt-1">{r.details}</p>}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-2">
            {(!r.status || r.status === "pending") && (
              <>
                {r.reported_item_type === "user" && ru && !ru.is_admin && (
                  <>
                    {ru.account_status !== "suspended" && ru.account_status !== "banned" && (
                      <button onClick={() => moderateUser(r, "suspend")} disabled={acting}
                        className="px-3 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50 transition">
                        {acting ? "…" : "Suspend User"}
                      </button>
                    )}
                    {ru.account_status !== "banned" && (
                      <button onClick={() => moderateUser(r, "ban")} disabled={acting}
                        className="px-3 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition">
                        {acting ? "…" : "Ban User"}
                      </button>
                    )}
                  </>
                )}
                <button onClick={() => moderateUser(r, "resolve")} disabled={acting}
                  className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition">
                  {acting ? "…" : "Resolve Report"}
                </button>
                <button onClick={() => moderateUser(r, "dismiss")} disabled={acting}
                  className="px-3 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg disabled:opacity-50 transition">
                  {acting ? "…" : "Dismiss Report"}
                </button>
              </>
            )}
            {r.status === "resolved" && (
              <span className="text-xs text-emerald-600 font-semibold">✓ Report resolved</span>
            )}
            {r.status === "dismissed" && (
              <span className="text-xs text-slate-400 font-semibold">Report dismissed</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={TrendingUp}    label="Total Reports" value={reports.length}  color="rose" />
        <StatCard icon={AlertCircle}   label="Pending"       value={pendingCount}    color="amber" />
        <StatCard icon={CheckCircle2}  label="Resolved"      value={resolvedCount}   color="emerald" />
        <StatCard icon={XCircle}       label="Dismissed"     value={dismissedCount}  color="slate" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No reports filed yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Reporter", "Type", "Reported", "Reason", "Date", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800 text-xs">
                    {r.reporter?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor(r.reported_item_type)}`}>
                      {typeLabel(r.reported_item_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {r.reported_user?.full_name ?? (r.reported_item_type === "post" ? "Post" : "—")}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-[140px] truncate">{r.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(r.status)}`}>
                      {r.status ?? "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(r)}
                        className="text-xs text-sky-600 hover:underline font-medium">
                        View
                      </button>
                      {(!r.status || r.status === "pending") && (
                        <>
                          <button onClick={() => updateStatus(r.id, "resolved")}
                            className="text-xs text-emerald-600 hover:underline">Resolve</button>
                          <button onClick={() => updateStatus(r.id, "dismissed")}
                            className="text-xs text-slate-400 hover:underline">Dismiss</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function QRUploader({
  label, currentUrl, storageKey, onUploaded,
}: { label: string; currentUrl: string; storageKey: string; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    const ext  = file.name.split(".").pop() ?? "png";
    const path = `qr/${storageKey}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("platform-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setErr(upErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("platform-assets").getPublicUrl(path);
    // append cache-buster so old QR doesn't stick
    onUploaded(`${urlData.publicUrl}?t=${Date.now()}`);
    setUploading(false);
    // reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold text-slate-500 text-center">{label}</p>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className={`relative w-28 h-28 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition
          ${uploading ? "border-sky-300 bg-sky-50" : "border-slate-200 hover:border-sky-400 hover:bg-sky-50 bg-slate-50"}`}
      >
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <Image className="h-7 w-7" />
            <span className="text-[10px]">Upload QR</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => !uploading && fileRef.current?.click()}
        className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold">
        {currentUrl ? "Change QR" : "Upload QR"}
      </button>
      {err && <p className="text-[10px] text-red-500 text-center">{err}</p>}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [draft, setDraft] = useState<Partial<PlatformSettings>>({});
  // live QR URLs — updated immediately after upload so preview refreshes
  const [gcashQr, setGcashQr] = useState("");
  const [mayaQr,  setMayaQr]  = useState("");

  const fetchSettings = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data } = await supabase.from("platform_settings").select("*").eq("id", true).single();
    if (data) {
      setSettings(data as PlatformSettings);
      setDraft({
        gcash_number: data.gcash_number,
        maya_number:  data.maya_number,
        account_name: data.account_name,
      });
      setGcashQr(data.gcash_qr_url ?? "");
      setMayaQr(data.maya_qr_url   ?? "");
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const toggle = async (field: keyof PlatformSettings) => {
    if (!isSupabaseConfigured || !settings) return;
    const newVal = !settings[field];
    setSettings({ ...settings, [field]: newVal });
    await supabase.from("platform_settings").update({ [field]: newVal, updated_at: new Date().toISOString() }).eq("id", true);
  };

  const saveQr = async (field: "gcash_qr_url" | "maya_qr_url", url: string) => {
    if (!isSupabaseConfigured) return;
    if (field === "gcash_qr_url") setGcashQr(url);
    else setMayaQr(url);
    await supabase.from("platform_settings").update({ [field]: url, updated_at: new Date().toISOString() }).eq("id", true);
  };

  const savePaymentSettings = async () => {
    if (!isSupabaseConfigured || !settings) return;
    setSaving(true);
    await supabase.from("platform_settings").update({
      gcash_number:  draft.gcash_number ?? settings.gcash_number,
      maya_number:   draft.maya_number  ?? settings.maya_number,
      account_name:  draft.account_name ?? settings.account_name,
      updated_at: new Date().toISOString(),
    }).eq("id", true);
    await fetchSettings();
    setSaving(false);
    setSaved(true);
    setEditingPayment(false);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!settings) return <div className="text-sm text-slate-400 text-center py-12">Platform settings not found. Run sql/09_admin_platform.sql first.</div>;

  const toggles: { label: string; key: keyof PlatformSettings; description: string }[] = [
    { label: "Allow new user registrations", key: "allow_user_registrations", description: "When off, new sign-ups are blocked on the Sign Up page." },
    { label: "Enable community posts",       key: "enable_community_posts",    description: "When off, users cannot create new posts in Community." },
  ];

  return (
    <div className="space-y-4 max-w-xl">
      {/* Platform toggles */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Platform Settings</h3>
        {toggles.map(s => (
          <div key={s.key} className="flex items-start gap-3">
            <div className="flex-1">
              <span className="text-sm text-slate-700 font-medium">{s.label}</span>
              <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>
            </div>
            <button
              onClick={() => toggle(s.key)}
              className={`relative flex-shrink-0 inline-block w-10 h-6 rounded-full transition-colors mt-0.5 ${
                settings[s.key] ? "bg-sky-500" : "bg-slate-200"
              }`}>
              <span className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full shadow transition-transform ${
                settings[s.key] ? "translate-x-4" : ""
              }`} />
            </button>
          </div>
        ))}
      </div>

      {/* Payment settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Payment Settings</h3>
          {saved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>

        {/* QR codes row */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Payment QR Codes</p>
          <div className="flex gap-6 justify-start">
            <QRUploader
              label="GCash QR"
              currentUrl={gcashQr}
              storageKey="gcash"
              onUploaded={url => saveQr("gcash_qr_url", url)}
            />
            <QRUploader
              label="Maya QR"
              currentUrl={mayaQr}
              storageKey="maya"
              onUploaded={url => saveQr("maya_qr_url", url)}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            These QR codes are shown to users on the Premium upgrade page. Upload PNG or JPG.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Account Details</p>
          {editingPayment ? (
            <div className="space-y-3">
              {[
                { label: "GCash Number", key: "gcash_number" as const, placeholder: "09XX-XXX-XXXX" },
                { label: "Maya Number",  key: "maya_number"  as const, placeholder: "09XX-XXX-XXXX" },
                { label: "Account Name", key: "account_name" as const, placeholder: "TCUnnect Official" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                  <input
                    value={draft[f.key] ?? ""}
                    onChange={e => setDraft({ ...draft, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={savePaymentSettings} disabled={saving}
                  className="flex items-center gap-1.5 text-sm bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
                <button onClick={() => setEditingPayment(false)}
                  className="text-sm text-slate-500 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">GCash Number</span>
                  <span className="font-medium text-slate-800">{settings.gcash_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maya Number</span>
                  <span className="font-medium text-slate-800">{settings.maya_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name</span>
                  <span className="font-medium text-slate-800">{settings.account_name}</span>
                </div>
              </div>
              <button onClick={() => setEditingPayment(true)}
                className="mt-4 text-sm text-sky-600 hover:underline font-medium">
                Edit payment details
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Nav ─────────────────────────────────────────────────
const BASE_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { id: "users",         label: "Users",           icon: Users },
  { id: "businesses",    label: "Businesses",      icon: Briefcase },
  { id: "payments",      label: "Payments",        icon: CreditCard },
  { id: "subscriptions", label: "Subscriptions",   icon: Star },
  { id: "bookings",      label: "Bookings",        icon: BookOpen },
  { id: "gems",          label: "Hidden Gems",     icon: Gem },
  { id: "featured",      label: "Featured Places", icon: MapPin },
  { id: "reviews",       label: "Reviews",         icon: MessageSquare },
  { id: "reports",       label: "Reports",         icon: BarChart2 },
  { id: "settings",      label: "Settings",        icon: Settings },
];

const TAB_TITLES: Record<TabId, string> = {
  dashboard: "Dashboard", users: "User Management", businesses: "Business Management",
  payments: "Payment Verification", subscriptions: "Subscriptions", bookings: "Bookings",
  gems: "Hidden Gems", featured: "Featured Places", reviews: "Reviews & Moderation",
  reports: "Reports", settings: "System Settings",
};

// ─── Main Component ───────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAllRead, addNotification } = useNotificationStore();
  const [activeTab, setActiveTab]   = useState<TabId>("dashboard");
  const [showBell, setShowBell]     = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [badges, setBadges]         = useState({ payments: 0, gems: 0, reports: 0 });
  const [dashStats, setDashStats]   = useState<DashStats>({
    users: 0, bookings: 0, revenue: 0, pendingPayments: 0,
    pendingGems: 0, approvedGems: 0, premiumUsers: 0, reports: 0,
  });
  const [dashLoading, setDashLoading] = useState(true);

  // Guard — non-admin users get bounced
  useEffect(() => {
    if (!user?.isAdmin) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // Load dashboard stats
  useEffect(() => {
    if (!isSupabaseConfigured) { setDashLoading(false); return; }
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("amount").eq("status", "approved"),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("hidden_gems").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("hidden_gems").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
      supabase.from("reports").select("id", { count: "exact", head: true }),
      supabase.from("reports").select("id", { count: "exact", head: true }).or("status.is.null,status.eq.pending"),
    ]).then(([users, bookings, revenue, pendPay, pendGems, appGems, prem, reps, pendReps]) => {
      const totalRevenue = (revenue.data ?? []).reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0);
      setDashStats({
        users:           users.count ?? 0,
        bookings:        bookings.count ?? 0,
        revenue:         totalRevenue,
        pendingPayments: pendPay.count ?? 0,
        pendingGems:     pendGems.count ?? 0,
        approvedGems:    appGems.count ?? 0,
        premiumUsers:    prem.count ?? 0,
        reports:         reps.count ?? 0,
      });
      setBadges({ payments: pendPay.count ?? 0, gems: pendGems.count ?? 0, reports: pendReps.count ?? 0 });
      setDashLoading(false);
    });
  }, []);

  // Realtime notification subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    const channel = supabase
      .channel(`admin-notifs-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const n = payload.new as any;
        addNotification({
          id:        n.id,
          type:      n.type,
          title:     n.title,
          body:      n.body ?? n.message ?? "",
          read:      n.read ?? false,
          createdAt: n.created_at,
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Realtime: keep reports badge live — count pending + null-status rows together
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const refreshReportsBadge = async () => {
      // Count rows where status IS NULL or status = 'pending' (same logic as Reports tab pendingCount)
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .or("status.is.null,status.eq.pending");
      setBadges(b => ({ ...b, reports: count ?? 0 }));
    };
    // Run once immediately so badge is correct on load
    refreshReportsBadge();
    const ch = supabase
      .channel("admin-reports-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, refreshReportsBadge)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/"); };

  const TABS = BASE_TABS.map(t => ({
    ...t,
    badge: t.id === "payments" ? badges.payments
         : t.id === "gems"     ? badges.gems
         : t.id === "reports"  ? badges.reports
         : undefined,
  }));

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":     return <DashboardTab stats={dashStats} loading={dashLoading} />;
      case "users":         return <UsersTab />;
      case "businesses":    return <BusinessesTab />;
      case "payments":      return <PaymentsTab onBadgeChange={n => setBadges(b => ({ ...b, payments: n }))} />;
      case "subscriptions": return <SubscriptionsTab />;
      case "bookings":      return <BookingsTab />;
      case "gems":          return <GemsTab onBadgeChange={n => setBadges(b => ({ ...b, gems: n }))} />;
      case "featured":      return <FeaturedTab />;
      case "reviews":       return <ReviewsTab />;
      case "reports":       return <ReportsTab />;
      case "settings":      return <SettingsTab />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Compass className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-white">TC<span className="text-sky-400">U</span>nnect</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              <t.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">{t.label}</span>
              {!!t.badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === t.id ? "bg-white/20 text-white" : "bg-amber-400 text-slate-900"
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Admin profile */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.fullName?.charAt(0) ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName ?? "Admin"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">Administrator</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/dashboard")}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg py-2 transition">
              <Home className="h-3.5 w-3.5" /> App
            </button>
            <button onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500 rounded-lg py-2 transition">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{TAB_TITLES[activeTab]}</h1>
            <p className="text-xs text-slate-400 mt-0.5">TCUnnect Admin · {new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => { setShowBell(v => !v); if (unreadCount > 0) markAllRead(); }}
                className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full" />
                )}
              </button>

              {showBell && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                    {notifications.length > 0 && (
                      <button onClick={markAllRead} className="text-xs text-sky-600 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-sm">No notifications yet</div>
                    ) : (
                      notifications.slice(0, 20).map(n => (
                        <div key={n.id}
                          className={`px-4 py-3 ${!n.read ? "bg-sky-50/50" : ""}`}>
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="h-2 w-2 mt-1.5 rounded-full bg-sky-500 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{n.body}</p>
                              <p className="text-[10px] text-slate-300 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => navigate("/dashboard")}
              className="text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition font-medium">
              View App
            </button>
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
