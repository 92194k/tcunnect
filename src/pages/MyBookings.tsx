import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { MapPin, Calendar, Users, ChevronRight, Loader2 } from "lucide-react";
import type { Booking, BookingStatus } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const STATUS_TABS: { key: BookingStatus | "all"; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function MyBookings() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    if (!isSupabaseConfigured || !user) { setLoading(false); return; }

    const { data } = await supabase
      .from("bookings")
      .select("id, user_id, gem_id, gem_name, trip_type, date, guests, notes, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setBookings(data.map((b) => ({
        id: b.id,
        userId: b.user_id,
        gemId: b.gem_id,
        gemName: b.gem_name,
        tripType: b.trip_type,
        date: b.date,
        guests: b.guests,
        notes: b.notes ?? "",
        status: b.status,
        createdAt: b.created_at,
      })));
    }
    setLoading(false);
  }

  const filtered = activeTab === "all"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

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

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-semibold text-slate-700 mb-1">No bookings yet</h3>
            <p className="text-slate-400 text-sm mb-5">Plan your next adventure!</p>
            <Link to="/hidden-gems"
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition">
              Explore Hidden Gems
            </Link>
          </div>
        )}

        {!loading && bookings.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-slate-500 text-sm">No {activeTab} bookings</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
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
