import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import {
  MapPin, Edit2, Check, X, Camera, Crown, Shield, Loader2,
  Lock, Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import type { TravelInterest } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

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

interface OtherProfile {
  id: string; fullName: string; age?: number; bio: string;
  location: string; profilePhoto: string; travelInterests: string[];
  isVerified: boolean; isPremium: boolean;
}

// ─── SVG warning icon ────────────────────────────────────────
function WarningSVG() {
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#FEF2F2" stroke="#FECACA" strokeWidth="2" />
      <path d="M40 22 L40 46" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="56" r="3" fill="#DC2626" />
      <path d="M22 58 Q40 14 58 58" stroke="#FCA5A5" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
    </svg>
  );
}

// ─── Password rule indicator ─────────────────────────────────
function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-slate-400"}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </li>
  );
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user, setUser, updateProfile, logout } = useAuthStore();

  // ── Own-profile edit state ──────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio ?? "");
  const [editLocation, setEditLocation] = useState(user?.location ?? "");
  const [editInterests, setEditInterests] = useState<TravelInterest[]>(user?.travelInterests ?? []);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Photo upload ────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // ── Delete modal ────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Change password ─────────────────────────────────────────
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // ── Detect if user has an email/password identity ───────────
  const [hasEmailIdentity, setHasEmailIdentity] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      const identities = u?.identities ?? [];
      setHasEmailIdentity(identities.some((id) => id.provider === "email"));
    });
  }, []);

  // ── Other-user profile state ────────────────────────────────
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherNotFound, setOtherNotFound] = useState(false);

  const isViewingOther = !!userId && userId !== user?.id;

  useEffect(() => {
    if (!isViewingOther) return;
    setOtherLoading(true);
    setOtherNotFound(false);
    if (!isSupabaseConfigured) { setOtherNotFound(true); setOtherLoading(false); return; }
    supabase
      .from("profiles")
      .select("id, full_name, age, bio, location, profile_photo, travel_interests, is_verified, is_premium")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (!data) { setOtherNotFound(true); }
        else {
          setOtherProfile({
            id: data.id, fullName: data.full_name ?? "Traveler", age: data.age ?? undefined,
            bio: data.bio ?? "", location: data.location ?? "Philippines",
            profilePhoto: data.profile_photo ?? "", travelInterests: data.travel_interests ?? [],
            isVerified: Boolean(data.is_verified), isPremium: Boolean(data.is_premium),
          });
        }
        setOtherLoading(false);
      });
  }, [userId, isViewingOther]);

  // ── Viewing someone else's profile ──────────────────────────
  if (isViewingOther) {
    if (otherLoading) return (
      <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-sky-500 animate-spin" /></div></AppShell>
    );
    if (otherNotFound || !otherProfile) return (
      <AppShell><div className="text-center py-20"><p className="text-slate-500">User not found</p></div></AppShell>
    );
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              {otherProfile.profilePhoto
                ? <img src={otherProfile.profilePhoto} alt={otherProfile.fullName} className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg" />
                : <div className="h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">{otherProfile.fullName[0]}</div>
              }
              {otherProfile.isVerified && <span className="absolute bottom-0 right-0 bg-sky-600 rounded-full p-1.5"><Shield className="h-3.5 w-3.5 text-white" /></span>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
              {otherProfile.fullName}{otherProfile.age ? `, ${otherProfile.age}` : ""}
              {otherProfile.isPremium && <Crown className="h-5 w-5 text-amber-500" />}
            </h1>
            <p className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 text-rose-400" /> {otherProfile.location}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">About</h3>
            <p className="text-slate-700 text-sm">{otherProfile.bio || <span className="italic text-slate-400">No bio yet</span>}</p>
          </div>
          {otherProfile.travelInterests.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Travel Interests</h3>
              <div className="flex flex-wrap gap-2">
                {otherProfile.travelInterests.map((i) => {
                  const found = INTERESTS.find((x) => x.label === i);
                  return <span key={i} className="bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1 rounded-full">{found?.emoji} {i}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // ── Own profile handlers ────────────────────────────────────

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoUploading(true);
    try {
      if (!isSupabaseConfigured) {
        const reader = new FileReader();
        reader.onload = () => { setUser({ ...user, profilePhoto: reader.result as string }); setPhotoUploading(false); };
        reader.readAsDataURL(file);
        return;
      }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfile({ profilePhoto: publicUrl });
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openEditMode = () => {
    setEditBio(user?.bio ?? "");
    setEditLocation(user?.location ?? "");
    setEditInterests(user?.travelInterests ?? []);
    setSaveError("");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateProfile({ bio: editBio, location: editLocation, travelInterests: editInterests });
      setEditing(false);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (i: TravelInterest) =>
    setEditInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  // ── Change password handler ──────────────────────────────────
  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    const { next, confirm } = pwForm;
    if (!next || !confirm) return setPwError("Please fill in all fields.");
    if (next.length < 8) return setPwError("Password must be at least 8 characters.");
    if (!/[A-Z]/.test(next)) return setPwError("Password must contain an uppercase letter.");
    if (!/[0-9]/.test(next)) return setPwError("Password must contain a number.");
    if (next !== confirm) return setPwError("Passwords do not match.");

    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw new Error(error.message);
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 2500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPwSaving(false);
    }
  };

  const nextPw = pwForm.next;
  const pwRules = {
    length: nextPw.length >= 8,
    upper: /[A-Z]/.test(nextPw),
    number: /[0-9]/.test(nextPw),
  };

  // ── Hard delete handler (calls Edge Function) ────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") return;
    setDeleting(true);
    setDeleteError("");
    try {
      if (isSupabaseConfigured && user) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Deletion failed.");
        }
      }
      await logout();
      navigate("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      {/* ─── Delete Confirmation Modal ──────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Red header band */}
            <div className="bg-rose-600 px-6 pt-6 pb-4 text-center">
              <WarningSVG />
              <h2 className="text-white font-bold text-lg mt-3">Delete Your Account</h2>
              <p className="text-rose-100 text-xs mt-1">This cannot be undone</p>
            </div>

            <div className="p-6">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4 space-y-1">
                {[
                  "Your profile and all personal data",
                  "Your matches and chat history",
                  "Your bookings and reviews",
                  "Your account login access",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-rose-700">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-600 mb-3">
                Type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">delete</span> to confirm:
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => { setDeleteConfirmText(e.target.value); setDeleteError(""); }}
                placeholder='Type "delete" here'
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none mb-3 font-mono"
              />

              {deleteError && (
                <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); setDeleteError(""); }}
                  disabled={deleting}
                  className="flex-1 border border-slate-200 bg-white text-slate-700 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText.toLowerCase() !== "delete" || deleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* ── Avatar ──────────────────────────────────────── */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white">
              {photoUploading
                ? <Loader2 className="h-8 w-8 animate-spin text-white/80" />
                : user?.profilePhoto
                  ? <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                  : <span>{user?.fullName?.[0]}</span>
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute bottom-0 right-0 h-8 w-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow hover:bg-slate-50 transition disabled:opacity-50">
              <Camera className="h-3.5 w-3.5 text-slate-500" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
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

        {/* ── Edit / View ──────────────────────────────────── */}
        {!editing ? (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">About Me</h3>
                <button onClick={openEditMode} className="text-sky-600 hover:text-sky-700 text-xs flex items-center gap-1">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                {user?.bio || <span className="italic text-slate-400">No bio yet. Tap Edit to add one.</span>}
              </p>
              <div className="flex items-center gap-1 mt-3 text-slate-500 text-sm">
                <MapPin className="h-4 w-4 text-rose-400" /> {user?.location || "No location set"}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Travel Interests</h3>
              <div className="flex flex-wrap gap-2">
                {(user?.travelInterests ?? []).length > 0
                  ? user?.travelInterests.map((i) => {
                    const found = INTERESTS.find((x) => x.label === i);
                    return <span key={i} className="bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1 rounded-full">{found?.emoji} {i}</span>;
                  })
                  : <span className="text-slate-400 text-sm italic">No interests selected yet</span>
                }
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Edit Profile</h3>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} disabled={saving} className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-40">
                  <X className="h-4 w-4" />
                </button>
                <button onClick={saveEdit} disabled={saving} className="p-1.5 text-emerald-600 hover:text-emerald-700 disabled:opacity-40">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {saveError && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3 text-xs text-rose-600">{saveError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                  placeholder="Tell others about yourself as a traveler..." />
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
                <label className="block text-xs font-medium text-slate-600 mb-2">Travel Interests</label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERESTS.map(({ label, emoji }) => (
                    <button key={label} type="button" onClick={() => toggleInterest(label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition ${
                        editInterests.includes(label)
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "border-slate-200 text-slate-700 hover:border-sky-300"
                      }`}>
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveEdit} disabled={saving}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ── Change Password ────────────────────────────────── */}
        {isSupabaseConfigured && hasEmailIdentity && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 overflow-hidden">
            <button
              onClick={() => { setShowChangePw((v) => !v); setPwError(""); setPwSuccess(false); setPwForm({ current: "", next: "", confirm: "" }); }}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                Change Password
              </span>
              <span className={`text-slate-400 transition-transform duration-200 ${showChangePw ? "rotate-180" : ""}`}>▾</span>
            </button>

            {showChangePw && (
              <div className="px-5 pb-5 border-t border-slate-100">
                {pwSuccess ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <Check className="h-4 w-4" /> Password updated successfully!
                  </div>
                ) : (
                  <form onSubmit={handleChangePw} className="mt-4 space-y-3">
                    {pwError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">{pwError}</div>
                    )}

                    {/* New password */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input type={showNext ? "text" : "password"} value={pwForm.next}
                          onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition" />
                        <button type="button" onClick={() => setShowNext(!showNext)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNext ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {pwForm.next && (
                        <ul className="mt-1.5 space-y-0.5 pl-1">
                          <PasswordRule ok={pwRules.length} label="At least 8 characters" />
                          <PasswordRule ok={pwRules.upper} label="One uppercase letter" />
                          <PasswordRule ok={pwRules.number} label="One number" />
                        </ul>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input type={showCurrent ? "text" : "password"} value={pwForm.confirm}
                          onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition" />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {pwForm.confirm && pwForm.next !== pwForm.confirm && (
                        <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
                      )}
                    </div>

                    <button type="submit" disabled={pwSaving}
                      className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                      {pwSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Update Password
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Danger zone ─────────────────────────────────── */}
        <div className="mt-4 text-center">
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(""); setDeleteError(""); }}
            className="text-rose-400 hover:text-rose-600 text-sm transition py-2">
            Delete Account
          </button>
        </div>
      </div>
    </AppShell>
  );
}
