import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { Compass, MapPin, ArrowRight, Check } from "lucide-react";
import type { TravelInterest } from "../../types";

const INTERESTS: { label: TravelInterest; emoji: string }[] = [
  { label: "Beach", emoji: "🏖" },
  { label: "Mountain", emoji: "🏔" },
  { label: "Nature", emoji: "🌿" },
  { label: "Food", emoji: "🍜" },
  { label: "Heritage", emoji: "🏛" },
  { label: "Cafe", emoji: "☕" },
  { label: "Waterfalls", emoji: "💦" },
  { label: "City", emoji: "🌆" },
];

const PH_CITIES = [
  "Manila", "Quezon City", "Makati", "Pasig", "Taguig",
  "Cebu City", "Davao City", "Cagayan de Oro", "Zamboanga", "Iloilo City",
  "Bacolod", "Antipolo", "Mandaluyong", "Pasay", "Las Piñas",
  "Muntinlupa", "Marikina", "Caloocan", "Malabon", "Navotas",
  "Valenzuela", "Parañaque", "San Juan", "Pateros",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser, setOnboardingComplete } = useAuthStore();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [interests, setInterests] = useState<TravelInterest[]>(user?.travelInterests ?? []);

  const toggleInterest = (i: TravelInterest) =>
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const finish = () => {
    if (!user) return;
    setUser({
      ...user,
      bio,
      location,
      travelInterests: interests,
    });
    setOnboardingComplete(true);
    navigate("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="h-10 w-10 bg-sky-600 rounded-xl flex items-center justify-center text-white">
              <Compass className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-slate-900">TC<span className="text-sky-600">U</span>nnect</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step ? "bg-sky-600 text-white" :
                s === step ? "bg-sky-600 text-white ring-4 ring-sky-200" :
                "bg-slate-200 text-slate-500"
              }`}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 ${s < step ? "bg-sky-600" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
          {/* ── Step 1: About You ── */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">About You</h2>
              <p className="text-slate-500 text-sm mb-6">Tell fellow travelers a bit about yourself</p>

              <div className="mb-5">
                <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-3xl shadow-md mb-3">
                  {user?.fullName?.[0] ?? "?"}
                </div>
                <p className="text-center text-sm font-semibold text-slate-700">{user?.fullName}</p>
                <p className="text-center text-xs text-slate-400">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your travel style, favorite places, or anything about you..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none"
                />
                <p className="text-right text-xs text-slate-400 mt-1">{bio.length}/150</p>
              </div>

              <button onClick={() => setStep(2)}
                className="w-full mt-5 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Where are you from?</h2>
              <p className="text-slate-500 text-sm mb-6">This helps us connect you with nearby travelers</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <MapPin className="inline h-4 w-4 text-rose-400 mr-1" />
                  City / Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                >
                  <option value="">Select your city</option>
                  {PH_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition">
                  Back
                </button>
                <button onClick={() => setStep(3)} disabled={!location}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Interests ── */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Travel Interests</h2>
              <p className="text-slate-500 text-sm mb-6">Select all that apply — helps us find your match</p>

              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map(({ label, emoji }) => {
                  const selected = interests.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleInterest(label)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        selected
                          ? "bg-sky-600 border-sky-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                      }`}
                    >
                      <span>{emoji}</span>
                      {label}
                      {selected && <Check className="h-3.5 w-3.5 ml-auto" />}
                    </button>
                  );
                })}
              </div>

              {interests.length === 0 && (
                <p className="text-xs text-amber-600 mt-3">Please select at least one interest</p>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition">
                  Back
                </button>
                <button onClick={finish} disabled={interests.length === 0}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
                  Start Exploring 🎉
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
