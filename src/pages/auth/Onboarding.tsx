import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { Compass, MapPin, ArrowRight, ArrowLeft, Check, Camera, Search } from "lucide-react";
import type { TravelInterest } from "../../types";
import {
  REGIONS, PROVINCES, CITIES,
  type Region, type Province, type City,
} from "../../data/philippinesLocations";

const INTERESTS: { label: TravelInterest; emoji: string }[] = [
  { label: "Beach",      emoji: "🏖" },
  { label: "Mountain",   emoji: "🏔" },
  { label: "Nature",     emoji: "🌿" },
  { label: "Food",       emoji: "🍜" },
  { label: "Heritage",   emoji: "🏛" },
  { label: "Cafe",       emoji: "☕" },
  { label: "Waterfalls", emoji: "💦" },
  { label: "City",       emoji: "🌆" },
];

const TOTAL_STEPS = 5;

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const s = i + 1;
        return (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              s < step  ? "bg-sky-600 text-white" :
              s === step ? "bg-sky-600 text-white ring-4 ring-sky-200" :
              "bg-slate-200 text-slate-400"
            }`}>
              {s < step ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
            {s < TOTAL_STEPS && (
              <div className={`h-0.5 w-5 rounded-full ${s < step ? "bg-sky-600" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SearchableList<T extends { id: string; name: string }>({
  items, onSelect, placeholder,
}: { items: T[]; onSelect: (item: T) => void; placeholder: string }) {
  const [q, setQ] = useState("");
  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">No results for "{q}"</p>
        ) : filtered.map((item) => (
          <button
            key={item.id} type="button"
            onClick={() => onSelect(item)}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateProfile, setOnboardingComplete } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [photoPreview, setPhotoPreview] = useState<string>(user?.profilePhoto ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saveError, setSaveError] = useState("");

  const [region, setRegion]     = useState<Region | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [city, setCity]         = useState<City | null>(null);

  const [interests, setInterests] = useState<TravelInterest[]>(user?.travelInterests ?? []);
  const [saving, setSaving] = useState(false);

  const provinces = region  ? PROVINCES.filter((p) => p.regionId === region.id)  : [];
  const cities    = province ? CITIES.filter((c) => c.provinceId === province.id) : [];

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const toggleInterest = (i: TravelInterest) =>
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const locationString = [city?.name, province?.name, region?.name]
    .filter(Boolean).join(", ");

  const finish = async () => {
    if (!user || interests.length === 0) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateProfile({
        fullName: fullName.trim() || user.fullName,
        profilePhoto: photoPreview,
        bio,
        location: city?.name
          ? `${city.name}, ${province?.name ?? ""}`
          : province?.name ?? region?.name ?? "",
        travelInterests: interests,
      });
      setOnboardingComplete(true);
      navigate("/dashboard");
    } catch (err) {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <span className="h-10 w-10 bg-sky-600 rounded-xl flex items-center justify-center text-white">
              <Compass className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-slate-900">TC<span className="text-sky-600">U</span>nnect</span>
          </div>
        </div>

        <StepBar step={step} />

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">

          {/* ── Step 1: Profile Photo + Bio ── */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">About You</h2>
              <p className="text-slate-500 text-sm mb-6">Add a photo and tell fellow travelers about yourself</p>

              {/* Photo */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-sky-100 shadow-md bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-3xl font-bold">
                    {photoPreview
                      ? <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                      : (user?.fullName?.[0] ?? "?")}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-sky-600 border-2 border-white flex items-center justify-center shadow-sm">
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-700">
                  {photoPreview ? "Change photo" : "Add profile photo"}
                </button>
                <p className="text-center text-sm font-semibold text-slate-700 mt-2">{user?.fullName}</p>
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your bio <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  value={bio} onChange={(e) => setBio(e.target.value.slice(0, 150))}
                  placeholder="Share your travel style, favorite places, or what you're looking for..."
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

          {/* ── Step 2: Region ── */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                🇵🇭 Where in the Philippines are you?
              </h2>
              <p className="text-slate-500 text-sm mb-1">Choose your region to get started</p>
              <p className="text-xs text-slate-400 mb-5">You can change your location anytime.</p>

              <SearchableList
                items={REGIONS}
                placeholder="🔍 Search region..."
                onSelect={(r) => {
                  setRegion(r);
                  setProvince(null);
                  setCity(null);
                  setStep(3);
                }}
              />

              <button onClick={() => setStep(1)}
                className="mt-4 w-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </>
          )}

          {/* ── Step 3: Province ── */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
                  {region?.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Choose your province</h2>
              <p className="text-slate-500 text-sm mb-5">Select where you are currently located</p>

              <SearchableList
                items={provinces}
                placeholder="🔍 Search province..."
                onSelect={(p) => {
                  setProvince(p);
                  setCity(null);
                  setStep(4);
                }}
              />

              <button onClick={() => setStep(2)}
                className="mt-4 w-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Change Region
              </button>
            </>
          )}

          {/* ── Step 4: City / Municipality ── */}
          {step === 4 && (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {region?.name}
                </span>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
                  {province?.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Pinpoint your location</h2>
              <p className="text-slate-500 text-sm mb-5">Select your city or municipality</p>

              {cities.length > 0 ? (
                <SearchableList
                  items={cities}
                  placeholder="🔍 Search city or municipality..."
                  onSelect={(c) => {
                    setCity(c);
                    setStep(5);
                  }}
                />
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  No city data yet for this province.
                </div>
              )}

              <button
                onClick={() => setStep(5)}
                className="mt-3 w-full text-xs text-sky-600 hover:text-sky-700 font-medium py-2 transition">
                Skip — use province only
              </button>

              <button onClick={() => setStep(3)}
                className="mt-1 w-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Change Province
              </button>
            </>
          )}

          {/* ── Step 5: Travel Interests ── */}
          {step === 5 && (
            <>
              {/* Location confirmation chip */}
              {locationString && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-600">📍</span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">{city?.name ?? province?.name}</p>
                    <p className="text-[11px] text-emerald-600">{province?.name}{region ? `, ${region.name.split("–")[0].trim()}` : ""}</p>
                  </div>
                  <button type="button" onClick={() => setStep(4)}
                    className="ml-auto text-[11px] text-emerald-700 font-semibold underline">
                    Change
                  </button>
                </div>
              )}

              <h2 className="text-xl font-bold text-slate-900 mb-1">Travel Interests</h2>
              <p className="text-slate-500 text-sm mb-5">Select all that apply — helps us find your match</p>

              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map(({ label, emoji }) => {
                  const selected = interests.includes(label);
                  return (
                    <button key={label} type="button" onClick={() => toggleInterest(label)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        selected
                          ? "bg-sky-600 border-sky-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                      }`}>
                      <span>{emoji}</span>{label}
                      {selected && <Check className="h-3.5 w-3.5 ml-auto" />}
                    </button>
                  );
                })}
              </div>

              {interests.length === 0 && (
                <p className="text-xs text-amber-600 mt-3">Pick at least one interest to continue</p>
              )}

              {saveError && (
                <p className="text-xs text-red-600 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(4)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={finish}
                  disabled={interests.length === 0 || saving}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                  {saving ? "Saving..." : "Start Exploring 🎉"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
