import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores";
import {
  Users, MapPin, Calendar, CreditCard, Flag, BarChart2,
  CheckCircle, XCircle, Clock, LogOut, Compass, Crown, Shield
} from "lucide-react";

type Tab = "overview" | "bookings" | "gems" | "users" | "payments" | "moderation";

const STATS = [
  { label: "Total Users", value: "12,482", change: "+127 this week", icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
  { label: "Hidden Gems", value: "348", change: "+12 pending approval", icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Bookings", value: "1,893", change: "+89 this month", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Revenue", value: "₱37,470", change: "1,249 premium users", icon: CreditCard, color: "text-rose-600", bg: "bg-rose-50" },
];

const PENDING_BOOKINGS = [
  { id: "b1", user: "Maria L.", gem: "Nacpan Beach", date: "2026-12-15", guests: 4, type: "group" },
  { id: "b2", user: "Sam K.", gem: "Kayangan Lake", date: "2026-11-20", guests: 2, type: "couple" },
  { id: "b3", user: "Ana R.", gem: "Tinago Falls", date: "2026-12-01", guests: 1, type: "solo" },
];

const PENDING_GEMS = [
  { id: "pg1", name: "Hidden Lagoon in Coron", location: "Coron, Palawan", category: "Nature", submittedBy: "Jake M.", date: "2026-09-20" },
  { id: "pg2", name: "Local Coffee Farm", location: "Benguet", category: "Cafe", submittedBy: "Maria L.", date: "2026-09-19" },
  { id: "pg3", name: "Biri Rock Formations", location: "Northern Samar", category: "Nature", submittedBy: "Anonymous", date: "2026-09-18" },
];

const PENDING_PAYMENTS = [
  { id: "pay1", user: "demo@tcunnect.com", method: "GCash", amount: "₱30", submitted: "2026-09-24", receipt: "receipt_001.jpg" },
  { id: "pay2", user: "traveler@gmail.com", method: "Maya", amount: "₱30", submitted: "2026-09-23", receipt: "receipt_002.jpg" },
];

const REPORTS = [
  { id: "r1", type: "Inappropriate Content", reporter: "User #4821", target: "Post #p5", date: "2026-09-24", status: "pending" },
  { id: "r2", type: "Fake Profile", reporter: "User #2034", target: "User #8813", date: "2026-09-23", status: "pending" },
  { id: "r3", type: "Spam", reporter: "User #9012", target: "User #3341", date: "2026-09-22", status: "resolved" },
];

const ALL_USERS = [
  { id: "u1", name: "Maria L.", email: "maria@example.com", joined: "2026-08-01", premium: false, verified: true, bookings: 3 },
  { id: "u2", name: "Sam K.", email: "sam@example.com", joined: "2026-08-15", premium: false, verified: false, bookings: 1 },
  { id: "u3", name: "Ana R.", email: "ana@example.com", joined: "2026-09-01", premium: true, verified: true, bookings: 5 },
  { id: "demo", name: "Demo User", email: "demo@tcunnect.com", joined: "2026-09-01", premium: false, verified: false, bookings: 2 },
];

const NAV_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <BarChart2 className="h-4 w-4" /> },
  { key: "bookings", label: "Bookings", icon: <Calendar className="h-4 w-4" /> },
  { key: "gems", label: "Gems", icon: <MapPin className="h-4 w-4" /> },
  { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { key: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { key: "moderation", label: "Reports", icon: <Flag className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [gemStatuses, setGemStatuses] = useState<Record<string, "approved" | "rejected" | null>>({});
  const [bookingStatuses, setBookingStatuses] = useState<Record<string, "confirmed" | "cancelled" | null>>({});
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, "approved" | "rejected" | null>>({});

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 fixed inset-x-0 top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center h-14 gap-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="h-7 w-7 bg-sky-600 rounded-lg flex items-center justify-center text-white">
              <Compass className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900 text-sm">TC<span className="text-sky-600">U</span>nnect</span>
          </Link>
          <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
          <div className="flex-1" />
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-500 transition">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar nav */}
          <aside className="lg:w-48 shrink-0">
            <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 lg:sticky lg:top-20">
              {NAV_TABS.map(({ key, label, icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition mb-0.5 ${
                    tab === key ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50"
                  }`}>
                  {icon} {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Overview */}
            {tab === "overview" && (
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-5">Admin Dashboard</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {STATS.map(({ label, value, change, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                      <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <p className="text-xl font-bold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                      <p className="text-[10px] text-emerald-600 mt-1">{change}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" /> Pending Actions
                    </h2>
                    <div className="space-y-2">
                      <div onClick={() => setTab("bookings")} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl cursor-pointer hover:bg-amber-100 transition">
                        <span className="text-sm text-amber-800">Pending bookings</span>
                        <span className="text-sm font-bold text-amber-700">{PENDING_BOOKINGS.length}</span>
                      </div>
                      <div onClick={() => setTab("gems")} className="flex items-center justify-between p-3 bg-sky-50 rounded-xl cursor-pointer hover:bg-sky-100 transition">
                        <span className="text-sm text-sky-800">Gem submissions</span>
                        <span className="text-sm font-bold text-sky-700">{PENDING_GEMS.length}</span>
                      </div>
                      <div onClick={() => setTab("payments")} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl cursor-pointer hover:bg-emerald-100 transition">
                        <span className="text-sm text-emerald-800">Payment verifications</span>
                        <span className="text-sm font-bold text-emerald-700">{PENDING_PAYMENTS.length}</span>
                      </div>
                      <div onClick={() => setTab("moderation")} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl cursor-pointer hover:bg-rose-100 transition">
                        <span className="text-sm text-rose-800">Unresolved reports</span>
                        <span className="text-sm font-bold text-rose-700">{REPORTS.filter(r => r.status === "pending").length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4 text-sky-500" /> Recent Users
                    </h2>
                    <div className="space-y-3">
                      {ALL_USERS.slice(0, 3).map((u) => (
                        <div key={u.id} className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                          <div className="flex gap-1">
                            {u.premium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                            {u.verified && <Shield className="h-3.5 w-3.5 text-sky-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings */}
            {tab === "bookings" && (
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-5">Booking Management</h1>
                <div className="space-y-3">
                  {PENDING_BOOKINGS.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">{b.gem}</p>
                          <p className="text-sm text-slate-500">{b.user} · {b.date} · {b.guests} guests · {b.type}</p>
                        </div>
                        {bookingStatuses[b.id] ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${bookingStatuses[b.id] === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {bookingStatuses[b.id]}
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Pending</span>
                        )}
                      </div>
                      {!bookingStatuses[b.id] && (
                        <div className="flex gap-2">
                          <button onClick={() => setBookingStatuses(prev => ({ ...prev, [b.id]: "confirmed" }))}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                            <CheckCircle className="h-3.5 w-3.5" /> Confirm
                          </button>
                          <button onClick={() => setBookingStatuses(prev => ({ ...prev, [b.id]: "cancelled" }))}
                            className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-4 py-2 rounded-lg transition">
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gems */}
            {tab === "gems" && (
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-5">Gem Submissions</h1>
                <div className="space-y-3">
                  {PENDING_GEMS.map((gem) => (
                    <div key={gem.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">{gem.name}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {gem.location} · {gem.category}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">Submitted by {gem.submittedBy} · {gem.date}</p>
                        </div>
                        {gemStatuses[gem.id] ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${gemStatuses[gem.id] === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {gemStatuses[gem.id]}
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Pending</span>
                        )}
                      </div>
                      {!gemStatuses[gem.id] && (
                        <div className="flex gap-2">
                          <button onClick={() => setGemStatuses(prev => ({ ...prev, [gem.id]: "approved" }))}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button onClick={() => setGemStatuses(prev => ({ ...prev, [gem.id]: "rejected" }))}
                            className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-4 py-2 rounded-lg transition">
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {tab === "users" && (
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-5">User Management</h1>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">User</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden sm:table-cell">Joined</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Bookings</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ALL_USERS.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.name[0]}</div>
                              <div>
                                <p className="font-medium text-slate-800">{u.name}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{u.joined}</td>
                          <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{u.bookings}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {u.premium && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Premium</span>}
                              {u.verified && <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full">Verified</span>}
                              {!u.premium && !u.verified && <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Basic</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payments */}
            {tab === "payments" && (
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-5">Payment Verification</h1>
                <div className="space-y-3">
                  {PENDING_PAYMENTS.map((pay) => (
                    <div key={pay.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">{pay.user}</p>
                          <p className="text-sm text-slate-500">{pay.method} · {pay.amount} · {pay.submitted}</p>
                          <p className="text-xs text-sky-600 mt-1">📎 {pay.receipt}</p>
                        </div>
                        {paymentStatuses[pay.id] ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${paymentStatuses[pay.id] === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {paymentStatuses[pay.id]}
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Pending</span>
                        )}
                      </div>
                      {!paymentStatuses[pay.id] && (
                        <div className="flex gap-2">
                          <button onClick={() => setPaymentStatuses(prev => ({ ...prev, [pay.id]: "approved" }))}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                            <CheckCircle className="h-3.5 w-3.5" /> Approve & Grant Premium
                          </button>
                          <button onClick={() => setPaymentStatuses(prev => ({ ...prev, [pay.id]: "rejected" }))}
                            className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-4 py-2 rounded-lg transition">
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Moderation */}
            {tab === "moderation" && (
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-5">Content Moderation</h1>
                <div className="space-y-3">
                  {REPORTS.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{r.type}</p>
                          <p className="text-sm text-slate-500">Reporter: {r.reporter} · Target: {r.target}</p>
                          <p className="text-xs text-slate-400 mt-1">{r.date}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${r.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {r.status}
                        </span>
                      </div>
                      {r.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <button className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                            <XCircle className="h-3.5 w-3.5" /> Remove Content
                          </button>
                          <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold px-4 py-2 rounded-lg transition">
                            <CheckCircle className="h-3.5 w-3.5" /> Dismiss Report
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
