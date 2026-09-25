import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { MapPin, Star, Sparkles, ArrowRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const CATEGORY_EMOJIS: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Heritage: "🏛",
  Cafe: "☕", Waterfalls: "💦", City: "🌆", Food: "🍜",
};

interface FeaturedGem {
  id: string;
  name: string;
  location: string;
  category: string;
  images: string[];
  rating: number;
  review_count: number;
}

const CATEGORY_META: Record<string, { subtitle: string }> = {
  Beach:                    { subtitle: "The Philippines' most breathtaking shores" },
  "Beach & Island Hopping": { subtitle: "The Philippines' most breathtaking shores" },
  Mountain:                 { subtitle: "Trek, explore, and reconnect with nature" },
  "Nature & Hiking":        { subtitle: "Untouched landscapes worth protecting" },
  Nature:                   { subtitle: "Untouched landscapes worth protecting" },
  Heritage:                 { subtitle: "Discover the Philippines' rich history" },
  "History & Culture":      { subtitle: "Discover the Philippines' rich history" },
  Waterfalls:               { subtitle: "Chase cascades and cool off" },
  Cafe:                     { subtitle: "Cozy corners and ube lattes" },
  "Food & Cafés":           { subtitle: "Filipino flavors, local finds" },
  Food:                     { subtitle: "Filipino flavors, local finds" },
  City:                     { subtitle: "Urban adventures and hidden spots" },
  "City Exploring":         { subtitle: "Urban adventures and hidden spots" },
  Photography:              { subtitle: "Frames worth chasing" },
  "Adventure & Thrills":    { subtitle: "For the fearless explorer" },
  "Scenic & Sunset Spots":  { subtitle: "Golden hour, every hour" },
  "Hidden Gems":            { subtitle: "Off the beaten path discoveries" },
};

export default function Featured() {
  const [gems, setGems] = useState<FeaturedGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    async function fetchFeatured() {
      setLoading(true);
      if (!isSupabaseConfigured) { setLoading(false); return; }
      const { data } = await supabase
        .from("hidden_gems")
        .select("id, name, location, category, images, rating, review_count")
        .eq("status", "approved")
        .eq("is_featured", true)
        .order("rating", { ascending: false });
      setGems((data as FeaturedGem[]) ?? []);
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  const total = gems.length;
  const hero = gems[heroIndex];

  const prev = useCallback(() =>
    setHeroIndex((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() =>
    setHeroIndex((i) => (i + 1) % total), [total]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [total, next]);

  const byCategory = gems.slice(1).reduce<Record<string, FeaturedGem[]>>((acc, gem) => {
    if (!acc[gem.category]) acc[gem.category] = [];
    acc[gem.category].push(gem);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Featured Gems</h1>
          <p className="text-slate-500 text-sm mt-1">Curated highlights from across the Philippines</p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
          </div>
        )}

        {!loading && gems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="font-semibold text-slate-700 mb-1">No featured gems yet</h3>
            <p className="text-slate-400 text-sm">
              Add gems in Supabase and set{" "}
              <code className="bg-slate-100 px-1 rounded">is_featured = true</code> to feature them here.
            </p>
          </div>
        )}

        {!loading && hero && (
          <>
            {/* ── Hero Carousel ─────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden h-56 lg:h-72 select-none">
              {/* Slide image */}
              <img
                key={hero.id}
                src={hero.images?.[0] ?? ""}
                alt={hero.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

              {/* Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1.5 rounded-full shadow">
                  ✨ FEATURED BY TCUNNECT
                </span>
              </div>

              {/* Dot indicators — top right */}
              {total > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  {gems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`rounded-full transition-all duration-300 ${
                        i === heroIndex
                          ? "w-5 h-1.5 bg-white"
                          : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Prev arrow — always visible, subtle */}
              {total > 1 && (
                <button
                  onClick={prev}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {/* Next arrow — always visible, subtle */}
              {total > 1 && (
                <button
                  onClick={next}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* Gem info */}
              <div className="absolute bottom-5 left-5 text-white">
                <h2 className="text-2xl font-bold drop-shadow">{hero.name}</h2>
                <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" /> {hero.location}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-4 w-4 text-amber-400 fill-current" />
                  <span className="text-sm font-semibold">{hero.rating}</span>
                  <span className="text-white/60 text-xs">({hero.review_count} reviews)</span>
                </div>
              </div>

              <Link
                to={`/gems/${hero.id}`}
                className="absolute bottom-5 right-5 bg-white text-slate-900 text-xs font-semibold px-4 py-2 rounded-full hover:bg-sky-50 transition flex items-center gap-1 shadow"
              >
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* ── Editor's Picks grid ───────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Editor's Picks</h2>
                  <p className="text-xs text-slate-500">Hand-curated by the TCUnnect team</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gems.map((gem) => (
                  <GemCard key={gem.id} gem={gem} />
                ))}
              </div>
            </section>

            {/* ── Per-category sections ─────────────────────────── */}
            {Object.entries(byCategory).map(([cat, catGems]) => {
              const meta = CATEGORY_META[cat] ?? { subtitle: "" };
              return (
                <section key={cat}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{CATEGORY_EMOJIS[cat] ?? "📍"}</span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{cat}</h2>
                      <p className="text-xs text-slate-500">{meta.subtitle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catGems.map((gem) => (
                      <GemCard key={gem.id} gem={gem} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </AppShell>
  );
}

function GemCard({ gem }: { gem: FeaturedGem }) {
  return (
    <Link
      to={`/gems/${gem.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={gem.images?.[0] ?? ""}
          alt={gem.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-3 left-3 bg-white/90 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
          {CATEGORY_EMOJIS[gem.category] ?? "📍"} {gem.category}
        </span>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="text-white">
            <p className="font-bold text-sm">{gem.name}</p>
            <p className="text-white/80 text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {gem.location}
            </p>
          </div>
          <div className="flex items-center gap-0.5 bg-black/30 rounded-full px-2 py-1">
            <Star className="h-3 w-3 text-amber-400 fill-current" />
            <span className="text-white text-xs font-semibold">{gem.rating}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
