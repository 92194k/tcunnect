import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import {
  ArrowRight, MapPin, Sparkles, Users, Loader2,
  ChevronLeft, ChevronRight, Heart, MoreHorizontal,
  ThumbsUp, MessageCircle, Share2, Bookmark,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────
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
const PROMO_BG = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  cover_photo?: string;
}

interface PostCard {
  id: string;
  content: string;
  location: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
  profiles?: { full_name: string; profile_photo: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (gems.length <= 1) return;
    timerRef.current = setInterval(() => go(idx + 1), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx, gems.length, go]);

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
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-lg">⭐</span>
          <h2 className="text-base font-bold text-slate-900">Featured Gems</h2>
        </div>
        <Link
          to="/featured"
          className="text-sm text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1 transition"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Carousel card */}
      <Link
        to={`/gems/${gem.id}`}
        className="relative rounded-2xl overflow-hidden h-60 lg:h-80 group select-none block shadow-md"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slide image */}
        <img
          key={gem.id}
          src={gem.images?.[0] ?? ""}
          alt={gem.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:scale-[1.02] transition-transform duration-700 ${animating ? "opacity-0" : "opacity-100"}`}
        />

        {/* Gradient overlay — strong on left, fades right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Left text content */}
        <div className={`absolute inset-0 z-20 flex flex-col justify-center px-6 lg:px-10 max-w-[70%] transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}>
          <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full mb-3 self-start shadow-sm">
            ✨ Featured by TCUnnect
          </span>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-2">{gem.name}</h3>
          <p className="flex items-center gap-1.5 text-white/80 text-sm mb-3">
            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            {gem.location}
          </p>
          {gem.description && (
            <p className="text-white/70 text-sm line-clamp-2 mb-4 max-w-sm">{gem.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
              {CATEGORY_EMOJIS[gem.category] ?? "📍"} {gem.category}
            </span>
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
              {gem.budget_level}
            </span>
          </div>
        </div>

        {/* Nav arrows */}
        {gems.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/70 text-white rounded-full h-9 w-9 flex items-center justify-center transition backdrop-blur-sm border border-white/10"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/70 text-white rounded-full h-9 w-9 flex items-center justify-center transition backdrop-blur-sm border border-white/10"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {gems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
            {gems.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); go(i); }}
                className={`rounded-full transition-all duration-300 ${i === idx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </Link>
    </section>
  );
}

// ─── Traveler Card ────────────────────────────────────────────────────────────
function TravelerCardUI({ t }: { t: TravelerCard }) {
  const interests = (t.travel_interests ?? []).filter(Boolean);
  const primaryInterest = interests[0];
  const bgImage = t.cover_photo || t.profile_photo || INTEREST_BG[primaryInterest] || DEFAULT_TRAVELER_BG;

  return (
    <Link
      to={`/profile/${t.id}`}
      // min-height keeps cards uniform; body expands on hover to fit all tags
      className="group block bg-white rounded-2xl overflow-visible shadow-sm border border-slate-100 hover:shadow-md transition duration-300 relative"
      style={{ minHeight: "280px" }}
    >
      {/* Cover image — fixed height */}
      <div className="relative rounded-t-2xl overflow-hidden" style={{ height: "140px" }}>
        <img
          src={bgImage}
          alt={t.full_name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Heart top-right */}
        <button
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-3 right-3 h-7 w-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition"
          aria-label="Save traveler"
        >
          <Heart className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-400 transition" />
        </button>

        {/* Primary interest badge top-left */}
        {primaryInterest && (
          <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            {CATEGORY_EMOJIS[primaryInterest] ?? "✈️"} {primaryInterest}
          </span>
        )}
      </div>

      {/* Profile photo — overlapping image and card body */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "112px" }}>
        {t.profile_photo ? (
          <img
            src={t.profile_photo}
            alt={t.full_name}
            className="h-14 w-14 rounded-full object-cover border-[3px] border-white shadow-md"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 border-[3px] border-white shadow-md flex items-center justify-center text-white font-bold text-lg">
            {t.full_name?.[0] ?? "?"}
          </div>
        )}
      </div>

      {/* Card body — expands naturally on hover to show all tags inside white area */}
      <div className="pt-10 pb-4 px-4 text-center" style={{ minHeight: "140px" }}>
        <p className="font-bold text-slate-900 text-sm leading-tight truncate">{t.full_name}</p>
        {t.location && (
          <p className="flex items-center justify-center gap-1 text-slate-500 text-xs mt-0.5">
            <MapPin className="h-3 w-3 shrink-0 text-rose-400" />
            <span className="truncate">{t.location}</span>
          </p>
        )}

        {/* Default: show first 2 tags only */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-3 group-hover:hidden">
          {interests.slice(0, 2).map((interest) => (
            <span
              key={interest}
              className="bg-sky-50 text-sky-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-sky-100"
            >
              {interest}
            </span>
          ))}
        </div>

        {/* Hover: show ALL tags */}
        <div className="hidden group-hover:flex flex-wrap justify-center gap-1.5 mt-3">
          {interests.map((interest) => (
            <span
              key={interest}
              className="bg-sky-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full"
            >
              {CATEGORY_EMOJIS[interest] ?? "✈️"} {interest}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── Community Post Card ──────────────────────────────────────────────────────
function CommunityPostCard({ post }: { post: PostCard }) {
  const authorName = post.profiles?.full_name ?? "TCUnnect Traveler";
  const authorPhoto = post.profiles?.profile_photo ?? "";
  const initial = authorName[0]?.toUpperCase() ?? "T";

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.upvotes ?? 0);
  const [liking, setLiking] = useState(false);

  async function handleLike() {
    if (liking) return;
    // Optimistic update
    const next = liked ? likeCount - 1 : likeCount + 1;
    setLiked(!liked);
    setLikeCount(next);
    setLiking(true);
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from("posts")
          .update({ upvotes: next })
          .eq("id", post.id);
      }
    } catch {
      // Revert on failure
      setLiked(liked);
      setLikeCount(likeCount);
    } finally {
      setLiking(false);
    }
  }

  // Extract hashtags from content
  const hashtags = post.content.match(/#\w+/g) ?? [];
  const cleanContent = post.content.replace(/#\w+/g, "").trim();

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-full">
      {/* Author row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {authorPhoto ? (
            <img
              src={authorPhoto}
              alt={authorName}
              className="h-10 w-10 rounded-full object-cover border-2 border-slate-100"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initial}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">{authorName}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              {post.location && (
                <>
                  <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                  <span>{post.location}</span>
                  <span>·</span>
                </>
              )}
              {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-700 leading-relaxed mb-2">{cleanContent}</p>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {hashtags.map((tag) => (
            <span key={tag} className="text-sky-500 text-xs font-medium hover:text-sky-600 cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition font-medium select-none
            ${liked
              ? "text-rose-500 bg-rose-50 hover:bg-rose-100"
              : "text-slate-500 hover:text-rose-500 hover:bg-rose-50"
            }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 transition-transform ${liked ? "scale-110 fill-rose-500 stroke-rose-500" : ""}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
          <span>{liked ? "Liked" : "Like"}</span>
        </button>
        <Link to="/community" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition font-medium">
          <MessageCircle className="h-3.5 w-3.5" />
          {post.comment_count > 0 ? post.comment_count : ""} Comment
        </Link>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition font-medium">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition">
          <Bookmark className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Community Promo Card ─────────────────────────────────────────────────────
function CommunityPromoCard() {
  return (
    <div className="relative rounded-2xl overflow-hidden h-full min-h-[260px] shadow-sm">
      {/* Background image */}
      <img
        src={PROMO_BG}
        alt="Travel together"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Sky blue overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-600/90 via-sky-500/80 to-sky-400/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-6">
        {/* Top label */}
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full self-start border border-white/20">
          ✈️ TCUnnect
        </div>

        {/* Main copy */}
        <div className="mt-auto">
          <h3 className="text-xl font-extrabold text-white leading-tight mb-2">
            Share your journey,<br />
            find your people.
          </h3>
          <p className="text-white/80 text-sm mb-4">Real travelers. Great stories.</p>
          <Link
            to="/community"
            className="inline-flex items-center gap-2 bg-white text-sky-700 font-bold text-sm px-4 py-2.5 rounded-full hover:bg-sky-50 transition shadow"
          >
            Join the community <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore();
  const [featuredGems, setFeaturedGems] = useState<FeaturedGem[]>([]);
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
          .select("id, full_name, age, location, travel_interests, profile_photo, cover_photo")
          .neq("id", user?.id ?? "")
          .not("travel_interests", "eq", "{}")
          .limit(4),
        supabase
          .from("posts")
          .select("id, content, location, upvotes, comment_count, created_at, profiles:user_id(full_name, profile_photo)")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const gems = (gemsRes.data ?? []) as FeaturedGem[];
      const featuredOnes = gems.filter(g => g.is_featured);
      const featured = featuredOnes.length > 0 ? featuredOnes : gems.slice(0, 5);
      setFeaturedGems(featured);

      setTravelers((travelersRes.data ?? []) as TravelerCard[]);
      setPosts((postsRes.data ?? []) as unknown as PostCard[]);

      setLoading(false);
    }
    loadDashboard();
  }, []);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">

        {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
        <section className="relative rounded-2xl overflow-hidden bg-sky-50 shadow-sm" style={{ minHeight: "220px" }}>
          <div className="flex flex-col lg:flex-row min-h-[220px]">
            {/* Left: text */}
            <div className="flex-1 flex flex-col justify-center px-7 py-8 lg:px-10 lg:py-10 z-10 relative">
              <p className="text-sky-500 text-sm font-semibold mb-1 flex items-center gap-1.5">
                ✈️ {greeting},
              </p>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-1.5 tracking-tight">
                {user?.fullName?.split(" ")[0] ?? "Traveler"}
              </h1>
              <p className="text-slate-500 text-base mb-6">Where will you go next?</p>
              <Link
                to="/hidden-gems"
                className="self-start inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-full text-sm transition shadow-md hover:shadow-lg"
              >
                Explore Hidden Gems <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right: travel image */}
            <div className="relative flex-1 min-h-[180px] lg:min-h-0">
              <img
                src={HERO_BG}
                alt="Philippines travel"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Blend left edge into sky-50 */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-50 via-sky-50/20 to-transparent hidden lg:block" />
              {/* Vignette bottom for mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-sky-50/60 to-transparent lg:hidden" />

              {/* Tagline */}
              <div className="absolute bottom-5 right-5 text-right z-10">
                <p className="text-white font-bold text-lg lg:text-xl drop-shadow-lg leading-snug">
                  Better Trips<br />Together
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Loading spinner ── */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Featured Gems Carousel ────────────────────────────────────── */}
            {featuredGems.length > 0 && <FeaturedCarousel gems={featuredGems} />}

            {/* ── Recommended Travelers ─────────────────────────────────────── */}
            {travelers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-500 text-lg">👥</span>
                    <h2 className="text-base font-bold text-slate-900">Recommended Travelers</h2>
                  </div>
                  <Link
                    to="/discover-people"
                    className="text-sm text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1 transition"
                  >
                    Discover more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* 4-col desktop, 2-col tablet, horizontal scroll mobile */}
                <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
                  {travelers.map((t) => (
                    <div key={t.id} className="shrink-0 w-44 sm:w-auto">
                      <TravelerCardUI t={t} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Community ─────────────────────────────────────────────────── */}
            {posts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <h2 className="text-base font-bold text-slate-900">Community</h2>
                  </div>
                  <Link
                    to="/community"
                    className="text-sm text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1 transition"
                  >
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Two-column: big post left, promo right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left — featured post (takes 2/3 width on desktop) */}
                  <div className="lg:col-span-2 space-y-4">
                    {posts.slice(0, 2).map((post) => (
                      <CommunityPostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {/* Right — promo card */}
                  <div className="hidden lg:block">
                    <CommunityPromoCard />
                  </div>
                </div>

                {/* Mobile promo — shown below posts on small screens */}
                <div className="lg:hidden mt-4">
                  <CommunityPromoCard />
                </div>
              </section>
            )}
          </>
        )}

        {/* Bottom padding for mobile nav */}
        <div className="h-4" />
      </div>
    </AppShell>
  );
}
