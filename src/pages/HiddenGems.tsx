import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { MapPin, Search, Star, Bookmark, Loader2, X, Plus, Check, Image, Link2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const CATEGORIES = ["All", "Beach", "Mountain", "Nature", "Heritage", "Cafe", "Waterfalls", "City", "Food"];
const CATEGORY_EMOJIS: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Heritage: "🏛",
  Cafe: "☕", Waterfalls: "💦", City: "🌆", Food: "🍜",
};

interface Gem {
  id: string;
  name: string;
  location: string;
  category: string;
  images: string[];
  rating: number;
  review_count: number;
  budget_level: string;
  tip: string;
  is_featured: boolean;
}

const EMPTY_FORM = {
  name: "",
  location: "",
  category: "Beach",
  description: "",
  imageUrl: "",
  budget_level: "₱₱",
  rating: "",
  review_count: "",
  tip: "",
  is_featured: false,
};

export default function HiddenGems() {
  const { user } = useAuthStore();
  const isAdmin = user?.isAdmin === true;

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  // Map: gemId -> saved_places row id (empty string = not saved)
  const [savedMap, setSavedMap] = useState<Map<string, string>>(new Map());
  const [savingGemId, setSavingGemId] = useState<string | null>(null);
  const [gems, setGems] = useState<Gem[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit gem modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchGems(); }, []);

  // Load user's saved places from Supabase on mount
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    supabase
      .from("saved_places")
      .select("id, gem_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          const map = new Map<string, string>();
          data.forEach((row: { id: string; gem_id: string }) => map.set(row.gem_id, row.id));
          setSavedMap(map);
        }
      });
  }, [user?.id]);

  async function toggleSave(gemId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || savingGemId) return;
    setSavingGemId(gemId);

    const existingId = savedMap.get(gemId);
    if (existingId) {
      // Remove
      if (isSupabaseConfigured) {
        await supabase.from("saved_places").delete().eq("id", existingId);
      }
      setSavedMap(prev => {
        const next = new Map(prev);
        next.delete(gemId);
        return next;
      });
    } else {
      // Save
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from("saved_places")
          .insert({ user_id: user.id, gem_id: gemId })
          .select("id")
          .single();
        if (data) {
          setSavedMap(prev => new Map(prev).set(gemId, data.id));
        }
      } else {
        setSavedMap(prev => new Map(prev).set(gemId, "local"));
      }
    }
    setSavingGemId(null);
  }

  async function fetchGems() {
    setLoading(true);
    if (!isSupabaseConfigured) { setLoading(false); return; }

    const { data } = await supabase
      .from("hidden_gems")
      .select("id, name, location, category, images, rating, review_count, budget_level, tip, is_featured")
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("rating", { ascending: false });

    setGems((data as Gem[]) ?? []);
    setLoading(false);
  }

  const filtered = gems.filter((g) => {
    const q = query.toLowerCase();
    const matchesQuery = g.name.toLowerCase().includes(q) || g.location.toLowerCase().includes(q);
    const matchesCat = activeCategory === "All" || g.category === activeCategory;
    return matchesQuery && matchesCat;
  });

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm({ ...form, imageUrl: "" });
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.location.trim()) return;
    setSubmitting(true);
    setSubmitError("");

    const status = isAdmin ? "approved" : "pending";

    try {
      if (!isSupabaseConfigured) {
        setSubmitted(true);
        setSubmitting(false);
        return;
      }

      // Upload image if file was picked
      let finalImageUrl = form.imageUrl.trim();
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `gems/${user?.id ?? "anon"}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("gem-images")
          .upload(path, imageFile, { upsert: true, contentType: imageFile.type });
        if (uploadError) throw new Error("Image upload failed: " + uploadError.message);
        const { data: { publicUrl } } = supabase.storage.from("gem-images").getPublicUrl(path);
        finalImageUrl = publicUrl;
      }

      const { error } = await supabase.from("hidden_gems").insert({
        name: form.name.trim(),
        location: form.location.trim(),
        category: form.category,
        description: form.description.trim(),
        images: finalImageUrl ? [finalImageUrl] : [],
        budget_level: form.budget_level,
        rating: form.rating ? parseFloat(form.rating) : 0,
        review_count: form.review_count ? parseInt(form.review_count) : 0,
        tip: form.tip.trim(),
        is_featured: isAdmin ? form.is_featured : false,
        status,
        submitted_by: user?.id ?? null,
      });

      if (error) throw new Error(error.message);

      setSubmitted(true);
      if (isAdmin) fetchGems();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitted(false);
    setForm(EMPTY_FORM);
    setSubmitError("");
    clearImage();
  };

  return (
    <AppShell>
      {/* ── Submit Gem Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-slate-900">
                {submitted ? "Gem Submitted! 🎉" : isAdmin ? "Add a Hidden Gem" : "Submit a Hidden Gem"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">
                  {isAdmin ? "Gem added successfully!" : "Thanks for sharing!"}
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  {isAdmin
                    ? "Your gem is now live and visible to everyone."
                    : "Your submission is pending review. We'll add it to the map soon!"}
                </p>
                <button onClick={closeModal}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl transition">
                  Done
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {submitError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-600">
                    ⚠️ {submitError}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gem Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Tinago Falls"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Location *</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Iligan City, Lanao del Norte"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* Category + Budget */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Budget</label>
                    <select
                      value={form.budget_level}
                      onChange={(e) => setForm({ ...form, budget_level: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="₱">₱ Budget</option>
                      <option value="₱₱">₱₱ Mid-range</option>
                      <option value="₱₱₱">₱₱₱ Premium</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What makes this place special?"
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                  />
                </div>

                {/* Image — upload or URL */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Photo</label>

                  {/* Mode toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => { setImageMode("upload"); clearImage(); setForm({ ...form, imageUrl: "" }); }}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${imageMode === "upload" ? "bg-sky-600 border-sky-600 text-white" : "border-slate-200 text-slate-500 hover:border-sky-300"}`}
                    >
                      <Image className="h-3 w-3" /> Upload photo
                    </button>
                    <button
                      onClick={() => { setImageMode("url"); clearImage(); }}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${imageMode === "url" ? "bg-sky-600 border-sky-600 text-white" : "border-slate-200 text-slate-500 hover:border-sky-300"}`}
                    >
                      <Link2 className="h-3 w-3" /> Paste URL
                    </button>
                  </div>

                  {imageMode === "upload" ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFilePick}
                      />
                      {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-100">
                          <img src={imagePreview} alt="" className="w-full max-h-40 object-cover" />
                          <button
                            onClick={clearImage}
                            className="absolute top-2 right-2 h-7 w-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-slate-200 rounded-xl py-6 text-center hover:border-sky-300 transition"
                        >
                          <Image className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                          <p className="text-xs text-slate-400">Click to upload a photo</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">JPG, PNG, WEBP</p>
                        </button>
                      )}
                    </>
                  ) : (
                    <div>
                      <input
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Paste a direct image link (Unsplash, etc.)</p>
                      {form.imageUrl && (
                        <img src={form.imageUrl} alt="" className="mt-2 w-full max-h-32 object-cover rounded-xl border border-slate-100" onError={(e) => (e.currentTarget.style.display = "none")} />
                      )}
                    </div>
                  )}
                </div>

                {/* Rating + Review Count */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Rating (0–5)</label>
                    <input
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                      placeholder="4.8"
                      type="number" min="0" max="5" step="0.1"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Review Count</label>
                    <input
                      value={form.review_count}
                      onChange={(e) => setForm({ ...form, review_count: e.target.value })}
                      placeholder="120"
                      type="number" min="0"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                {/* Tip */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Insider Tip</label>
                  <input
                    value={form.tip}
                    onChange={(e) => setForm({ ...form, tip: e.target.value })}
                    placeholder="e.g. Go early morning to avoid crowds"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* ✨ Feature checkbox — ADMIN ONLY */}
                {isAdmin && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                        className="h-4 w-4 rounded accent-amber-500"
                      />
                      <div>
                        <p className="text-sm text-slate-800 font-medium">✨ Feature this gem</p>
                        <p className="text-[10px] text-slate-500">Appears in "Featured by TCUnnect" — admin only</p>
                      </div>
                    </label>
                  </div>
                )}

                {!isAdmin && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                    📋 Your submission will be reviewed by our team before going live.
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!form.name.trim() || !form.location.trim() || submitting}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isAdmin ? "Add Gem Now" : "Submit for Review"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hidden Gems</h1>
            <p className="text-slate-500 text-sm mt-1">Discover underrated destinations across the Philippines</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
            >
              <Plus className="h-4 w-4" /> Add Gem
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gems, cities, islands..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                activeCategory === cat ? "bg-sky-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
          </div>
        )}

        {/* Gem grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((gem) => {
              const isSaved = savedMap.has(gem.id);
              const isSaving = savingGemId === gem.id;
              return (
                <div
                  key={gem.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col"
                >
                  {/* Clickable image + info area */}
                  <Link to={`/gems/${gem.id}`} className="block">
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      {gem.images?.[0] ? (
                        <img
                          src={gem.images[0]}
                          alt={gem.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          {CATEGORY_EMOJIS[gem.category] ?? "📍"}
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-white/90 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full">
                        {CATEGORY_EMOJIS[gem.category] ?? "📍"} {gem.category}
                      </span>
                      {gem.is_featured && (
                        <span className="absolute bottom-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          ✨ Featured
                        </span>
                      )}
                    </div>
                    <div className="p-4 pb-2">
                      <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{gem.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3" /> {gem.location}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                          <span className="text-xs font-medium text-slate-700">{gem.rating || "—"}</span>
                          <span className="text-xs text-slate-400">({gem.review_count || 0})</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{gem.budget_level}</span>
                      </div>
                      {gem.tip && <p className="text-xs text-sky-600 mt-2 italic line-clamp-1">💡 {gem.tip}</p>}
                    </div>
                  </Link>

                  {/* Action buttons — outside Link so they don't navigate */}
                  <div className="px-4 pb-4 pt-2 flex gap-2 mt-auto">
                    <Link
                      to={`/booking/${gem.id}`}
                      className="flex-1 text-center text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3 py-2 rounded-lg transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Book a Trip
                    </Link>
                    <button
                      onClick={(e) => toggleSave(gem.id, e)}
                      disabled={isSaving}
                      className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition border ${
                        isSaved
                          ? "bg-sky-50 border-sky-200 text-sky-700"
                          : "bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-700"
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-sky-600 text-sky-600" : ""}`} />
                      )}
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty states */}
        {!loading && gems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="font-semibold text-slate-700 mb-1">No gems yet</h3>
            <p className="text-slate-400 text-sm mb-5">Be the first to add a hidden gem!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition"
            >
              Add the First Gem
            </button>
          </div>
        )}

        {!loading && gems.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-slate-500 text-sm">No gems found for "{query}"</p>
          </div>
        )}

        {/* Submit banner */}
        <div className="mt-10 bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">📍</div>
          <h3 className="font-bold text-slate-900 mb-1">Know a hidden gem?</h3>
          <p className="text-slate-500 text-sm mb-4">Share it with the TCUnnect community</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition"
          >
            Submit a Gem
          </button>
        </div>
      </div>
    </AppShell>
  );
}
