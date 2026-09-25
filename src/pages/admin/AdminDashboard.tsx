import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores";
import {
  LayoutDashboard, Users, CreditCard, Gem, BookOpen, BarChart2,
  Settings, Bell, LogOut, ChevronRight, Check, X, Eye, Shield,
  Clock, TrendingUp, AlertCircle, CheckCircle2, XCircle, FileText,
  Image, Search, Download, MessageSquare, Compass, Home, Loader2,
  Flag, Heart, Upload, QrCode,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

// ─── Types ───────────────────────────────────────────────────────
type TabId =
  | "dashboard" | "users" | "payments" | "bookings"
  | "gems" | "reviews" | "reports" | "settings";

// ─── CSV Export Helper ────────────────────────────────────────────
function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape), ...rows.map(r => r.map(escape))].map(r => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ──────────────────────────────────────────────────────
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

// ─── Admin Notification Bell ──────────────────────────────────────
function AdminBell() {
  const { user } = useAuthStore();
  const [count, setCount]       = useState(0);
  const [notifs, setNotifs]     = useState<any[]>([]);
  const [open, setOpen]         = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;
    // fetch admin's own unread notifications
    supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setNotifs(data ?? []);
        setCount((data ?? []).filter((n: any) => !n.read).length);
      });
  }, [user?.id]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    if (!isSupabaseConfigured || !user?.id) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    setCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-sky-600 hover:underline">Mark all read</button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No notifications</div>
            ) : notifs.map(n => (
              <div key={n.id} className={`px-4 py-3 ${n.read ? "" : "bg-sky-50/60"}`}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-sky-500 mt-1 flex-shrink-0" />}
                  <div className={!n.read ? "" : "pl-4"}>
                    <p className="text-sm font-medium text-slate-800 leading-snug">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-slate-300 mt-1">{fmtDate(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
        <StatCard icon={Users}      label="Total Users"     value={stats.users.toLocaleString()}    sub="registered profiles"    color="sky"     />
        <StatCard icon={BookOpen}   label="Bookings"        value={stats.bookings.toLocaleString()} sub="all time"               color="amber"   />
        <StatCard icon={CreditCard} label="Revenue"         value={`₱${stats.revenue.toLocaleString()}`} sub="verified payments" color="emerald" />
        <StatCard icon={Heart}      label="Matches"         value={stats.totalMatches.toLocaleString()} sub="travel connections" color="rose"    />
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
              { label: "Premium users",        value: stats.premiumUsers.toLocaleString() },
              { label: "Approved hidden gems", value: stats.gemsApproved.toLocaleString() },
              { label: "Community posts",      value: stats.totalPosts.toLocaleString() },
              { label: "Total travel matches", value: stats.totalMatches.toLocaleString() },
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
  const [search, setSearch]       = useState("");
  const [users, setUsers]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase
      .from("profiles")
      .select("id, full_name, email, location, bio, is_premium, is_verified, is_admin, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email     ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = async () => {
    setExporting(true);
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, location, is_premium, is_verified, is_admin, created_at")
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map(u => [
      u.full_name ?? "", u.email ?? "", u.location ?? "",
      u.is_premium ? "Premium" : "Free",
      u.is_verified ? "Yes" : "No",
      u.is_admin ? "Yes" : "No",
      u.created_at ? new Date(u.created_at).toLocaleDateString("en-PH") : "",
    ]);
    exportCSV("tcunnect-users.csv", ["Name","Email","Location","Plan","Verified","Admin","Joined"], rows);
    setExporting(false);
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
          </div>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 disabled:opacity-50 transition">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
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
                <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selected?.id === u.id ? "bg-sky-50/40" : ""}`}
                  onClick={() => setSelected(u)}>
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
                    <button onClick={e => { e.stopPropagation(); setSelected(u); }}
                      className="flex items-center gap-1 text-xs text-sky-600 hover:underline font-medium">
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 self-start sticky top-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-800">User Details</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-col items-center gap-2 py-3 border-b border-slate-100">
            <div className="h-16 w-16 rounded-full bg-sky-600 flex items-center justify-center text-white text-2xl font-bold">
              {(selected.full_name ?? "U").charAt(0).toUpperCase()}
            </div>
            <p className="font-semibold text-slate-900 text-sm">{selected.full_name ?? "—"}</p>
            <p className="text-xs text-slate-400">{selected.email}</p>
            <div className="flex gap-1.5 mt-1 flex-wrap justify-center">
              {selected.is_premium && <Pill text="Premium" color="bg-sky-100 text-sky-700" />}
              {selected.is_verified && <Pill text="Verified" color="bg-emerald-100 text-emerald-700" />}
              {selected.is_admin && <Pill text="Admin" color="bg-amber-100 text-amber-700" />}
              {!selected.is_premium && !selected.is_verified && !selected.is_admin && <Pill text="Free User" color="bg-slate-100 text-slate-600" />}
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            {[
              ["Location", selected.location ?? "—"],
              ["Joined",   selected.created_at ? fmtDate(selected.created_at) : "—"],
              ["User ID",  selected.id?.slice(0, 8) + "…"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{v}</span>
              </div>
            ))}
          </div>
          {selected.bio && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 font-medium mb-1">Bio</p>
              <p className="text-xs text-slate-700 leading-relaxed">{selected.bio}</p>
            </div>
          )}
        </div>
      )}
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
                const name  = (p.profiles as any)?.full_name ?? "—";
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
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 self-start sticky top-0 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-800">Payment Detail</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-2.5 text-sm">
            {[
              ["User",   (selected.profiles as any)?.full_name ?? "—"],
              ["Email",  (selected.profiles as any)?.email ?? "—"],
              ["Amount", `₱${selected.amount}`],
              ["Method", selected.method],
              ["Date",   fmtDate(selected.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800 text-right">{v}</span>
              </div>
            ))}
          </div>

          {/* Receipt image */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Payment Receipt</p>
            {selected.receipt_url ? (
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={selected.receipt_url}
                    alt="Payment receipt"
                    className="w-full object-contain max-h-64"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <a href={selected.receipt_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-sky-600 hover:underline font-medium">
                  <Eye className="h-3 w-3" /> Open full receipt
                </a>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center gap-2 bg-slate-50">
                <Image className="h-7 w-7 text-slate-300" />
                <p className="text-xs text-slate-400 text-center">No receipt uploaded yet</p>
              </div>
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
        const reporter  = (r.profiles as any)?.full_name ?? r.reported_by ?? "Anonymous";
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

// ─── Analytics Tab ────────────────────────────────────────────────
function ReportsTab() {
  const [stats, setStats]     = useState({ revenue: 0, newUsers: 0, prevUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const now = new Date();
    const m1s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const m2s = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const m2e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
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

  const handleExport = async (type: string) => {
    if (!isSupabaseConfigured) return;
    setExporting(type);
    try {
      if (type === "Users Report") {
        const { data } = await supabase.from("profiles")
          .select("full_name, email, location, is_premium, is_verified, is_admin, created_at")
          .order("created_at", { ascending: false });
        exportCSV("users-report.csv",
          ["Name","Email","Location","Plan","Verified","Admin","Joined"],
          (data ?? []).map(u => [u.full_name ?? "", u.email ?? "", u.location ?? "",
            u.is_premium ? "Premium" : "Free", u.is_verified ? "Yes" : "No",
            u.is_admin ? "Yes" : "No",
            u.created_at ? new Date(u.created_at).toLocaleDateString("en-PH") : ""]));
      } else if (type === "Revenue Report") {
        const { data } = await supabase.from("payments")
          .select("amount, method, status, created_at, profiles(full_name, email)")
          .order("created_at", { ascending: false });
        exportCSV("revenue-report.csv",
          ["User","Email","Amount (₱)","Method","Status","Date"],
          (data ?? []).map(p => [
            (p.profiles as any)?.full_name ?? "", (p.profiles as any)?.email ?? "",
            p.amount, p.method, p.status,
            p.created_at ? new Date(p.created_at).toLocaleDateString("en-PH") : ""]));
      } else if (type === "Bookings Report") {
        const { data } = await supabase.from("bookings")
          .select("gem_name, trip_type, date, guests, status, created_at, profiles(full_name)")
          .order("created_at", { ascending: false });
        exportCSV("bookings-report.csv",
          ["Tourist","Destination","Trip Type","Date","Guests","Status","Booked On"],
          (data ?? []).map(b => [
            (b.profiles as any)?.full_name ?? "", b.gem_name ?? "", b.trip_type ?? "",
            b.date ?? "", b.guests ?? "", b.status,
            b.created_at ? new Date(b.created_at).toLocaleDateString("en-PH") : ""]));
      } else if (type === "Gems Report") {
        const { data } = await supabase.from("hidden_gems")
          .select("name, location, category, status, is_featured, submitted_by, created_at")
          .order("created_at", { ascending: false });
        exportCSV("gems-report.csv",
          ["Name","Location","Category","Status","Featured","Submitted By","Date"],
          (data ?? []).map(g => [
            g.name, g.location ?? "", g.category ?? "", g.status,
            g.is_featured ? "Yes" : "No", g.submitted_by ?? "",
            g.created_at ? new Date(g.created_at).toLocaleDateString("en-PH") : ""]));
      }
    } finally {
      setExporting(null);
    }
  };

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
        <h3 className="font-semibold text-slate-800 mb-1">Export Reports</h3>
        <p className="text-xs text-slate-400 mb-4">Download live data as CSV files you can open in Excel or Google Sheets.</p>
        <div className="grid grid-cols-2 gap-3">
          {["Users Report","Revenue Report","Bookings Report","Gems Report"].map(r => (
            <button key={r} onClick={() => handleExport(r)} disabled={exporting === r}
              className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-xl px-4 py-3 hover:bg-slate-50 hover:border-sky-200 transition disabled:opacity-50">
              {exporting === r
                ? <Loader2 className="h-4 w-4 text-sky-500 animate-spin" />
                : <FileText className="h-4 w-4 text-slate-400" />}
              <span className="flex-1 text-left">{r}</span>
              <Download className="h-4 w-4 text-slate-300 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────
const SETTINGS_KEY = "tcunnect_payment_settings";

function SettingsTab() {
  const [gcash, setGcash]       = useState("");
  const [maya, setMaya]         = useState("");
  const [accName, setAccName]   = useState("");
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setGcash(s.gcash ?? "");
        setMaya(s.maya ?? "");
        setAccName(s.accName ?? "");
        setQrPreview(s.qrPreview ?? null);
      }
    } catch {}
  }, []);

  const handleSave = () => {
    const data = { gcash, maya, accName, qrPreview };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleQR = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQrPreview(ev.target?.result as string ?? null);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Platform Settings</h3>
        <p className="text-xs text-slate-400 mb-4">Core platform features managed via Supabase environment config.</p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> User registrations enabled</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Community posts enabled</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Hidden gem submissions open</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Payment Settings</h3>
        <p className="text-xs text-slate-400 mb-4">
          Configure your GCash / Maya numbers shown to users when they pay. Saved locally on this device.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Account Name</label>
            <input value={accName} onChange={e => setAccName(e.target.value)} placeholder="TCUnnect Official"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">GCash Number</label>
            <input value={gcash} onChange={e => setGcash(e.target.value)} placeholder="09XX-XXX-XXXX"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Maya Number</label>
            <input value={maya} onChange={e => setMaya(e.target.value)} placeholder="09XX-XXX-XXXX"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
          </div>
        </div>

        {/* GCash QR Code upload */}
        <div className="mt-4">
          <label className="text-xs text-slate-500 mb-2 block font-medium">GCash QR Code</label>
          <p className="text-xs text-slate-400 mb-3">
            Upload your GCash QR code. Users will see this when paying — they can scan it directly from the screen.
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative rounded-xl border-2 border-dashed border-slate-200 hover:border-sky-300 transition cursor-pointer overflow-hidden bg-slate-50 hover:bg-sky-50/30"
          >
            {qrPreview ? (
              <div className="flex flex-col items-center gap-2 p-4">
                <img src={qrPreview} alt="GCash QR Code" className="max-h-48 object-contain rounded-lg" />
                <span className="text-xs text-sky-600 font-medium">Click to change QR code</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                {uploading
                  ? <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
                  : <QrCode className="h-8 w-8 text-slate-300" />}
                <p className="text-xs text-slate-400">Click to upload QR code image</p>
                <p className="text-[10px] text-slate-300">PNG, JPG, or WEBP</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleQR} className="hidden" />
        </div>

        <button onClick={handleSave}
          className={`mt-4 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition ${
            saved ? "bg-emerald-600 text-white" : "bg-sky-600 hover:bg-sky-700 text-white"
          }`}>
          {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : "Save Payment Details"}
        </button>
      </div>

      {/* Preview card */}
      {(gcash || maya || qrPreview) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm">Preview — What users will see</h3>
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
            {qrPreview && (
              <div className="flex justify-center mb-3">
                <img src={qrPreview} alt="QR" className="h-32 w-32 object-contain rounded-lg border border-white shadow" />
              </div>
            )}
            <p className="text-sm font-semibold text-slate-800 text-center">{accName || "TCUnnect Official"}</p>
            {gcash && <p className="text-xs text-slate-600 text-center mt-1">GCash: <span className="font-medium">{gcash}</span></p>}
            {maya  && <p className="text-xs text-slate-600 text-center">Maya: <span className="font-medium">{maya}</span></p>}
          </div>
        </div>
      )}
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
  const navigate             = useNavigate();
  const { user, logout }     = useAuthStore();
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
            <AdminBell />
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
