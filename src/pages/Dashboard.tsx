import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { ArrowRight, MapPin, Sparkles, Users, Star, TrendingUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const CATEGORY_EMOJIS: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Heritage: "🏛",
  Cafe: "☕", Waterfalls: "💦", City: "🌆", Food: "🍜",
};

const INTEREST_BG: Record<string, string> = {
  Beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
  Mountain: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
  Nature: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80",
  Heritage: "https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=600&q=80",
  Cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80",
  Waterfalls: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80",
  City: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80",
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
};

const HERO_BG = "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200&q=80";

const DEFAULT_TRAVELER_BG = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80";

interface FeaturedGem {
  id: string;
  name: string;
  location: string;
  images: string[];
  category: string;
  budget_level: string;
  description: string;
  is_featured?: boolean;
}

interface TravelerCard {
  id: string;
  full_name: string;
  age?: number;
  location: string;
  travel_interests: string[];
  profile_photo: string;
}

interface PostCard {
  id: string;
  content: string;
  location: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Featured Gem Carousel ────────────────────────────────────────────────────
function FeaturedCarousel({ gems }: { gems: FeaturedGem[] }) {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    if (animating || gems.length <= 1) return;
    setAnimating(true);
    setTimeout(() => {
      setIdx((next + gems.length) % gems.length);
      setAnimating(false);
    }, 220);
  }, [animating, gems.length]);

  const prev = () => go(idx - 1);
  const next = () => go(idx + 1);

  // Auto-advance every 4 s
  useEffect(() => {
    if (gems.length <= 1) return;
    timerRef.current = setInterval(() => go(idx + 1), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx, gems.length, go]);

  // Touch swipe
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  }

  if (!gems.length) return null;
  const gem = gems[idx];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Featured Gems</h2>
        </div>
        <Link to="/featured" className="text-sm text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden h-56 lg:h-72 group select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slide image — fade transition */}
        <img
          key={gem.id}
          src={gem.images?.[0] ?? ""}
          alt={gem.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

        {/* Text content — left side */}
        <div className={`absolute inset-0 flex flex-col justify-center px-6 lg:px-8 max-w-[65%] transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}>
          <span className="inline-block bg-amber-400 text-amber-950 text-[10px] font-extrabold tracking-wider px-3 py-1 rounded-full mb-3 self-start">
            ✨ FEATURED BY TCUNNECT
          </span>
          <h3 className="text-xl lg:text-2xl font-bold text-white leading-tight mb-1">{gem.name}</h3>
          <p className="flex items-center gap-1 text-white/80 text-sm mb-2">
            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" /> {gem.location}
          </p>
          {gem.description && (
            <p className="text-white/70 text-sm line-clamp-2 mb-3">{gem.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              {CATEGORY_EMOJIS[gem.category] ?? "📍"} {gem.category}
            </span>
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              {gem.budget_level}
            </span>
          </div>
        </div>

        {/* Prev arrow */}
        {gems.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-9 w-9 flex items-center justify-center transition backdrop-blur-sm"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Next / View arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <Link
            to={`/gems/${gem.id}`}
            className="bg-white hover:bg-sky-50 text-slate-800 rounded-full h-11 w-11 flex items-center justify-center shadow-lg transition"
            aria-label="View gem"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          {gems.length > 1 && (
            <button
              onClick={next}
              className="bg-black/40 hover:bg-black/60 text-white rounded-full h-9 w-9 flex items-center justify-center transition backdrop-blur-sm"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {gems.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {gems.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-full transition-all duration-300 ${i === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/75"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore();
  const [featuredGems, setFeaturedGems] = useState<FeaturedGem[]>([]);
  const [popularGems, setPopularGems] = useState<FeaturedGem[]>([]);
  const [travelers, setTravelers] = useState<TravelerCard[]>([]);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      if (!isSupabaseConfigured) { setLoading(false); return; }

      const [gemsRes, travelersRes, postsRes] = await Promise.all([
        supabase
          .from("hidden_gems")
          .select("id, name, location, category, images, budget_level, description, is_featured")
          .eq("status", "approved")
          .order("is_featured", { ascending: false })
          .order("rating", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("id, full_name, age, location, travel_interests, profile_photo")
          .neq("id", user?.id ?? "")
          .not("travel_interests", "eq", "{}")
          .limit(4),
        supabase
          .from("posts")
          .select("id, content, location, upvotes, comment_count, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
      ]);

      const gems = (gemsRes.data ?? []) as FeaturedGem[];
      // Show ALL featured gems in carousel; fall back to top gems if none are marked featured
      const featuredOnes = gems.filter(g => g.is_featured);
      const featured = featuredOnes.length > 0 ? featuredOnes : gems.slice(0, 4);
      setFeaturedGems(featured);
      setPopularGems(gems.filter(g => !featured.includes(g)).slice(0, 3));

      setTravelers((travelersRes.data ?? []) as TravelerCard[]);
      setPosts((postsRes.data ?? []) as PostCard[]);

      setLoading(false);
    }
    loadDashboard();
  }, []);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-10">

        {/* ── Hero ── */}
        <section className="rounded-2xl overflow-hidden bg-sky-50 min-h-[200px] lg:min-h-[240px] flex flex-col lg:flex-row shadow-sm">
          {/* Left: text */}
          <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-10 lg:py-0 z-10">
            <p className="text-sky-500 text-sm font-semibold mb-1">{greeting}, ✈️</p>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight mb-1">
              {user?.fullName ?? "Traveler"}
            </h1>
            <p className="text-slate-500 text-sm mb-5">Where will you go next?</p>
            <Link
              to="/hidden-gems"
              className="self-start inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition shadow"
            >
              Explore Hidden Gems <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: photo */}
          <div className="relative flex-1 min-h-[160px] lg:min-h-0">
            <img
              src={HERO_BG}
              alt="Philippines travel"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* left-fade so text side blends on desktop */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-50 via-sky-50/30 to-transparent lg:block hidden" />
            {/* script overlay */}
            <div className="absolute bottom-4 right-4 text-right">
              <p className="text-white font-serif italic text-lg lg:text-xl drop-shadow-md leading-tight">
                Better Trips Together
              </p>
            </div>
          </div>
        </section>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Featured Gems Carousel ── */}
            {featuredGems.length > 0 && <FeaturedCarousel gems={featuredGems} />}

            {/* ── Recommended Travelers ── */}
            {travelers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-sky-500" />
                    <h2 className="text-lg font-bold text-slate-900">Recommended Travelers</h2>
                  </div>
                  <Link to="/discover-people" className="text-sm text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
                    Discover more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Horizontal scroll on mobile, 4-col grid on larger screens */}
                <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
                  {travelers.map((t) => {
                    const primaryInterest = (t.travel_interests ?? [])[0];
                    const bgImage = INTEREST_BG[primaryInterest] ?? DEFAULT_TRAVELER_BG;
                    return (
                      <Link
                        key={t.id}
                        to={`/profile/${t.id}`}
                        className="relative rounded-2xl overflow-hidden shrink-0 w-44 sm:w-auto group"
                        style={{ aspectRatio: "3/4" }}
                      >
                        {/* Background photo */}
                        <img
                          src={bgImage}
                          alt={primaryInterest ?? "travel"}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Interest tag — top right */}
                        {primaryInterest && (
                          <span className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {CATEGORY_EMOJIS[primaryInterest] ?? "✈️"} {primaryInterest}
                          </span>
                        )}

                        {/* Bottom: avatar + name/location */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                          <div className="flex items-center gap-2">
                            {t.profile_photo ? (
                              <img
                                src={t.profile_photo}
                                alt={t.full_name}
                                className="h-9 w-9 rounded-full object-cover border-2 border-white shadow"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-sky-500 border-2 border-white shadow flex items-center justify-center text-white font-bold text-sm">
                                {t.full_name?.[0] ?? "?"}
                              </div>
                            )}
                            <div>
                              <p className="text-white font-semibold text-xs leading-tight">{t.full_name}</p>
                              <p className="text-white/70 text-[10px] flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5 shrink-0" /> {t.location || "Philippines"}
                              </p>
                            </div>
                          </div>
                          {/* Star placeholder — no fake rating */}
                          <span className="text-amber-300 text-xs font-bold">★</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Popular Gems ── */}
            {popularGems.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-slate-900">Popular Hidden Gems</h2>
                  </div>
                  <Link to="/hidden-gems" className="text-sm text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
                    Explore all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {popularGems.map((gem) => (
                    <Link key={gem.id} to={`/gems/${gem.id}`}
                      className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition">
                      <div className="h-40 overflow-hidden">
                        <img src={gem.images?.[0] ?? ""} alt={gem.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 text-sm">{gem.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{gem.location}</p>
                          </div>
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            {CATEGORY_EMOJIS[gem.category] ?? "📍"} {gem.category}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Community Posts ── */}
            {posts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-rose-500" />
                    <h2 className="text-lg font-bold text-slate-900">Community</h2>
                  </div>
                  <Link to="/community" className="text-sm text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">?</div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">TCUnnect Traveler</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            {post.location && <><MapPin className="h-2.5 w-2.5" /> {post.location} · </>}
                            {timeAgo(post.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>▲ {post.upvotes}</span>
                        <span>💬 {post.comment_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
