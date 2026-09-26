import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { Bookmark, MapPin, Star, Loader2, Trash2, ChevronRight, Compass } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const CATEGORIES = ["All", "Beach", "Mountain", "Nature", "Heritage", "Cafe", "Waterfalls", "City", "Food"];

const CATEGORY_EMOJIS: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Heritage: "🏛",
  Cafe: "☕", Waterfalls: "💦", City: "🌆", Food: "🍜",
};

interface SavedGem {
  id: string;           // saved_places.id
  gem_id: string;
  gem_name: string;
  gem_location: string;
  gem_category: string;
  gem_images: string[];
  gem_rating: number;
  created_at: string;
}

export default function SavedPlaces() {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState<SavedGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchSaved();
  }, [user?.id]);

  async function fetchSaved() {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("saved_places")
      .select(`
        id,
        gem_id,
        created_at,
        hidden_gems (
          name,
          location,
          category,
          images,
          rating
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const mapped: SavedGem[] = data
        .filter((row: any) => row.hidden_gems)
        .map((row: any) => ({
          id: row.id,
          gem_id: row.gem_id,
          gem_name: row.hidden_gems.name ?? "Hidden Gem",
          gem_location: row.hidden_gems.location ?? "",
          gem_category: row.hidden_gems.category ?? "",
          gem_images: row.hidden_gems.images ?? [],
          gem_rating: row.hidden_gems.rating ?? 0,
          created_at: row.created_at,
        }));
      setSaved(mapped);
    }
    setLoading(false);
  }

  async function handleRemove(savedId: string) {
    setRemoving(savedId);
    if (isSupabaseConfigured) {
      await supabase.from("saved_places").delete().eq("id", savedId);
    }
    setSaved(prev => prev.filter(s => s.id !== savedId));
    setRemoving(null);
  }

  const filtered = activeCategory === "All"
    ? saved
    : saved.filter(s => s.gem_category === activeCategory);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Bookmark className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Saved Places</h1>
            <p className="text-sm text-slate-500">Your personal list of hidden gems</p>
          </div>
        </div>

        {/* Category filter chips */}
        {!loading && saved.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  activeCategory === cat
                    ? "bg-sky-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"
                }`}
              >
                {cat === "All" ? "All" : `${CATEGORY_EMOJIS[cat] ?? ""} ${cat}`}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 text-sky-500 animate-spin" />
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">No saved places yet</h2>
            <p className="text-slate-500 text-sm mb-6">
              Tap the bookmark icon on any hidden gem to save it here.
            </p>
            <Link
              to="/hidden-gems"
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
            >
              <Compass className="h-4 w-4" /> Explore Hidden Gems
            </Link>
          </div>
        ) : filtered.length === 0 && activeCategory !== "All" ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">{CATEGORY_EMOJIS[activeCategory] ?? "📍"}</div>
            <p className="text-slate-500 text-sm">No saved {activeCategory} places yet.</p>
            <button onClick={() => setActiveCategory("All")} className="mt-3 text-sky-600 text-sm font-medium hover:underline">
              Show all saved places
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium mb-4">
              {filtered.length} place{filtered.length !== 1 ? "s" : ""}{activeCategory !== "All" ? ` in ${activeCategory}` : " saved"}
            </p>
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex gap-0"
              >
                {/* Image */}
                <div className="w-28 h-28 flex-shrink-0 bg-slate-100 relative overflow-hidden">
                  {item.gem_images?.[0] ? (
                    <img
                      src={item.gem_images[0]}
                      alt={item.gem_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {CATEGORY_EMOJIS[item.gem_category] ?? "📍"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{item.gem_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-rose-400 flex-shrink-0" />
                        <span className="truncate">{item.gem_location}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {CATEGORY_EMOJIS[item.gem_category] ?? "📍"} {item.gem_category}
                        </span>
                        {item.gem_rating > 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-current" /> {item.gem_rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removing === item.id}
                      className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition"
                      title="Remove from saved"
                    >
                      {removing === item.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/gems/${item.gem_id}`}
                      className="flex-1 text-center text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      View Details <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to={`/booking/${item.gem_id}`}
                      className="flex-1 text-center text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-lg transition"
                    >
                      Book a Trip
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
