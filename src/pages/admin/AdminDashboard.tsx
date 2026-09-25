import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores";
import {
  LayoutDashboard, Users, CreditCard, Gem, BookOpen, BarChart2,
  Settings, Bell, LogOut, ChevronRight, Check, X, Eye, Shield,
  Clock, TrendingUp, AlertCircle, CheckCircle2, XCircle, FileText,
  Image, Search, Download, MessageSquare, Compass, Home, Loader2,
  Flag, Heart,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

// ─── Types ───────────────────────────────────────────────────────
type TabId =
  | "dashboard" | "users" | "payments" | "bookings"
  | "gems" | "reviews" | "reports" | "settings";

// ─── Helpers ──────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500", pending: "bg-amber-400", suspended: "bg-red-500",
    approved: "bg-emerald-500", rejected: "bg-red-500",
    published: "bg-emerald-500", confirmed: "bg-emerald-500", cancelled: "bg-red-500",
    resolved: "bg-emerald-500", dismissed: "bg-slate-400",
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
    slate:   "bg-slate-50 text-slate-500",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color] ?? colors.sky}`}>
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

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr><td colSpan={cols} className="text-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-slate-300 mx-auto" />
    </td></tr>
  );
}

function EmptyRow({ cols, message = "No data yet." }: { cols: number; message?: string }) {
  return (
    <tr><td colSpan={cols} className="text-center py-12 text-slate-400 text-sm">{message}</td></tr>
  );
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Dashboard Tab ────────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState({
    users: 0, bookings: 0, revenue: 0,
    pendingPayments: 0, pendingGems: 0, pendingReports: 0,
    premiumUsers: 0, gemsApproved: 0, totalPosts: 0, totalMatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("amount").eq("status", "approved"),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("hidden_gems").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true),
      supabase.from("hidden_gems").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("matches").select("*", { count: "exact", head: true }),
    ]).then(([users, bk, rev, pPay, pGems, pRep, prem, gems, posts, matches]) => {
      const revenue = (rev.data ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
      setStats({
        users:           users.count    ?? 0,
        bookings:        bk.count       ?? 0,
        revenue,
        pendingPayments: pPay.count     ?? 0,
        pendingGems:     pGems.count    ?? 0,
        pendingReports:  pRep.count     ?? 0,
        premiumUsers:    prem.count     ?? 0,
        gemsApproved:    gems.count     ?? 0,
        totalPosts:      posts.count    ?? 0,
        totalMatches:    matches.count  ?? 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Users"     value={stats.users.toLocaleString()}    sub="registered profiles"        color="sky"     />
        <StatCard icon={BookOpen}   label="Bookings"        value={stats.bookings.toLocaleString()} sub="all time"                   color="amber"   />
        <StatCard icon={CreditCard} label="Revenue"         value={`₱${stats.revenue.toLocaleString()}`} sub="verified payments"     color="emerald" />
        <StatCard icon={Heart}      label="Matches"         value={stats.totalMatches.toLocaleString()} sub="travel connections"     color="rose"    />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Pending Actions</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="text-slate-700 flex-1">{stats.pendingPayments} payment{stats.pendingPayments !== 1 ? "s" : ""} awaiting verification</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Gem className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span className="text-slate-700 flex-1">{stats.pendingGems} hidden gem submission{stats.pendingGems !== 1 ? "s" : ""} pending</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </li>
            <li className="flex items-center gap-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
              <span className="text-slate-700 flex-1">{stats.pendingReports} report{stats.pendingReports !== 1 ? "s" : ""} need moderation</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Platform Stats</h3>
          <ul className="space-y-3">
            {[
              { label: "Premium users",          value: stats.premiumUsers.toLocaleString() },
              { label: "Approved hidden gems",   value: stats.gemsApproved.toLocaleString() },
              { label: "Community posts",        value: stats.totalPosts.toLocaleString() },
              { label: "Total travel matches",   value: stats.totalMatches.toLocaleString() },
            ].map(s => (
              <li key={s.label} className="flex items-center justify-between text-sm">
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

// ─── Users Tab ────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch]   = useState("");
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("id, full_name, email, location, is_premium, is_verified, is_admin, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email     ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
        </div>
        <button className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["User","Location","Plan","Verified","Joined","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <LoadingRow cols={6} /> : filtered.length === 0 ? <EmptyRow cols={6} /> : filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{u.full_name ?? "—"}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.location ?? "—"}</td>
                <td className="px-4 py-3">
                  {u.is_premium
                    ? <Pill text="Premium" color="bg-sky-100 text-sky-700" />
                    : <Pill text="Free"    color="bg-slate-100 text-slate-600" />}
                </td>
                <td className="px-4 py-3">
                  {u.is_verified
                    ? <span className="text-emerald-600 text-xs font-semibold">✓ Verified</span>
                    : <span className="text-slate-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{u.created_at ? fmtDate(u.created_at) : "—"}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-sky-600 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────
function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [filter, setFilter]     = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("payments")
      .select("id, user_id, amount, method, receipt_url, status, created_at, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { setPayments(data ?? []); setLoading(false); });
  }, []);

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);

  const update = async (id: string, status: string) => {
    await supabase.from("payments").update({ status }).eq("id", id);
    setPayments(ps => ps.map(p => p.id === id ? { ...p, status } : p));
    setSelected((prev: any) => prev?.id === id ? { ...prev, status } : prev);
  };

  const statusStyle = (s: string) => ({
    pending:  "bg-amber-50 text-amber-700 border border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rejected: "bg-red-50 text-red-700 border border-red-200",
  }[s] ?? "bg-slate-100 text-slate-500 border border-slate-200");

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex gap-2">
          {(["all","pending","approved","rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize transition ${
                filter === f ? "bg-sky-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}>{f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["User","Amount","Method","Date","Status","Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <LoadingRow cols={6} /> : filtered.length === 0 ? <EmptyRow cols={6} message="No payments found." /> : filtered.map(p => {
                const name = (p.profiles as any)?.full_name ?? "—";
                const email = (p.profiles as any)?.email ?? "";
                return (
                  <tr key={p.id} onClick={() => setSelected(p)}
                    className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selected?.id === p.id ? "bg-sky-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{name}</div>
                      <div className="text-xs text-slate-400">{email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">₱{p.amount}</td>
                    <td className="px-4 py-3 text-slate-600">{p.method}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); setSelected(p); }}
                        className="flex items-center gap-1 text-xs text-sky-600 hover:underline font-medium">
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 self-start sticky top-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-800">Payment Detail</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-2.5 text-sm">
            {[
              ["User",   (selected.profiles as any)?.full_name ?? "—"],
              ["Amount", `₱${selected.amount}`],
              ["Method", selected.method],
              ["Date",   fmtDate(selected.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 flex flex-col items-center gap-2 bg-slate-50">
            <Image className="h-7 w-7 text-slate-300" />
            <p className="text-xs text-slate-400 text-center">
              {selected.receipt_url ? "Receipt uploaded" : "No receipt yet"}
            </p>
            {selected.receipt_url && (
              <a href={selected.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-sky-600 underline">Open receipt</a>
            )}
          </div>
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle(selected.status)}`}>
            {selected.status}
          </span>
          {selected.status === "pending" && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => update(selected.id, "approved")}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition">
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button onClick={() => update(selected.id, "rejected")}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition">
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
          {selected.status === "approved" && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg p-3 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> Payment approved.
            </div>
          )}
          {selected.status === "rejected" && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-3 text-xs">
              <XCircle className="h-4 w-4 flex-shrink-0" /> Payment rejected.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────
function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [counts, setCounts]     = useState({ confirmed: 0, pending: 0, cancelled: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("bookings")
        .select("id, gem_name, trip_type, date, guests, status, created_at, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("bookings").select("status"),
    ]).then(([rows, all]) => {
      setBookings(rows.data ?? []);
      const c = { confirmed: 0, pending: 0, cancelled: 0 };
      (all.data ?? []).forEach((b: any) => { if (b.status in c) c[b.status as keyof typeof c]++; });
      setCounts(c);
      setLoading(false);
    });
  }, []);

  const statusStyle = (s: string) => ({
    confirmed: "bg-emerald-50 text-emerald-700",
    pending:   "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
    completed: "bg-sky-50 text-sky-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={CheckCircle2} label="Confirmed" value={counts.confirmed.toLocaleString()} color="emerald" />
        <StatCard icon={Clock}        label="Pending"   value={counts.pending.toLocaleString()}   color="amber"   />
        <StatCard icon={XCircle}      label="Cancelled" value={counts.cancelled.toLocaleString()} color="rose"    />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Tourist","Destination","Trip Type","Date","Guests","Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <LoadingRow cols={6} /> : bookings.length === 0 ? <EmptyRow cols={6} /> : bookings.map(b => (
              <tr key={b.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{(b.profiles as any)?.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{b.gem_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500 capitalize">{b.trip_type ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{b.date ? fmtDate(b.date) : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{b.guests}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(b.status)}`}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Hidden Gems Tab ──────────────────────────────────────────────
function GemsTab() {
  const [gems, setGems]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("hidden_gems")
      .select("id, name, location, category, description, status, is_featured, submitted_by, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { setGems(data ?? []); setLoading(false); });
  }, []);

  const update = async (id: string, status: string) => {
    await supabase.from("hidden_gems").update({ status }).eq("id", id);
    setGems(gs => gs.map(g => g.id === id ? { ...g, status } : g));
  };

  const statusStyle = (s: string) => ({
    approved: "bg-emerald-50 text-emerald-700",
    pending:  "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Name","Location","Category","Submitted By","Date","Status","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <LoadingRow cols={7} /> : gems.length === 0 ? <EmptyRow cols={7} message="No gem submissions yet." /> : gems.map(g => (
              <tr key={g.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{g.name}</div>
                  {g.is_featured && <span className="text-[10px] text-amber-600 font-semibold">★ Featured</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{g.location}</td>
                <td className="px-4 py-3 text-slate-600">{g.category}</td>
                <td className="px-4 py-3 text-slate-600">{g.submitted_by ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{g.created_at ? fmtDate(g.created_at) : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(g.status)}`}>{g.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {g.status === "pending" && (
                      <>
                        <button onClick={() => update(g.id, "approved")} className="text-xs text-emerald-600 hover:underline font-medium">Approve</button>
                        <button onClick={() => update(g.id, "rejected")} className="text-xs text-rose-500 hover:underline font-medium">Reject</button>
                      </>
                    )}
                    {g.status !== "pending" && <span className="text-xs text-slate-400">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Reports / Moderation Tab ─────────────────────────────────────
function ReviewsTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("reports")
      .select("id, reported_by, reported_item_type, reported_item_id, reason, status, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => { setReports(data ?? []); setLoading(false); });
  }, []);

  const update = async (id: string, status: string) => {
    await supabase.from("reports").update({ status }).eq("id", id);
    setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  };

  const statusStyle = (s: string) => ({
    pending:   "bg-amber-50 text-amber-700",
    resolved:  "bg-emerald-50 text-emerald-700",
    dismissed: "bg-slate-100 text-slate-500",
  }[s] ?? "bg-slate-100 text-slate-600");

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>;
  if (reports.length === 0) return (
    <div className="text-center py-20">
      <Flag className="h-10 w-10 text-slate-200 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">No reports to moderate.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {reports.map(r => {
        const reporter = (r.profiles as any)?.full_name ?? r.reported_by ?? "Anonymous";
        const isPending = r.status === "pending";
        return (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-slate-800 text-sm">{reporter}</span>
                  <span className="text-slate-400 text-xs">reported a</span>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{r.reported_item_type}</span>
                  <span className="ml-auto text-xs text-slate-400">{r.created_at ? fmtDate(r.created_at) : ""}</span>
                </div>
                <p className={`text-sm mt-1 ${isPending ? "bg-amber-50 border border-amber-100 rounded p-2 text-slate-700" : "text-slate-600"}`}>
                  {r.reason}
                </p>
                <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(r.status)}`}>
                  {r.status}
                </span>
              </div>
              {isPending && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => update(r.id, "resolved")}
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-medium">Resolve</button>
                  <button onClick={() => update(r.id, "dismissed")}
                    className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-300 font-medium">Dismiss</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Reports / Analytics Tab ──────────────────────────────────────
function ReportsTab() {
  const [stats, setStats] = useState({ revenue: 0, newUsers: 0, prevUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const now  = new Date();
    const m1s  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const m2s  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const m2e  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    Promise.all([
      supabase.from("payments").select("amount").eq("status", "approved").gte("created_at", m1s),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", m1s),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", m2s).lte("created_at", m2e),
    ]).then(([rev, nu, pu]) => {
      const revenue = (rev.data ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
      setStats({ revenue, newUsers: nu.count ?? 0, prevUsers: pu.count ?? 0 });
      setLoading(false);
    });
  }, []);

  const month     = new Date().toLocaleDateString("en-PH", { month: "short", year: "numeric" });
  const prevMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toLocaleDateString("en-PH", { month: "short" });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={TrendingUp} label={`Revenue (${month})`}
          value={loading ? "—" : `₱${stats.revenue.toLocaleString()}`}
          sub="approved payments only" color="emerald" />
        <StatCard icon={Users} label={`New Users (${month})`}
          value={loading ? "—" : stats.newUsers}
          sub={`vs ${stats.prevUsers} in ${prevMonth}`} color="sky" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Export Reports</h3>
        <div className="grid grid-cols-2 gap-3">
          {["Users Report","Revenue Report","Bookings Report","Gems Report"].map(r => (
            <button key={r} className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 transition">
              <FileText className="h-4 w-4 text-slate-400" />
              <span>{r}</span>
              <Download className="h-4 w-4 text-slate-300 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────
function SettingsTab() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Platform Settings</h3>
        <p className="text-xs text-slate-400 mb-4">These settings are managed via Supabase environment variables and your admin config.</p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> User registrations enabled</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Community posts enabled</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Hidden gem submissions open</li>
        </ul>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Payment Settings</h3>
        <p className="text-xs text-slate-400 mb-3">Configure your GCash and Maya numbers for payment collection.</p>
        <div className="space-y-3">
          {[
            { label: "GCash Number", placeholder: "09XX-XXX-XXXX" },
            { label: "Maya Number",  placeholder: "09XX-XXX-XXXX" },
            { label: "Account Name", placeholder: "TCUnnect Official" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
              <input placeholder={f.placeholder}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
          ))}
        </div>
        <button className="mt-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          Save Payment Details
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { id: "users",     label: "Users",        icon: Users },
  { id: "payments",  label: "Payments",     icon: CreditCard },
  { id: "bookings",  label: "Bookings",     icon: BookOpen },
  { id: "gems",      label: "Hidden Gems",  icon: Gem },
  { id: "reviews",   label: "Reports",      icon: Flag },
  { id: "reports",   label: "Analytics",    icon: BarChart2 },
  { id: "settings",  label: "Settings",     icon: Settings },
];

const TAB_TITLES: Record<TabId, string> = {
  dashboard: "Dashboard",
  users:     "User Management",
  payments:  "Payment Verification",
  bookings:  "Bookings",
  gems:      "Hidden Gems",
  reviews:   "Reports & Moderation",
  reports:   "Analytics",
  settings:  "System Settings",
};

// ─── Main ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate   = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  useEffect(() => {
    if (!user?.isAdmin) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleLogout = async () => { await logout(); navigate("/"); };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "users":     return <UsersTab />;
      case "payments":  return <PaymentsTab />;
      case "bookings":  return <BookingsTab />;
      case "gems":      return <GemsTab />;
      case "reviews":   return <ReviewsTab />;
      case "reports":   return <ReportsTab />;
      case "settings":  return <SettingsTab />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col">
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
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === t.id ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              <t.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">{t.label}</span>
            </button>
          ))}
        </nav>
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

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{TAB_TITLES[activeTab]}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              TCUnnect Admin · {new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
              <Bell className="h-5 w-5" />
            </button>
            <button onClick={() => navigate("/dashboard")}
              className="text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition font-medium">
              View App
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
