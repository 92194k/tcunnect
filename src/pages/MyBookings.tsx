import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import {
  MapPin, Calendar, Users, ChevronRight, Loader2, Clock,
  CheckCircle2, XCircle, Trophy, Star, MessageSquare,
} from "lucide-react";
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

const STATUS_INFO: Record<string, { icon: React.ReactNode; label: string; desc: string }> = {
  pending:   { icon: <Clock className="h-3.5 w-3.5" />,         label: "Pending",   desc: "Waiting for TCUnnect admin confirmation" },
  confirmed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />,  label: "Confirmed", desc: "Your booking has been confirmed by TCUnnect" },
  completed: { icon: <Trophy className="h-3.5 w-3.5" />,        label: "Completed", desc: "Trip completed — hope it was amazing!" },
  cancelled: { icon: <XCircle className="h-3.5 w-3.5" />,       label: "Cancelled", desc: "This booking was cancelled" },
};

// ─── Star Rating Picker ───────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 ${(hovered || value) >= n ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  booking,
  onClose,
  onSubmitted,
}: {
  booking: Booking;
  onClose: () => void;
  onSubmitted: (bookingId: string) => void;
}) {
  const { user } = useAuthStore();
  const [rating, setRating]       = useState(0);
  const [text, setText]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);

  const canSubmit = rating >= 1 && text.trim().length >= 10 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !user || !isSupabaseConfigured) return;
    setSubmitting(true);
    setError("");

    const { error: insertErr } = await supabase.from("reviews").insert({
      user_id:     user.id,
      booking_id:  booking.id,
      gem_id:      booking.gemId,
      gem_name:    booking.gemName,
      rating,
      review_text: text.trim(),
      status:      "pending",
    });

    if (insertErr) {
      // Unique violation = already reviewed
      if (insertErr.code === "23505") {
        setError("You've already submitted a review for this trip.");
      } else {
        setError(insertErr.message);
      }
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
    onSubmitted(booking.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
           onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Review Submitted!</h3>
            <p className="text-sm text-slate-500 mb-5">
              Your review is pending approval by TCUnnect admin. It'll appear on the destination page once approved.
            </p>
            <button onClick={onClose}
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">How was your trip?</h3>
                <p className="text-sm text-slate-500 mt-0.5">{booking.gemName}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            {/* Star picker */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <StarPicker value={rating} onChange={setRating} />
              <p className="text-xs text-slate-400">
                {rating === 0 && "Tap a star to rate"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent!"}
              </p>
            </div>

            {/* Review text */}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Share your experience... (at least 10 characters)"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-400 mb-1"
            />
            <p className="text-xs text-slate-400 mb-4 text-right">{text.trim().length} chars</p>

            {error && (
              <p className="text-xs text-red-500 mb-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit}
                className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyBookings() {
  const { user } = useAuthStore();
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<BookingStatus | "all">("all");
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());   // booking IDs already reviewed
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null); // modal target

  const mapRow = (b: any): Booking => ({
    id:        b.id,
    userId:    b.user_id,
    gemId:     b.gem_id,
    gemName:   b.gem_name,
    tripType:  b.trip_type,
    date:      b.date,
    guests:    b.guests,
    notes:     b.notes ?? "",
    status:    b.status,
    createdAt: b.created_at,
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured || !user) { setLoading(false); return; }

    const [bookingsRes, reviewsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, user_id, gem_id, gem_name, trip_type, date, guests, notes, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("booking_id")
        .eq("user_id", user.id),
    ]);

    if (bookingsRes.data) setBookings(bookingsRes.data.map(mapRow));
    if (reviewsRes.data)  setReviewedIds(new Set(reviewsRes.data.map((r: any) => r.booking_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Realtime: update booking cards when admin changes status
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    const channel = supabase
      .channel(`my-bookings-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setBookings(prev =>
            prev.map(b => b.id === payload.new.id ? { ...b, status: payload.new.status } : b)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = activeTab === "all"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  const handleReviewSubmitted = (bookingId: string) => {
    setReviewedIds(prev => new Set([...prev, bookingId]));
  };

  return (
    <AppShell>
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}

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
            {filtered.map((booking) => {
              const alreadyReviewed = reviewedIds.has(booking.id);
              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{booking.gemName}</h3>
                      <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="h-3 w-3" /> Trip destination
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[booking.status]}`}>
                        {STATUS_INFO[booking.status]?.icon}
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  {STATUS_INFO[booking.status] && (
                    <p className="text-[11px] text-slate-400 mb-3 flex items-center gap-1">
                      {STATUS_INFO[booking.status].desc}
                    </p>
                  )}

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

                  <div className="flex items-center justify-between gap-3">
                    <Link to={`/gems/${booking.gemId}`}
                      className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs font-medium transition">
                      View destination <ChevronRight className="h-3.5 w-3.5" />
                    </Link>

                    {/* Leave a Review — only for completed bookings */}
                    {booking.status === "completed" && (
                      alreadyReviewed ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Review submitted
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewBooking(booking)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-full transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Leave a Review
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
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
