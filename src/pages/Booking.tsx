import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore, useBookingStore } from "../stores";
import { Check, Calendar, Users, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import type { Booking, TripType } from "../types";

const TRIP_TYPES: { type: TripType; label: string; desc: string; emoji: string }[] = [
  { type: "solo", label: "Solo", desc: "Just you — your own pace, your own adventure", emoji: "🧍" },
  { type: "group", label: "Group", desc: "Travel with friends or meet new ones", emoji: "👥" },
  { type: "couple", label: "Couple", desc: "A romantic escape for two", emoji: "💑" },
  { type: "family", label: "Family", desc: "Fun for the whole family", emoji: "👨‍👩‍👧‍👦" },
];

const GEM_NAMES: Record<string, string> = {
  g1: "Kayangan Lake", g2: "Balabac Islands", g3: "Kalanggaman Island",
  g4: "Tinago Falls", g5: "Paoay Church", g6: "Batanes Rolling Hills",
  nacpan: "Nacpan Beach", g8: "Mt. Apo Summit",
};

export default function Booking() {
  const { gemId } = useParams<{ gemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addBooking } = useBookingStore();

  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState<TripType>("solo");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const gemName = GEM_NAMES[gemId ?? ""] ?? "Hidden Gem";

  const handleConfirm = () => {
    if (!user || !gemId) return;
    const booking: Booking = {
      id: `bk_${Date.now()}`,
      userId: user.id,
      gemId,
      gemName,
      tripType,
      date,
      guests,
      notes,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    addBooking(booking);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Submitted!</h2>
          <p className="text-slate-500 text-sm mb-2">Your trip to <span className="font-semibold text-slate-800">{gemName}</span> is pending confirmation.</p>
          <p className="text-slate-400 text-xs mb-8">We'll notify you once it's confirmed. Check your bookings for updates.</p>
          <div className="bg-slate-50 rounded-2xl p-5 text-left mb-8 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-slate-500">Destination</span><span className="font-medium text-slate-800">{gemName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium text-slate-800">{date}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Trip type</span><span className="font-medium text-slate-800 capitalize">{tripType}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Guests</span><span className="font-medium text-slate-800">{guests}</span></div>
          </div>
          <button onClick={() => navigate("/my-bookings")}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition mb-3">
            View My Bookings
          </button>
          <button onClick={() => navigate("/hidden-gems")}
            className="w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition">
            Keep Exploring
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-6 transition">
          <ArrowLeft className="h-4 w-4" /> {step > 1 ? "Back" : "Cancel"}
        </button>

        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-rose-400" />
          <p className="text-xs text-slate-500">{gemName}</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Book a Trip</h1>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                s < step ? "bg-sky-600 text-white" : s === step ? "bg-sky-600 text-white ring-4 ring-sky-100" : "bg-slate-200 text-slate-500"
              }`}>
                {s < step ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 w-8 ${s < step ? "bg-sky-600" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Trip Type */}
        {step === 1 && (
          <div>
            <h2 className="font-bold text-slate-900 mb-1">Who's coming?</h2>
            <p className="text-slate-500 text-sm mb-5">Select your trip type</p>
            <div className="space-y-3 mb-8">
              {TRIP_TYPES.map(({ type, label, desc, emoji }) => (
                <button key={type} onClick={() => setTripType(type)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${
                    tripType === type ? "border-sky-600 bg-sky-50" : "border-slate-200 hover:border-sky-200"
                  }`}>
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  {tripType === type && <Check className="h-5 w-5 text-sky-600 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Date & Guests */}
        {step === 2 && (
          <div>
            <h2 className="font-bold text-slate-900 mb-1">Trip Details</h2>
            <p className="text-slate-500 text-sm mb-5">When are you going?</p>
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Calendar className="inline h-4 w-4 text-sky-500 mr-1" /> Date
                </label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Users className="inline h-4 w-4 text-sky-500 mr-1" /> Number of Guests
                </label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition font-bold text-lg">-</button>
                  <span className="text-xl font-bold text-slate-900 w-8 text-center">{guests}</span>
                  <button onClick={() => setGuests(Math.min(20, guests + 1))}
                    className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition font-bold text-lg">+</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or questions..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none resize-none" />
              </div>
            </div>
            <button onClick={() => setStep(3)} disabled={!date}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              Review Booking <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h2 className="font-bold text-slate-900 mb-1">Review & Confirm</h2>
            <p className="text-slate-500 text-sm mb-5">Double-check your booking details</p>
            <div className="bg-slate-50 rounded-2xl p-5 space-y-4 mb-8">
              <div>
                <p className="text-xs text-slate-500 mb-1">Destination</p>
                <p className="font-semibold text-slate-900">{gemName}</p>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Trip Type</p>
                  <p className="font-medium text-slate-800 capitalize">{tripType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Date</p>
                  <p className="font-medium text-slate-800">{new Date(date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Guests</p>
                  <p className="font-medium text-slate-800">{guests} {guests === 1 ? "person" : "people"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2.5 py-1 rounded-full">Pending</span>
                </div>
              </div>
              {notes && (
                <>
                  <div className="h-px bg-slate-200" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{notes}</p>
                  </div>
                </>
              )}
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-6 text-xs text-sky-700">
              📋 This booking is <strong>free to submit</strong>. Payment (if required) is arranged directly with the local guide or venue.
            </div>
            <button onClick={handleConfirm}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-sky-200">
              Confirm Booking 🎉
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
