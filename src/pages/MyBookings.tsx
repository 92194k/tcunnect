import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useBookingStore } from "../stores";
import { MapPin, Calendar, Users, ChevronRight } from "lucide-react";
import type { BookingStatus } from "../types";

const STATUS_TABS: { key: BookingStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const DEMO_BOOKINGS = [
  { id: "bk_demo1", userId: "u0", gemId: "nacpan", gemName: "Nacpan Beach", tripType: "group", date: "2026-12-15", guests: 4, status: "confirmed" as BookingStatus, notes: "Surprise trip!", createdAt: "2026-11-01" },
  { id: "bk_demo2", userId: "u0", gemId: "g1", gemName: "Kayangan Lake", tripType: "couple", date: "2026-11-20", guests: 2, status: "pending" as BookingStatus, notes: "", createdAt: "2026-10-28" },
];

export default function MyBookings() {
  const { bookings: storeBookings } = useBookingStore();
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");

  const allBookings = [...DEMO_BOOKINGS, ...storeBookings];
  const filtered = activeTab === "all" ? allBookings : allBookings.filter((b) => b.status === activeTab);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">Track your upcoming and past trips</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {STATUS_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                activeTab === key ? "bg-sky-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-500 text-sm mb-4">No {activeTab === "all" ? "" : activeTab} bookings yet</p>
            <Link to="/hidden-gems" className="text-sky-600 text-sm font-medium hover:text-sky-700">
              Explore hidden gems →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{booking.gemName}</h3>
                    <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="h-3 w-3" /> Trip destination
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[booking.status]}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-500">Date</p>
                    <p className="text-xs font-semibold text-slate-700">
                      {new Date(booking.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <Users className="h-3.5 w-3.5 text-slate-400 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-500">Guests</p>
                    <p className="text-xs font-semibold text-slate-700">{booking.guests}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <span className="text-base block mb-0.5">
                      {booking.tripType === "solo" ? "🧍" : booking.tripType === "couple" ? "💑" : booking.tripType === "family" ? "👨‍👩‍👧‍👦" : "👥"}
                    </span>
                    <p className="text-[10px] text-slate-500">Type</p>
                    <p className="text-xs font-semibold text-slate-700 capitalize">{booking.tripType}</p>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2 mb-3">"{booking.notes}"</p>
                )}

                <Link to={`/gems/${booking.gemId}`}
                  className="flex items-center justify-between text-sky-600 hover:text-sky-700 text-xs font-medium transition">
                  View destination <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/hidden-gems"
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition">
            Book Another Trip
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
