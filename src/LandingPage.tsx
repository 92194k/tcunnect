import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

// ─── 🖼  YOUR HERO PHOTO ──────────────────────────────────────────────────────
// Replace this URL with your own photo URL to show it in the hero section.
// Upload your photo to Supabase Storage or any image host, then paste the URL here.
// Example: "https://your-bucket.supabase.co/storage/v1/object/public/photos/hero.jpg"
const HERO_PHOTO_URL = "/Gemini_Generated_Image_efsm2iefsm2iefsm.jpg";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturedGem {
  id: string;
  name: string;
  location: string;
  category: string;
  images: string[];
  description: string;
  budget_level: string;
}

interface CategoryGem {
  id: string;
  name: string;
  location: string;
  category: string;
  images: string[];
}

interface PublicProfile {
  id: string;
  full_name: string;
  profile_photo: string | null;
  home_city: string | null;
  travel_style: string | null;
  interests: string[] | null;
  age?: number;
}

type IconName =
  | "arrow"
  | "chevron"
  | "compass"
  | "heart"
  | "location"
  | "map"
  | "menu"
  | "message"
  | "people"
  | "search"
  | "send"
  | "sparkle"
  | "star";

// ─── Static data ──────────────────────────────────────────────────────────────

// Illustrative background photos (not fake user profiles — just scenic images)
const FALLBACK_HERO = "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1800&q=85";

// Category fallback config (used when no gem photo is available for that category)
const CATEGORY_CONFIG: Record<string, { icon: string; emoji_bg: string; desc: string }> = {
  "Beach & Island Hopping": { icon: "🏖", emoji_bg: "bg-sky-100", desc: "Crystal-clear waters and white sand shores" },
  "Beach": { icon: "🏖", emoji_bg: "bg-sky-100", desc: "Crystal-clear waters and white sand shores" },
  "Nature & Hiking": { icon: "🌿", emoji_bg: "bg-emerald-100", desc: "Lush mountains and untouched wilderness" },
  "Mountain": { icon: "🏔", emoji_bg: "bg-emerald-100", desc: "Misty peaks and highland trails" },
  "Hidden Gems": { icon: "💎", emoji_bg: "bg-violet-100", desc: "Off-the-beaten-path local discoveries" },
  "Scenic & Sunset Spots": { icon: "🌅", emoji_bg: "bg-amber-100", desc: "Breathtaking views and peaceful retreats" },
  "History & Culture": { icon: "🏛", emoji_bg: "bg-orange-100", desc: "Rich heritage and storied places" },
  "Food & Cafés": { icon: "🍜", emoji_bg: "bg-rose-100", desc: "Local flavors and hidden dining spots" },
  "Adventure & Thrills": { icon: "🧗", emoji_bg: "bg-yellow-100", desc: "For those who seek the extraordinary" },
  "City Exploring": { icon: "🌆", emoji_bg: "bg-indigo-100", desc: "Urban gems and neighborhood finds" },
  "Waterfalls": { icon: "💦", emoji_bg: "bg-cyan-100", desc: "Hidden cascades and cool swimming holes" },
  "default": { icon: "📍", emoji_bg: "bg-slate-100", desc: "Discover amazing places across the Philippines" },
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Build Your Travel Profile",
    text: "Tell us where you've been and where you want to go. Add your travel style, interests, and bucket-list destinations.",
    icon: "compass" as IconName,
    color: "bg-sky-100 text-sky-700",
  },
  {
    step: "2",
    title: "Discover & Match",
    text: "Browse fellow Filipino travelers. Like their profile — if they like you back, it's a match and a chat opens up.",
    icon: "heart" as IconName,
    color: "bg-rose-100 text-rose-600",
  },
  {
    step: "3",
    title: "Chat & Plan Together",
    text: "Break the ice, share hidden gem tips, and turn a new connection into a real Philippine adventure.",
    icon: "people" as IconName,
    color: "bg-amber-100 text-amber-700",
  },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Heritage: "🏛",
  Cafe: "☕", Waterfalls: "💦", City: "🌆", Food: "🍜",
  "Beach & Island Hopping": "🏖", "Nature & Hiking": "🌿",
  "History & Culture": "🏛", "Food & Cafés": "🍜",
  "City Exploring": "🌆", "Adventure & Thrills": "🧗",
  "Scenic & Sunset Spots": "🌅", "Hidden Gems": "💎",
};

const BEST_FOR: Record<string, string[]> = {
  Beach: ["Solo", "Duo", "Group"],
  "Beach & Island Hopping": ["Solo", "Duo", "Group"],
  Mountain: ["Solo", "Group", "Adventurers"],
  "Nature & Hiking": ["Solo", "Duo"],
  Heritage: ["Family", "Duo"],
  "History & Culture": ["Family", "Duo"],
  Waterfalls: ["Solo", "Group"],
  Food: ["Duo", "Group"],
  "Food & Cafés": ["Duo", "Group"],
  City: ["Solo", "Duo"],
  "City Exploring": ["Solo", "Duo"],
  default: ["Solo", "Duo"],
};

// ─── Reusable components (Icon must come FIRST so FeaturedCarousel can use it) ─

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
    chevron: <path d="m9 18 6-6-6-6" />,
    compass: (<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" /></>),
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    location: (<><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>),
    map: (<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></>),
    menu: (<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>),
    message: (<><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></>),
    people: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
    search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>),
    send: (<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>),
    sparkle: <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" />,
    star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  };
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a className="group flex items-center gap-2" href="#top" aria-label="TCUnnect home">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${light ? "bg-white text-sky-700" : "bg-sky-600 text-white"}`}>
        <Icon name="compass" className="h-[21px] w-[21px]" />
      </span>
      <span className={`text-xl font-bold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        TC<span className={light ? "text-sky-200" : "text-sky-600"}>U</span>nnect
      </span>
    </a>
  );
}

function ArrowLink({ children, href, light = false }: { children: ReactNode; href: string; light?: boolean }) {
  return (
    <a className={`inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3 ${light ? "text-white" : "text-sky-700 hover:text-sky-800"}`} href={href}>
      {children}
      <Icon name="arrow" className="h-4 w-4" />
    </a>
  );
}

// ─── Featured Carousel (defined after Icon so Icon is in scope) ───────────────

function FeaturedCarousel() {
  const [gems, setGems] = useState<FeaturedGem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const gemsRef = useRef<FeaturedGem[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function fetchFeatured() {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      const { data } = await supabase
        .from("hidden_gems")
        .select("id, name, location, category, images, description, budget_level")
        .eq("status", "approved")
        .eq("is_featured", true)
        .limit(6);
      if (data && data.length > 0) {
        setGems(data as FeaturedGem[]);
        gemsRef.current = data as FeaturedGem[];
      }
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  const total = gems.length;

  const goNext = useCallback(() => {
    const t = gemsRef.current.length;
    if (t < 2) return;
    setCurrent((c) => (c + 1) % t);
  }, []);

  const goPrev = useCallback(() => {
    const t = gemsRef.current.length;
    if (t < 2) return;
    setCurrent((c) => (c - 1 + t) % t);
  }, []);

  const goTo = useCallback((i: number) => setCurrent(i), []);

  useEffect(() => {
    if (total < 2 || isPaused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(goNext, 5000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [total, isPaused, goNext]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) { delta > 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <div className="relative min-h-[420px] rounded-[30px] bg-slate-200 animate-pulse flex items-center justify-center lg:min-h-[520px]">
        <span className="text-slate-400 text-sm">Loading featured gems…</span>
      </div>
    );
  }

  if (gems.length === 0) {
    return (
      <div className="relative min-h-[420px] rounded-[30px] overflow-hidden lg:min-h-[520px] bg-gradient-to-br from-sky-800 to-sky-950 flex items-end">
        <div className="p-8 sm:p-12 max-w-xl text-white">
          <span className="inline-block mb-3 rounded-full bg-amber-400 px-4 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-amber-950">FEATURED BY TCUNNECT</span>
          <h3 className="text-3xl font-bold sm:text-4xl leading-tight">The Philippines Awaits</h3>
          <p className="mt-3 text-sm text-white/75 leading-relaxed">From pristine beaches to misty mountain trails — the Philippines is full of places waiting to be discovered. Be the first to submit a Hidden Gem!</p>
          <Link to="/hidden-gems" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 font-bold px-6 py-3 text-sm transition hover:bg-amber-300">
            Submit a Gem <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const gem = gems[current];
  const bestFor = BEST_FOR[gem.category] ?? BEST_FOR.default;
  const emoji = CATEGORY_EMOJIS[gem.category] ?? "📍";

  return (
    <div
      className="relative min-h-[420px] rounded-[30px] overflow-hidden select-none lg:min-h-[520px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="absolute inset-0 flex"
        style={{
          width: `${total * 100}%`,
          transform: `translateX(-${(current / total) * 100}%)`,
          transition: "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      >
        {gems.map((g) => {
          const img = g.images?.[0];
          const catEmoji = CATEGORY_EMOJIS[g.category] ?? "📍";
          return (
            <div key={g.id} className="relative h-full flex-shrink-0" style={{ width: `${100 / total}%` }}>
              {img
                ? <img src={img} alt={g.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-slate-700 flex items-center justify-center text-7xl">{catEmoji}</div>
              }
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent pointer-events-none z-10" />

      <span className="absolute top-6 left-6 z-20 rounded-full bg-amber-400 px-4 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-amber-950 shadow">
        FEATURED BY TCUNNECT
      </span>

      <button
        onClick={goPrev}
        aria-label="Previous gem"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={goNext}
        aria-label="Next gem"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div key={current} className="absolute bottom-0 left-0 p-8 sm:p-12 max-w-xl z-20">
        <h3 className="text-3xl font-bold text-white sm:text-4xl leading-tight">{gem.name}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
          <Icon name="location" className="h-4 w-4 text-rose-400" /> {gem.location}
        </p>
        {gem.description && (
          <p className="mt-3 text-sm text-white/75 leading-relaxed line-clamp-3">{gem.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">{emoji} {gem.category}</span>
          {gem.budget_level && (
            <span className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">{gem.budget_level}</span>
          )}
          {bestFor.length > 0 && <span className="text-xs text-white/50">Best for:</span>}
          {bestFor.map((b) => (
            <span key={b} className="rounded-full bg-sky-500/70 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">{b}</span>
          ))}
        </div>
        <Link to={`/gems/${gem.id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 font-bold px-6 py-3 text-sm transition hover:bg-amber-300">
          Explore This Gem <Icon name="chevron" className="h-4 w-4" />
        </Link>
      </div>

      {total > 1 && (
        <div className="absolute bottom-6 right-6 z-20 flex gap-1.5">
          {gems.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Discover People Section ──────────────────────────────────────────────────

const TRAVEL_TAGS = ["Beach trips", "Island hopping", "Hiking", "Food trips", "Culture", "Photography", "Backpacking", "Road trips", "Diving", "Camping"];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

const AVATAR_GRADIENTS = [
  "from-sky-400 to-sky-600", "from-rose-400 to-rose-500", "from-violet-400 to-violet-600",
  "from-amber-400 to-orange-500", "from-emerald-400 to-emerald-600", "from-pink-400 to-pink-600",
];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

// Float animation delays per card
const FLOAT_STYLES = [
  { animation: "float-a 4s ease-in-out infinite" },
  { animation: "float-b 4.6s ease-in-out infinite" },
  { animation: "float-a 5.2s ease-in-out infinite" },
];

const FLOAT_KEYFRAMES = `
@keyframes float-a {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}
@keyframes float-b {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-14px); }
}
`;

const FAKE_PROFILES: PublicProfile[] = [
  { id: "1", full_name: "Maomao", profile_photo: "/avatars/maomao.jpg", home_city: "Taguig City", travel_style: "Explorer", interests: ["Hiking", "Nature"], age: 18 },
  { id: "2", full_name: "Jinshi", profile_photo: "/avatars/jinshi.jpg", home_city: "Cebu City", travel_style: "Food Trip", interests: ["Beach Lover", "Food trips"], age: 19 },
  { id: "3", full_name: "Lihaku", profile_photo: "/avatars/lihaku.webp", home_city: "Zamboanga", travel_style: "Outdoorsy", interests: ["Photography", "Camping"], age: 23 },
];

function DiscoverPeopleSection() {
  const profiles = FAKE_PROFILES;
  const loading = false;

  function tagsFor(profile: PublicProfile, count = 2): string[] {
    if (profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0) {
      return profile.interests.slice(0, count);
    }
    let h = 0;
    for (const c of (profile.id ?? "x")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const start = h % (TRAVEL_TAGS.length - count);
    return TRAVEL_TAGS.slice(start, start + count);
  }

  const show = profiles.length > 0;
  // Determine grid cols based on count
  const count = Math.min(profiles.length, 3);
  const gridClass = count === 1
    ? "flex justify-center"
    : count === 2
    ? "grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto"
    : "grid gap-6 sm:grid-cols-3";

  return (
    <section className="section-pad bg-sky-50/70 overflow-hidden" id="travelers">
      {/* Inject float keyframes */}
      <style>{FLOAT_KEYFRAMES}</style>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <div className="eyebrow text-rose-500"><Icon name="people" className="h-4 w-4" /> Meet Fellow Travelers</div>
            <h2 className="section-title mt-4">Your next adventure might start with a new connection.</h2>
            <p className="section-copy">Real Filipino travelers — match anonymously, chat when it's mutual, then go explore together.</p>
          </div>
          <ArrowLink href="/signup">Start Discovering</ArrowLink>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl bg-slate-200 animate-pulse h-80" />
            ))}
          </div>
        )}

        {/* Real user cards */}
        {!loading && show && (
          <div className={gridClass}>
            {profiles.slice(0, 3).map((profile, index) => {
              const name = (profile.full_name && profile.full_name.trim()) ? profile.full_name.trim() : "Traveler";
              const tags = tagsFor(profile);
              const hasPhoto = !!profile.profile_photo;
              const floatStyle = FLOAT_STYLES[index % FLOAT_STYLES.length];
              const midCard = index === 1;

              return (
                <a
                  href="/signup"
                  key={profile.id}
                  style={floatStyle}
                  className={`block overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(17,80,110,0.13)] transition hover:shadow-[0_28px_60px_rgba(17,80,110,0.2)] cursor-pointer ${midCard ? "sm:scale-105" : ""}`}
                >
                  {/* Photo area */}
                  <div className="relative h-60 overflow-hidden">
                    {hasPhoto ? (
                      <>
                        <img
                          src={profile.profile_photo!}
                          alt={name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                      </>
                    ) : (
                      <>
                        <div className={`h-full w-full bg-gradient-to-br ${avatarColor(name)}`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-24 w-24 rounded-full bg-white/25 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/40">
                            {initials(name)}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Lock badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-md">
                      🔒 Sign up to see
                    </div>

                    {/* Online indicator */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-[10px] font-semibold text-emerald-700 shadow-md">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      Active recently
                    </div>
                  </div>

                  {/* Card info */}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{name.split(" ")[0]}{profile.age ? `, ${profile.age}` : ""}</h3>
                        <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                          <Icon name="location" className="h-3 w-3 text-rose-400" />
                          {profile.home_city || "Philippines"}
                        </p>
                      </div>
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-400 hover:bg-rose-100 transition">
                        <Icon name="heart" className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">{tag}</span>
                      ))}
                      {profile.travel_style && (
                        <span className="rounded-full bg-sky-50 border border-sky-100 px-2.5 py-1 text-[10px] font-semibold text-sky-700">{profile.travel_style}</span>
                      )}
                    </div>
                    <div className="mt-4 w-full rounded-xl bg-rose-500 py-2 text-center text-xs font-bold text-white">
                      View Profile →
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">
            {show ? `Join ${profiles.length}+ travelers already on TCUnnect` : "Be one of the first travelers on TCUnnect"}
          </p>
          <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:-translate-y-0.5 hover:bg-rose-400">
            Find Your Travel Match <Icon name="heart" className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Gem Categories Section ───────────────────────────────────────────────────

function GemCategoriesSection() {
  const [gems, setGems] = useState<CategoryGem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategoryGems() {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      // Fetch approved gems — filter images client-side to avoid JSONB comparison issues
      const { data } = await supabase
        .from("hidden_gems")
        .select("id, name, location, category, images")
        .eq("status", "approved")
        .limit(50);

      if (data && data.length > 0) {
        // Pick one gem per category (prefer ones with a photo)
        const seen = new Set<string>();
        const picks: CategoryGem[] = [];
        // First pass: gems with photos
        for (const gem of data as CategoryGem[]) {
          if (!seen.has(gem.category) && Array.isArray(gem.images) && gem.images[0]) {
            seen.add(gem.category);
            picks.push(gem);
            if (picks.length === 4) break;
          }
        }
        // Second pass: fill remaining slots with gems even without photos
        if (picks.length < 4) {
          for (const gem of data as CategoryGem[]) {
            if (!seen.has(gem.category)) {
              seen.add(gem.category);
              picks.push(gem);
              if (picks.length === 4) break;
            }
          }
        }
        if (picks.length > 0) setGems(picks);
      }
      setLoading(false);
    }
    fetchCategoryGems();
  }, []);

  const getConfig = (category: string) =>
    CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["default"];

  // Fallback cards when no real data yet
  const fallbackCards = [
    { category: "Beach & Island Hopping" },
    { category: "Nature & Hiking" },
    { category: "Hidden Gems" },
    { category: "Scenic & Sunset Spots" },
  ];

  const cards = gems.length >= 1 ? gems : null;

  return (
    <section className="section-pad" id="discover">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <div className="eyebrow text-sky-700"><Icon name="compass" className="h-4 w-4" /> Hidden Gems</div>
            <h2 className="section-title mt-4">There's more to discover.</h2>
            <p className="section-copy">Find quiet shores, misty mountains, and local favorites across the Philippines.</p>
          </div>
          <ArrowLink href="/hidden-gems">Explore All Gems</ArrowLink>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-3xl bg-slate-200 animate-pulse h-72" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(cards ?? fallbackCards).map((item) => {
              const cfg = getConfig(item.category);
              const gemItem = item as CategoryGem;
              const hasPhoto = !!gemItem.images?.[0];
              return (
                <Link
                  className="group overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-[0_10px_35px_rgba(15,45,65,0.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,45,65,0.12)]"
                  to={hasPhoto ? `/gems/${gemItem.id}` : "/hidden-gems"}
                  key={item.category}
                >
                  <div className="relative h-52 overflow-hidden">
                    {hasPhoto ? (
                      <img
                        src={gemItem.images[0]}
                        alt={gemItem.name ?? item.category}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`h-full w-full ${cfg.emoji_bg} flex items-center justify-center text-7xl`}>
                        {cfg.icon}
                      </div>
                    )}
                    {hasPhoto && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900">{cfg.icon} {item.category}</h3>
                    {hasPhoto && gemItem.location && (
                      <p className="mt-0.5 text-[11px] text-sky-600 font-medium">{gemItem.location}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">{cfg.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Scroll arrow ─────────────────────────────────────────────────────────────

function ScrollArrow() {
  const [atBottom, setAtBottom] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(total > 200);
      setAtBottom(scrolled >= total - 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: atBottom ? 0 : document.documentElement.scrollHeight, behavior: "smooth" })}
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
      className="fixed bottom-8 right-6 z-50 h-11 w-11 rounded-full bg-sky-600 hover:bg-sky-500 active:scale-95 text-white shadow-lg shadow-sky-700/30 flex items-center justify-center transition-all duration-200"
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
        {atBottom ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
      </svg>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const heroSrc = HERO_PHOTO_URL || FALLBACK_HERO;

  return (
    <main id="top" className="overflow-hidden bg-[#fbfdfd] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Main navigation">
          <Logo />
          <div className="hidden items-center gap-8 lg:flex">
            <a className="nav-link" href="#how-it-works">How It Works</a>
            <a className="nav-link" href="#gems">Hidden Gems</a>
            <a className="nav-link" href="#community">Community</a>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <a className="text-sm font-semibold text-slate-700 hover:text-sky-700" href="/login">Log In</a>
            <a className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700" href="/signup">Get Started</a>
          </div>
          <button
            className="rounded-lg p-2 text-slate-700 sm:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name="menu" />
          </button>
        </nav>
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-lg sm:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold text-slate-700">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
              <a href="#gems" onClick={() => setMenuOpen(false)}>Hidden Gems</a>
              <a href="#community" onClick={() => setMenuOpen(false)}>Community</a>
              <div className="mt-1 flex items-center gap-3 border-t border-slate-100 pt-4">
                <a className="flex-1 text-center" href="/login" onClick={() => setMenuOpen(false)}>Log In</a>
                <a className="flex-1 rounded-full bg-sky-600 px-4 py-2.5 text-center text-white" href="/signup" onClick={() => setMenuOpen(false)}>Get Started</a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[780px] pt-[76px] lg:min-h-[850px]">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={heroSrc}
          alt="Explore the Philippines with TCUnnect"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/42 to-sky-900/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
        <div className="relative mx-auto flex min-h-[704px] max-w-7xl items-center px-5 py-24 lg:min-h-[774px] lg:px-8">
          <div className="max-w-3xl text-white">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-semibold tracking-[0.18em] backdrop-blur-md">
              <Icon name="sparkle" className="h-4 w-4 text-amber-300" />
              MADE FOR FILIPINO TRAVELERS
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[76px]">
              Travel. Connect.
              <br />
              <span className="text-sky-200">Unwind.</span>
            </h1>
            <p className="mt-7 text-lg font-medium text-white/90 sm:text-xl">A social travel platform for Filipinos.</p>
            <p className="mt-2 text-base text-white/70 sm:text-lg">Connect. Discover. Enjoy.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a className="rounded-full bg-sky-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-950/20 transition hover:-translate-y-0.5 hover:bg-sky-400" href="/signup">
                Get Started
              </a>
              <a className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/12 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20" href="#gems">
                Explore Hidden Gems <Icon name="arrow" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full bg-white/92 px-5 py-3 text-xs font-semibold text-slate-700 shadow-xl backdrop-blur-md sm:flex">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-100 text-sky-600">
            <Icon name="map" className="h-3.5 w-3.5" />
          </span>
          Discover the Philippines, together
        </div>
      </section>

      {/* ── Featured Carousel ────────────────────────────────────────────────── */}
      <section className="section-pad bg-[#fffdf8]" id="gems">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <div className="eyebrow text-amber-700"><Icon name="sparkle" className="h-4 w-4" /> Featured Gem by TCUnnect</div>
            <h2 className="section-title mt-4">Discover somewhere worth getting lost in.</h2>
          </div>
          <FeaturedCarousel />
        </div>
      </section>

      {/* ── Gem Categories ───────────────────────────────────────────────────── */}
      <GemCategoriesSection />

      {/* ── Discover People ──────────────────────────────────────────────────── */}
      <DiscoverPeopleSection />

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="section-pad" id="how-it-works">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <div className="eyebrow text-rose-500"><Icon name="people" className="h-4 w-4" /> How TCUnnect Works</div>
            <h2 className="section-title mt-4">Your next adventure starts with a real connection.</h2>
            <p className="section-copy">Discover fellow Filipino travelers who share your style — then chat, plan, and go.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <article
                key={step.step}
                className={`relative rounded-3xl bg-white border border-slate-100 p-8 shadow-[0_15px_40px_rgba(17,80,110,0.09)] transition hover:-translate-y-1 hover:shadow-xl ${i === 1 ? "md:-translate-y-4" : ""}`}
              >
                <span className="absolute top-6 right-6 text-[11px] font-extrabold tracking-[0.15em] text-slate-300">STEP {step.step}</span>
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${step.color}`}>
                  <Icon name={step.icon} />
                </span>
                <h3 className="mt-6 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{step.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-sky-500">
              Create Your Profile <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Community / Chat ─────────────────────────────────────────────────── */}
      <section className="section-pad" id="community">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
          {/* Chat mockup — illustrative UI, not real user data */}
          <div className="order-2 lg:order-1">
            <div className="mx-auto max-w-[520px] rounded-[34px] bg-slate-900 p-3 shadow-[0_30px_70px_rgba(15,45,65,0.18)]">
              <div className="overflow-hidden rounded-[25px] bg-[#f7fafb]">
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-5">
                  <div className="relative">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-base">
                      JD
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Your Travel Match</p>
                    <p className="text-[10px] text-emerald-600">Online · Trip match</p>
                  </div>
                  <Icon name="message" className="ml-auto h-5 w-5 text-sky-600" />
                </div>
                {/* Messages */}
                <div className="space-y-5 p-6 sm:p-8">
                  <p className="mx-auto w-fit rounded-full bg-slate-200/70 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Today</p>
                  <div className="flex gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold">JD</div>
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm">
                      I've been wanting to see Siquijor! Free on the long weekend?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-sky-600 px-4 py-3 text-xs leading-5 text-white">
                      Yes! Let's do the waterfalls and catch sunset at Paliton Beach. 🌅
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold">JD</div>
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm">
                      Perfect. I'll start a shared trip plan! 🗺️
                    </div>
                  </div>
                </div>
                {/* Input bar */}
                <div className="flex items-center gap-3 border-t border-slate-200 bg-white p-4">
                  <div className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-xs text-slate-400">Type a message...</div>
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-sky-600 text-white" aria-label="Send message">
                    <Icon name="send" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Text */}
          <div className="order-1 lg:order-2">
            <div className="eyebrow text-sky-700"><Icon name="message" className="h-4 w-4" /> Connect & Chat</div>
            <h2 className="section-title mt-4">Match. Chat. Plan. Go.</h2>
            <p className="section-copy">Break the ice, compare bucket lists, and turn a new connection into a real adventure — all in one easy conversation.</p>
            <ul className="mt-8 space-y-4 text-sm font-medium text-slate-600">
              {[
                "Private chats open only after a mutual match",
                "Share hidden gem tips and build trip plans together",
                "Travel with people you genuinely click with",
              ].map((item) => (
                <li className="flex items-center gap-3" key={item}>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-xs text-emerald-700">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Trip Types ───────────────────────────────────────────────────────── */}
      <section className="section-pad bg-[#fffaf4]">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow justify-center text-amber-700"><Icon name="sparkle" className="h-4 w-4" /> For Every Kind of Traveler</div>
            <h2 className="section-title mt-4">Travel your way.</h2>
            <p className="section-copy">From a reset for one to an unforgettable trip with your whole barkada.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { title: "Solo", icon: "compass" as IconName, text: "Freedom, flexibility, and handpicked experiences just for you.", color: "bg-sky-100 text-sky-700" },
              { title: "Duo / Couple", icon: "heart" as IconName, text: "Thoughtful escapes made for two, without the planning stress.", color: "bg-rose-100 text-rose-600" },
              { title: "Group", icon: "people" as IconName, text: "Easy booking and shared adventures for friends and new connections.", color: "bg-amber-100 text-amber-700" },
            ].map((option) => (
              <article className="rounded-3xl border border-slate-100 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60" key={option.title}>
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${option.color}`}><Icon name={option.icon} /></span>
                <h3 className="mt-6 text-xl font-bold">{option.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{option.text}</p>
                <div className="mt-7"><ArrowLink href="/signup">Get started</ArrowLink></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="px-5 py-12 sm:py-20 lg:px-8" id="join">
        <div className="relative mx-auto min-h-[460px] max-w-7xl overflow-hidden rounded-[34px] bg-sky-800">
          {/* Gradient backdrop — no fake user photo */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-950 via-sky-800 to-sky-600" />
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #38bdf8 0%, transparent 60%), radial-gradient(circle at 20% 80%, #0ea5e9 0%, transparent 50%)" }}
          />
          <div className="relative flex min-h-[460px] max-w-2xl flex-col justify-center p-8 text-white sm:p-14 lg:p-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">The Philippines is waiting</p>
            <h2 className="mt-5 text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">Ready to find your next adventure?</h2>
            <p className="mt-5 text-lg text-white/75">Connect. Discover. Enjoy.</p>
            <a className="mt-9 inline-flex w-fit items-center gap-2 rounded-full bg-amber-300 px-7 py-3.5 text-sm font-bold text-slate-900 transition hover:gap-3 hover:bg-amber-200" href="/signup">
              Join TCUnnect <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 sm:flex-row sm:items-center">
            <div><Logo light /><p className="mt-4 text-sm text-slate-400">Travel. Connect. Unwind.</p></div>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-400">
              <a className="hover:text-white" href="#how-it-works">How It Works</a>
              <a className="hover:text-white" href="#gems">Hidden Gems</a>
              <a className="hover:text-white" href="#community">Community</a>
              <a className="hover:text-white" href="#join">Join</a>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <p>© 2026 TCUnnect. Made for curious Filipino travelers.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link to="/help" className="hover:text-white transition">Help Center</Link>
              <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition">Terms</Link>
              <Link to="/safety" className="hover:text-white transition">Safety</Link>
            </div>
          </div>
        </div>
      </footer>

      <ScrollArrow />
    </main>
  );
}
