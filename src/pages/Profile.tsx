import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { MapPin, Edit2, Check, X, Camera, Crown, Shield, Star } from "lucide-react";
import type { TravelInterest } from "../types";

const INTERESTS: { label: TravelInterest; emoji: string }[] = [
  { label: "Beach", emoji: "🏖" }, { label: "Mountain", emoji: "🏔" },
  { label: "Nature", emoji: "🌿" }, { label: "Food", emoji: "🍜" },
  { label: "Heritage", emoji: "🏛" }, { label: "Cafe", emoji: "☕" },
  { label: "Waterfalls", emoji: "💦" }, { label: "City", emoji: "🌆" },
];

const PH_CITIES = [
  "Manila", "Quezon City", "Makati", "Pasig", "Taguig", "Cebu City",
  "Davao City", "Cagayan de Oro", "Zamboanga", "Iloilo City", "Bacolod",
  "Antipolo", "Mandaluyong", "Pasay", "Las Piñas", "Muntinlupa",
];

// Demo other-user profiles
const OTHER_USERS: Record<string, { id: string; fullName: string; age: number; bio: string; location: string; profilePhoto: string; travelInterests: string[]; isVerified: boolean; isPremium: boolean }> = {
  u1: { id: "u1", fullName: "Maria", age: 21, bio: "Always looking for new places to explore 🌿", location: "Quezon City", profilePhoto: "https://images.unsplash.com/photo-1675705444858-97005ce93298?auto=format&fit=crop&w=300&q=80", travelInterests: ["Beach", "Food", "Nature"], isVerified: true, isPremium: false },
  u2: { id: "u2", fullName: "Sam", age: 24, bio: "Hiking lover & island hopper 🏔", location: "Cebu City", profilePhoto: "https://images.unsplash.com/photo-1605741455532-384a402cf959?auto=format&fit=crop&w=300&q=80", travelInterests: ["Mountain", "Waterfalls", "Nature"], isVerified: false, isPremium: false },
};

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio ?? "");
  const [editLocation, setEditLocation] = useState(user?.location ?? "");
  const [editInterests, setEditInterests] = useState<TravelInterest[]>(user?.travelInterests ?? []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Viewing someone else's profile
  if (userId && userId !== user?.id) {
    const other = OTHER_USERS[userId];
    if (!other) return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-slate-500">User not found</p>
        </div>
      </AppShell>
    );
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <img src={other.profilePhoto} alt={other.fullName} className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg" />
              {other.isVerified && <span className="absolute bottom-0 right-0 bg-sky-600 rounded-full p-1"><Shield className="h-3.5 w-3.5 text-white" /></span>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
              {other.fullName}, {other.age}
              {other.isPremium && <Crown className="h-5 w-5 text-amber-500" />}
            </h1>
            <p className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 text-rose-400" /> {other.location}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">About</h3>
            <p className="text-slate-700 text-sm">{other.bio}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Travel Interests</h3>
            <div className="flex flex-wrap gap-2">
              {other.travelInterests.map((i) => {
                const found = INTERESTS.find((x) => x.label === i);
                return <span key={i} className="bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1 rounded-full">{found?.emoji} {i}</span>;
              })}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Own profile
  const saveEdit = () => {
    if (!user) return;
    setUser({ ...user, bio: editBio, location: editLocation, travelInterests: editInterests });
    setEditing(false);
  };

  const toggleInterest = (i: TravelInterest) => {
    setEditInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Avatar */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white">
              {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" /> : user?.fullName?.[0]}
            </div>
            <button className="absolute bottom-0 right-0 h-8 w-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow hover:bg-slate-50 transition">
              <Camera className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
            {user?.fullName}
            {user?.isPremium && <Crown className="h-5 w-5 text-amber-500" />}
            {user?.isVerified && <Shield className="h-4 w-4 text-sky-600" />}
          </h1>
          <p className="text-slate-500 text-sm">{user?.email}</p>
          {user?.isPremium && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mt-2">
              <Crown className="h-3 w-3" /> Premium Member
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[{ label: "Matches", value: "3" }, { label: "Bookings", value: "2" }, { label: "Gems Visited", value: "5" }].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-xl font-bold text-sky-600">{value}</p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Edit toggle */}
        {!editing ? (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">About Me</h3>
                <button onClick={() => setEditing(true)} className="text-sky-600 hover:text-sky-700 text-xs flex items-center gap-1">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
              <p className="text-slate-700 text-sm">{user?.bio || <span className="italic text-slate-400">No bio yet</span>}</p>
              <div className="flex items-center gap-1 mt-3 text-slate-500 text-sm">
                <MapPin className="h-4 w-4 text-rose-400" /> {user?.location || "No location set"}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Travel Interests</h3>
              <div className="flex flex-wrap gap-2">
                {(user?.travelInterests ?? []).length > 0 ? user?.travelInterests.map((i) => {
                  const found = INTERESTS.find((x) => x.label === i);
                  return <span key={i} className="bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1 rounded-full">{found?.emoji} {i}</span>;
                }) : <span className="text-slate-400 text-sm italic">No interests selected</span>}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Edit Profile</h3>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:text-emerald-700"><Check className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                <select value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none">
                  <option value="">Select city</option>
                  {PH_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Interests</label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERESTS.map(({ label, emoji }) => (
                    <button key={label} type="button" onClick={() => toggleInterest(label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition ${
                        editInterests.includes(label) ? "bg-sky-600 border-sky-600 text-white" : "border-slate-200 text-slate-700 hover:border-sky-300"
                      }`}>
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveEdit} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl transition">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Danger zone */}
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-rose-500 text-sm hover:text-rose-600 py-2 transition">
            Delete Account
          </button>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <p className="font-bold text-rose-700 mb-1">Delete Account?</p>
            <p className="text-xs text-rose-600 mb-4">This is permanent and cannot be undone. All your data will be erased.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-slate-200 bg-white text-slate-700 text-sm font-medium py-2 rounded-lg transition">
                Cancel
              </button>
              <button onClick={() => { logout(); navigate("/"); }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-2 rounded-lg transition">
                Yes, Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
