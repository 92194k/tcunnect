import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useNotificationStore } from "../../stores";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import {
  LayoutDashboard, Users, Briefcase, CreditCard, Star, MapPin, Gem,
  BookOpen, BarChart2, Settings, Bell, LogOut, ChevronRight, Check,
  X, Eye, Shield, Clock, TrendingUp, AlertCircle, CheckCircle2,
  XCircle, FileText, RefreshCw, Search, Filter, Download,
  MessageSquare, Compass, Home, Image, Save, Loader2,
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
  status: PaymentStatus;
  created_at: string;
  profiles?: { full_name: string | null };
}

interface DBProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_premium: boolean;
  created_at: string;
  location: string | null;
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
  reason: string | null;
  status: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
}

interface PlatformSettings {
  allow_user_registrations: boolean;
  enable_community_posts: boolean;
  gcash_number: string;
  maya_number: string;
  account_name: string;
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

function UsersTab() {
  const [search, setSearch]   = useState("");
  const [users, setUsers]     = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("id, full_name, email, is_premium, created_at, location")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) setUsers(data as DBProfile[]);
        setLoading(false);
      });
  }, []);

  const filtered = users.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["User", "Email", "Plan", "Location", "Joined"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {u.is_premium
                      ? <Pill text="Plus" color="bg-sky-100 text-sky-700" />
                      : <Pill text="Free" color="bg-slate-100 text-slate-600" />}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.location ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
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
  return <NotImplemented feature="Business management" />;
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
    // 1. Update payment status
    await supabase.from("payments").update({ status: action, updated_at: new Date().toISOString() }).eq("id", payment.id);
    // 2. If approved, activate is_premium on user
    if (action === "approved") {
      await supabase.from("profiles").update({ is_premium: true }).eq("id", payment.user_id);
    }
    // 3. Notify the user directly (not through createNotification which would pollute admin store)
    await supabase.from("notifications").insert({
      user_id: payment.user_id,
      type: "system",
      title: action === "approved" ? "Payment Approved! 🎉" : "Payment Rejected",
      message: action === "approved"
        ? `Your ${payment.plan_label} payment has been verified. Your plan is now active!`
        : `Your ${payment.plan_label} payment was rejected. Please contact support if you believe this is an error.`,
      data: { payment_id: payment.id, plan_id: payment.plan_id },
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
                  {["Account", "Plan", "Amount", "Method", "Date", "Status", "Action"].map(h => (
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
          </div>

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
  tourist_name: string | null;
  gem_name: string | null;
  date: string | null;
  trip_type: string | null;
  guests: number | null;
  status: string;
  created_at: string;
}

function BookingsTab() {
  const [bookings, setBookings]         = useState<RealBooking[]>([]);
  const [loadingBookings, setLoading]   = useState(true);
  const [counts, setCounts]             = useState({ confirmed: 0, pending: 0, cancelled: 0 });

  useEffect(() => {
    async function fetchBookings() {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      const { data } = await supabase
        .from("bookings")
        .select(`id, gem_name, date, trip_type, guests, status, created_at, profiles ( full_name )`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) {
        const mapped: RealBooking[] = data.map((b: any) => ({
          id: b.id,
          tourist_name: b.profiles?.full_name ?? "—",
          gem_name:     b.gem_name ?? "—",
          date:         b.date ?? "—",
          trip_type:    b.trip_type ?? "—",
          guests:       b.guests ?? 1,
          status:       b.status ?? "pending",
          created_at:   b.created_at,
        }));
        setBookings(mapped);
        setCounts({
          confirmed: mapped.filter(b => b.status === "confirmed").length,
          pending:   mapped.filter(b => b.status === "pending").length,
          cancelled: mapped.filter(b => b.status === "cancelled").length,
        });
      }
      setLoading(false);
    }
    fetchBookings();
  }, []);

  const statusStyle = (s: string) => ({
    confirmed: "bg-emerald-50 text-emerald-700",
    pending:   "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={CheckCircle2} label="Confirmed" value={counts.confirmed} color="emerald" />
        <StatCard icon={Clock}        label="Pending"   value={counts.pending}   color="amber" />
        <StatCard icon={XCircle}      label="Cancelled" value={counts.cancelled} color="rose" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                {["Tourist", "Destination", "Date", "Type", "Guests", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{b.tourist_name}</td>
                  <td className="px-4 py-3 text-slate-600">{b.gem_name}</td>
                  <td className="px-4 py-3 text-slate-600">{b.date}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{b.trip_type}</td>
                  <td className="px-4 py-3 text-slate-600">{b.guests}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(b.status)}`}>
                      {b.status}
                    </span>
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

function GemsTab({ onBadgeChange }: { onBadgeChange: (n: number) => void }) {
  const [gems, setGems]       = useState<DBGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);

  const fetchGems = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data } = await supabase
      .from("hidden_gems")
      .select("id, name, location, category, status, created_at, submitted_by, is_featured, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) {
      setGems(data as DBGem[]);
      onBadgeChange((data as DBGem[]).filter(g => g.status === "pending").length);
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

  const statusStyle = (s: string) => ({
    approved: "bg-emerald-50 text-emerald-700",
    pending:  "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-4">
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

function ReviewsTab() {
  return <NotImplemented feature="Reviews moderation" />;
}

function ReportsTab() {
  const [reports, setReports] = useState<DBReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("reports")
      .select("id, reported_by, reason, status, created_at, profiles!reports_reported_by_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setReports(data as DBReport[]);
        setLoading(false);
      });
  }, []);

  const statusStyle = (s: string | null) => ({
    pending:  "bg-amber-50 text-amber-700",
    resolved: "bg-emerald-50 text-emerald-700",
    dismissed: "bg-slate-100 text-slate-500",
  }[s ?? ""] ?? "bg-amber-50 text-amber-700");

  const updateStatus = async (id: string, status: string) => {
    if (!isSupabaseConfigured) return;
    await supabase.from("reports").update({ status }).eq("id", id);
    setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={TrendingUp} label="Total Reports" value={reports.length} color="rose" />
        <StatCard icon={AlertCircle} label="Pending"
          value={reports.filter(r => !r.status || r.status === "pending").length} color="amber" />
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
                {["Reporter", "Reason", "Date", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{(r as any).profiles?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.reason ?? "—"}</td>
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

function SettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [draft, setDraft]       = useState<Partial<PlatformSettings>>({});

  const fetchSettings = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data } = await supabase.from("platform_settings").select("*").eq("id", true).single();
    if (data) {
      setSettings(data as PlatformSettings);
      setDraft({
        gcash_number:  data.gcash_number,
        maya_number:   data.maya_number,
        account_name:  data.account_name,
      });
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
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!settings) return <div className="text-sm text-slate-400 text-center py-12">Platform settings not found. Run sql/09_admin_platform.sql first.</div>;

  const toggles: { label: string; key: keyof PlatformSettings; description: string }[] = [
    { label: "Allow new user registrations", key: "allow_user_registrations", description: "When off, new sign-ups are blocked on the Sign Up page." },
    { label: "Enable community posts",       key: "enable_community_posts",    description: "When off, users cannot create new posts in Community." },
  ];

  return (
    <div className="space-y-4 max-w-lg">
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
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Payment Settings</h3>
          {saved && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
        {editingPayment ? (
          <div className="space-y-3">
            {[
              { label: "GCash Number", key: "gcash_number" as const },
              { label: "Maya Number",  key: "maya_number"  as const },
              { label: "Account Name", key: "account_name" as const },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                <input
                  value={draft[f.key] ?? ""}
                  onChange={e => setDraft({ ...draft, [f.key]: e.target.value })}
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
                className="text-sm text-slate-500 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50">
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
              className="mt-4 text-sm text-sky-600 hover:underline">
              Edit payment details
            </button>
          </>
        )}
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
  const [badges, setBadges]         = useState({ payments: 0, gems: 0 });
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
    ]).then(([users, bookings, revenue, pendPay, pendGems, appGems, prem, reps]) => {
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
      setBadges({ payments: pendPay.count ?? 0, gems: pendGems.count ?? 0 });
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
          message:   n.message,
          data:      n.data,
          read:      n.read ?? false,
          createdAt: n.created_at,
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

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
    badge: t.id === "payments" ? badges.payments : t.id === "gems" ? badges.gems : undefined,
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
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
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
