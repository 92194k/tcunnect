import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores";
import {
  LayoutDashboard, Users, Briefcase, CreditCard, Star, MapPin, Gem,
  BookOpen, BarChart2, Settings, Bell, LogOut, ChevronRight, Check,
  X, Eye, Shield, Clock, TrendingUp, AlertCircle, CheckCircle2,
  XCircle, FileText, Image, RefreshCw, Search, Filter, Download,
  MessageSquare, Compass, ChevronDown, ChevronUp, Home,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────
type TabId =
  | "dashboard" | "users" | "businesses" | "payments"
  | "subscriptions" | "bookings" | "gems" | "featured"
  | "reviews" | "reports" | "settings";

type PaymentStatus = "pending" | "verified" | "rejected";
type UserTier = "free" | "plus";
type BizTier = "biz_free" | "biz_plus" | "biz_pro" | "biz_partner";

interface MockPayment {
  id: string;
  type: "user" | "business";
  name: string;
  plan: string;
  amount: string;
  method: "GCash" | "Maya";
  ref: string;
  date: string;
  status: PaymentStatus;
  receiptUrl?: string;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  tier: UserTier;
  joined: string;
  location: string;
  bookings: number;
  status: "active" | "suspended";
}

interface MockBusiness {
  id: string;
  name: string;
  owner: string;
  email: string;
  tier: BizTier;
  category: string;
  location: string;
  status: "active" | "pending" | "suspended";
  joined: string;
}

interface MockGem {
  id: string;
  name: string;
  location: string;
  submittedBy: string;
  category: string;
  status: "published" | "pending" | "rejected";
  date: string;
}

interface MockBooking {
  id: string;
  tourist: string;
  gem: string;
  date: string;
  amount: string;
  status: "confirmed" | "pending" | "cancelled";
}

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_PAYMENTS: MockPayment[] = [
  { id: "p1", type: "user", name: "Maria Santos", plan: "TCUnnect Plus", amount: "₱30", method: "GCash", ref: "GC-2024-001", date: "Sep 23, 2026", status: "pending" },
  { id: "p2", type: "business", name: "Island Hopper Tours", plan: "Business Pro", amount: "₱599", method: "Maya", ref: "MY-2024-002", date: "Sep 22, 2026", status: "pending" },
  { id: "p3", type: "user", name: "Juan Dela Cruz", plan: "TCUnnect Plus", amount: "₱30", method: "GCash", ref: "GC-2024-003", date: "Sep 21, 2026", status: "verified" },
  { id: "p4", type: "business", name: "Palawan Adventure Co.", plan: "Business Plus", amount: "₱299", method: "GCash", ref: "GC-2024-004", date: "Sep 20, 2026", status: "verified" },
  { id: "p5", type: "user", name: "Ana Reyes", plan: "TCUnnect Plus", amount: "₱30", method: "Maya", ref: "MY-2024-005", date: "Sep 19, 2026", status: "rejected" },
];

const MOCK_USERS: MockUser[] = [
  { id: "u1", name: "Maria Santos", email: "maria@example.com", tier: "plus", joined: "Jan 2026", location: "Makati, NCR", bookings: 5, status: "active" },
  { id: "u2", name: "Juan Dela Cruz", email: "juan@example.com", tier: "free", joined: "Mar 2026", location: "Cebu City", bookings: 2, status: "active" },
  { id: "u3", name: "Ana Reyes", email: "ana@example.com", tier: "free", joined: "Jun 2026", location: "Davao City", bookings: 0, status: "active" },
  { id: "u4", name: "Pedro Cruz", email: "pedro@example.com", tier: "plus", joined: "Feb 2026", location: "Quezon City, NCR", bookings: 8, status: "suspended" },
  { id: "u5", name: "Rosa Lim", email: "rosa@example.com", tier: "free", joined: "Aug 2026", location: "Baguio City", bookings: 1, status: "active" },
];

const MOCK_BUSINESSES: MockBusiness[] = [
  { id: "b1", name: "Island Hopper Tours", owner: "Carlos Tan", email: "carlos@islandhopper.ph", tier: "biz_pro", category: "Tour Operator", location: "El Nido, Palawan", status: "active", joined: "Dec 2025" },
  { id: "b2", name: "Palawan Adventure Co.", owner: "Lisa Cruz", email: "lisa@palawanadvco.ph", tier: "biz_plus", category: "Adventure Sports", location: "Puerto Princesa, Palawan", status: "active", joined: "Feb 2026" },
  { id: "b3", name: "Siargao Surf Camp", owner: "Mike Bautista", email: "mike@siargaosurf.ph", tier: "biz_free", category: "Accommodation", location: "General Luna, Siargao", status: "pending", joined: "Sep 2026" },
  { id: "b4", name: "Heritage Tours PH", owner: "Elena Reyes", email: "elena@heritageph.com", tier: "biz_partner", category: "Cultural Tours", location: "Vigan City, Ilocos Sur", status: "active", joined: "Nov 2025" },
];

const MOCK_GEMS: MockGem[] = [
  { id: "g1", name: "Tinago Falls", location: "Iligan City, Lanao del Norte", submittedBy: "Maria Santos", category: "Waterfall", status: "pending", date: "Sep 22, 2026" },
  { id: "g2", name: "Naked Island", location: "Siargao, Surigao del Norte", submittedBy: "Juan Dela Cruz", category: "Beach", status: "published", date: "Sep 15, 2026" },
  { id: "g3", name: "Batad Rice Terraces", location: "Banaue, Ifugao", submittedBy: "Ana Reyes", category: "Heritage", status: "published", date: "Sep 10, 2026" },
  { id: "g4", name: "Kabigan Falls", location: "Pagudpud, Ilocos Norte", submittedBy: "Pedro Cruz", category: "Waterfall", status: "rejected", date: "Sep 5, 2026" },
];

const MOCK_BOOKINGS: MockBooking[] = [
  { id: "bk1", tourist: "Maria Santos", gem: "Chocolate Hills", date: "Oct 5, 2026", amount: "₱2,500", status: "confirmed" },
  { id: "bk2", tourist: "Juan Dela Cruz", gem: "El Nido Island Hopping", date: "Oct 12, 2026", amount: "₱3,800", status: "pending" },
  { id: "bk3", tourist: "Ana Reyes", gem: "Mayon Volcano Trek", date: "Sep 28, 2026", amount: "₱1,200", status: "confirmed" },
  { id: "bk4", tourist: "Pedro Cruz", gem: "Siargao Surf Lesson", date: "Sep 15, 2026", amount: "₱800", status: "cancelled" },
];

// ─── Helpers ──────────────────────────────────────────────────────
const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free:        { label: "Free",             color: "bg-slate-100 text-slate-600" },
  plus:        { label: "TCUnnect Plus",    color: "bg-sky-100 text-sky-700" },
  biz_free:    { label: "Business Free",    color: "bg-slate-100 text-slate-600" },
  biz_plus:    { label: "Business Plus",    color: "bg-violet-100 text-violet-700" },
  biz_pro:     { label: "Business Pro",     color: "bg-amber-100 text-amber-700" },
  biz_partner: { label: "Business Partner", color: "bg-emerald-100 text-emerald-700" },
};

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500", pending: "bg-amber-400", suspended: "bg-red-500",
    verified: "bg-emerald-500", rejected: "bg-red-500",
    published: "bg-emerald-500", confirmed: "bg-emerald-500", cancelled: "bg-red-500",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status] ?? "bg-slate-300"}`} />;
}

function Pill({ text, color }: { text: string; color: string }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{text}</span>;
}

function StatCard({ icon: Icon, label, value, sub, color = "sky" }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    sky: "bg-sky-50 text-sky-600", amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
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

// ─── Tab Panels ──────────────────────────────────────────────────

function DashboardTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value="12,847" sub="+234 this week" color="sky" />
        <StatCard icon={Briefcase} label="Businesses" value="428" sub="38 pending review" color="violet" />
        <StatCard icon={CreditCard} label="Revenue (Sep)" value="₱89,400" sub="GCash + Maya" color="emerald" />
        <StatCard icon={BookOpen} label="Bookings" value="1,203" sub="This month" color="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Pending Actions</h3>
          <ul className="space-y-3">
            {[
              { icon: CreditCard, text: "2 payment receipts awaiting verification", color: "text-amber-500", link: "payments" },
              { icon: Gem, text: "1 hidden gem submission pending review", color: "text-emerald-600", link: "gems" },
              { icon: Briefcase, text: "1 new business registration", color: "text-violet-600", link: "businesses" },
              { icon: AlertCircle, text: "3 reported reviews need moderation", color: "text-rose-500", link: "reviews" },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <item.icon className={`h-4 w-4 flex-shrink-0 ${item.color}`} />
                <span className="text-slate-700 flex-1">{item.text}</span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Platform Stats</h3>
          <ul className="space-y-3">
            {[
              { label: "Active Plus subscribers", value: "2,341" },
              { label: "Business Plus/Pro/Partner", value: "186" },
              { label: "Hidden Gems published", value: "847" },
              { label: "Featured places", value: "64" },
              { label: "Community posts this week", value: "1,208" },
              { label: "Avg. booking value", value: "₱2,180" },
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
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(MOCK_USERS);
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (id: string) => setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
        </div>
        <button className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50">
          <Filter className="h-4 w-4" /> Filter
        </button>
        <button className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["User", "Plan", "Location", "Bookings", "Joined", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{u.name}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Pill text={TIER_LABELS[u.tier].label} color={TIER_LABELS[u.tier].color} />
                </td>
                <td className="px-4 py-3 text-slate-600">{u.location}</td>
                <td className="px-4 py-3 text-slate-600">{u.bookings}</td>
                <td className="px-4 py-3 text-slate-600">{u.joined}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <StatusDot status={u.status} />
                    <span className="capitalize text-slate-600">{u.status}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-sky-600 hover:underline">View</button>
                    <button onClick={() => toggle(u.id)}
                      className={`text-xs ${u.status === "active" ? "text-rose-500 hover:underline" : "text-emerald-600 hover:underline"}`}>
                      {u.status === "active" ? "Suspend" : "Restore"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No users found.</div>
        )}
      </div>
    </div>
  );
}

function BusinessesTab() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_BUSINESSES.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.owner.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search businesses…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Business", "Owner", "Category", "Plan", "Location", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(b => (
              <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{b.name}</div>
                  <div className="text-xs text-slate-400">{b.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{b.owner}</td>
                <td className="px-4 py-3 text-slate-600">{b.category}</td>
                <td className="px-4 py-3">
                  <Pill text={TIER_LABELS[b.tier].label} color={TIER_LABELS[b.tier].color} />
                </td>
                <td className="px-4 py-3 text-slate-600">{b.location}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <StatusDot status={b.status} />
                    <span className="capitalize text-slate-600">{b.status}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-sky-600 hover:underline">View</button>
                    {b.status === "pending" && (
                      <button className="text-xs text-emerald-600 hover:underline">Approve</button>
                    )}
                    <button className="text-xs text-rose-500 hover:underline">Suspend</button>
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

function PaymentsTab() {
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [selected, setSelected] = useState<MockPayment | null>(null);
  const [filter, setFilter] = useState<PaymentStatus | "all">("all");

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);

  const verify = (id: string, action: "verified" | "rejected") => {
    setPayments(ps => ps.map(p => p.id === id ? { ...p, status: action } : p));
    setSelected(prev => prev?.id === id ? { ...prev, status: action } : prev);
  };

  const statusStyle = (s: PaymentStatus) => ({
    pending:  "bg-amber-50 text-amber-700 border border-amber-200",
    verified: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    rejected: "bg-red-50 text-red-700 border border-red-200",
  }[s]);

  return (
    <div className="flex gap-4 h-full">
      {/* List */}
      <div className="flex-1 space-y-3 min-w-0">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "pending", "verified", "rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize transition ${
                filter === f ? "bg-sky-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Account", "Plan", "Amount", "Method", "Ref #", "Date", "Status", "Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)}
                  className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selected?.id === p.id ? "bg-sky-50/50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{p.type} account</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.plan}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.amount}</td>
                  <td className="px-4 py-3 text-slate-600">{p.method}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.ref}</td>
                  <td className="px-4 py-3 text-slate-600">{p.date}</td>
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
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No payments found.</div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 self-start sticky top-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-800">Payment Detail</h3>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-2.5 text-sm">
            {[
              ["Account", selected.name],
              ["Type", selected.type.charAt(0).toUpperCase() + selected.type.slice(1)],
              ["Plan", selected.plan],
              ["Amount", selected.amount],
              ["Method", selected.method],
              ["Reference", selected.ref],
              ["Date", selected.date],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
          </div>

          {/* Receipt placeholder */}
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center gap-2 bg-slate-50">
            <Image className="h-8 w-8 text-slate-300" />
            <p className="text-xs text-slate-400 text-center">
              {selected.receiptUrl ? "View uploaded receipt" : "No receipt uploaded yet"}
            </p>
            {selected.receiptUrl && (
              <button className="text-xs text-sky-600 underline">Open receipt</button>
            )}
          </div>

          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle(selected.status)}`}>
            {selected.status}
          </span>

          {selected.status === "pending" && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => verify(selected.id, "verified")}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition">
                <Check className="h-3.5 w-3.5" /> Verify
              </button>
              <button onClick={() => verify(selected.id, "rejected")}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition">
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}

          {selected.status === "verified" && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg p-3 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Payment verified. Plan activated for user.
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { tier: "TCUnnect Plus", users: "2,341", revenue: "₱70,230/mo", color: "sky" },
          { tier: "Business Plus", users: "98", revenue: "₱29,302/mo", color: "violet" },
          { tier: "Business Pro", users: "62", revenue: "₱37,138/mo", color: "amber" },
          { tier: "Business Partner", users: "26", revenue: "Custom", color: "emerald" },
          { tier: "User Free", users: "10,506", revenue: "—", color: "slate" },
          { tier: "Business Free", users: "242", revenue: "—", color: "slate" },
        ].map(t => (
          <div key={t.tier} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">{t.tier}</p>
            <p className="text-3xl font-bold text-slate-900">{t.users}</p>
            <p className="text-xs text-slate-400 mt-1">{t.revenue}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Recent Upgrades</h3>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr>
              {["User / Business", "From", "To", "Date"].map(h => (
                <th key={h} className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[
              { name: "Maria Santos", from: "Free", to: "TCUnnect Plus", date: "Sep 23" },
              { name: "Island Hopper Tours", from: "Business Plus", to: "Business Pro", date: "Sep 22" },
              { name: "Juan Dela Cruz", from: "Free", to: "TCUnnect Plus", date: "Sep 21" },
            ].map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="py-3 font-medium text-slate-800">{r.name}</td>
                <td className="py-3 text-slate-500">{r.from}</td>
                <td className="py-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">{r.to}</span>
                </td>
                <td className="py-3 text-slate-500">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BookingsTab() {
  const statusStyle = (s: string) => ({
    confirmed: "bg-emerald-50 text-emerald-700",
    pending:   "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={CheckCircle2} label="Confirmed" value="843" color="emerald" />
        <StatCard icon={Clock} label="Pending" value="127" color="amber" />
        <StatCard icon={XCircle} label="Cancelled" value="233" color="rose" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Tourist", "Destination / Experience", "Date", "Amount", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_BOOKINGS.map(b => (
              <tr key={b.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{b.tourist}</td>
                <td className="px-4 py-3 text-slate-600">{b.gem}</td>
                <td className="px-4 py-3 text-slate-600">{b.date}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{b.amount}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(b.status)}`}>
                    {b.status}
                  </span>
                </td>
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

function GemsTab() {
  const [gems, setGems] = useState(MOCK_GEMS);
  const approve = (id: string) => setGems(gs => gs.map(g => g.id === id ? { ...g, status: "published" as const } : g));
  const reject  = (id: string) => setGems(gs => gs.map(g => g.id === id ? { ...g, status: "rejected" as const } : g));

  const statusStyle = (s: string) => ({
    published: "bg-emerald-50 text-emerald-700",
    pending:   "bg-amber-50 text-amber-700",
    rejected:  "bg-red-50 text-red-700",
  }[s] ?? "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                <td className="px-4 py-3 font-medium text-slate-800">{g.name}</td>
                <td className="px-4 py-3 text-slate-600">{g.location}</td>
                <td className="px-4 py-3 text-slate-600">{g.category}</td>
                <td className="px-4 py-3 text-slate-600">{g.submittedBy}</td>
                <td className="px-4 py-3 text-slate-500">{g.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(g.status)}`}>
                    {g.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-sky-600 hover:underline">View</button>
                    {g.status === "pending" && (
                      <>
                        <button onClick={() => approve(g.id)} className="text-xs text-emerald-600 hover:underline">Publish</button>
                        <button onClick={() => reject(g.id)} className="text-xs text-rose-500 hover:underline">Reject</button>
                      </>
                    )}
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

function FeaturedTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">64 featured places currently active</p>
        <button className="text-sm bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition font-medium">
          + Add Featured Place
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { name: "Boracay White Beach", location: "Aklan", category: "Beach", views: "8,420" },
          { name: "Chocolate Hills", location: "Bohol", category: "Heritage", views: "6,203" },
          { name: "El Nido", location: "Palawan", category: "Island", views: "11,847" },
          { name: "Mayon Volcano", location: "Albay", category: "Nature", views: "4,580" },
        ].map(f => (
          <div key={f.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-800">{f.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{f.location} · {f.category}</p>
              <p className="text-xs text-slate-500 mt-1">{f.views} views</p>
            </div>
            <div className="flex gap-2 text-xs">
              <button className="text-sky-600 hover:underline">Edit</button>
              <button className="text-rose-500 hover:underline">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [reviews] = useState([
    { id: "r1", user: "Maria Santos", target: "Island Hopper Tours", text: "Amazing experience! Highly recommend.", rating: 5, date: "Sep 22", status: "approved" },
    { id: "r2", user: "Pedro Cruz", target: "Palawan Adventure Co.", text: "This is a scam company!! [inappropriate content]", rating: 1, date: "Sep 21", status: "pending" },
    { id: "r3", user: "Ana Reyes", target: "Siargao Surf Camp", text: "Great waves and friendly staff.", rating: 4, date: "Sep 20", status: "approved" },
  ]);
  return (
    <div className="space-y-3">
      {reviews.map(r => (
        <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-800 text-sm">{r.user}</span>
                <span className="text-slate-400 text-xs">→</span>
                <span className="text-slate-600 text-sm">{r.target}</span>
                <span className="ml-auto text-xs text-slate-400">{r.date}</span>
              </div>
              <div className="text-yellow-400 text-xs mb-1">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <p className={`text-sm ${r.status === "pending" ? "bg-amber-50 border border-amber-100 rounded p-2 text-slate-700" : "text-slate-600"}`}>{r.text}</p>
            </div>
            {r.status === "pending" && (
              <div className="flex flex-col gap-2">
                <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-medium">Approve</button>
                <button className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 font-medium">Remove</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={TrendingUp} label="Revenue (Sep 2026)" value="₱89,400" sub="+18% vs Aug" color="emerald" />
        <StatCard icon={Users} label="New Users (Sep)" value="234" sub="vs 198 Aug" color="sky" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Export Reports</h3>
        <div className="grid grid-cols-2 gap-3">
          {["Users Report", "Revenue Report", "Bookings Report", "Business Report"].map(r => (
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

function SettingsTab() {
  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Platform Settings</h3>
        {[
          { label: "Allow new user registrations", checked: true },
          { label: "Allow new business registrations", checked: true },
          { label: "Enable community posts", checked: true },
          { label: "Show featured places on landing page", checked: true },
          { label: "Maintenance mode", checked: false },
        ].map(s => (
          <label key={s.label} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-700">{s.label}</span>
            <div className={`relative inline-block w-10 h-6 rounded-full transition-colors ${s.checked ? "bg-sky-500" : "bg-slate-200"}`}>
              <span className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full shadow transition-transform ${s.checked ? "translate-x-4" : ""}`} />
            </div>
          </label>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Payment Settings</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">GCash Number</span><span className="font-medium text-slate-800">09XX-XXX-XXXX</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Maya Number</span><span className="font-medium text-slate-800">09XX-XXX-XXXX</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Account Name</span><span className="font-medium text-slate-800">TCUnnect Official</span></div>
        </div>
        <button className="mt-4 text-sm text-sky-600 hover:underline">Edit payment details</button>
      </div>
    </div>
  );
}

// ─── Sidebar Nav ─────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { id: "users",         label: "Users",           icon: Users },
  { id: "businesses",    label: "Businesses",      icon: Briefcase },
  { id: "payments",      label: "Payments",        icon: CreditCard, badge: 2 },
  { id: "subscriptions", label: "Subscriptions",   icon: Star },
  { id: "bookings",      label: "Bookings",        icon: BookOpen },
  { id: "gems",          label: "Hidden Gems",     icon: Gem, badge: 1 },
  { id: "featured",      label: "Featured Places", icon: MapPin },
  { id: "reviews",       label: "Reviews",         icon: MessageSquare, badge: 3 },
  { id: "reports",       label: "Reports",         icon: BarChart2 },
  { id: "settings",      label: "Settings",        icon: Settings },
];

const TAB_TITLES: Record<TabId, string> = {
  dashboard: "Dashboard", users: "User Management", businesses: "Business Management",
  payments: "Payment Verification", subscriptions: "Subscriptions", bookings: "Bookings",
  gems: "Hidden Gems", featured: "Featured Places", reviews: "Reviews & Moderation",
  reports: "Reports & Analytics", settings: "System Settings",
};

// ─── Main Component ───────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  useEffect(() => {
    if (!user?.isAdmin) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleLogout = async () => { await logout(); navigate("/"); };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":     return <DashboardTab />;
      case "users":         return <UsersTab />;
      case "businesses":    return <BusinessesTab />;
      case "payments":      return <PaymentsTab />;
      case "subscriptions": return <SubscriptionsTab />;
      case "bookings":      return <BookingsTab />;
      case "gems":          return <GemsTab />;
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
              {t.badge && (
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
            <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full" />
            </button>
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
