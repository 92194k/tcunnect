import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

interface FeaturedGem {
  id: string;
  name: string;
  location: string;
  category: string;
  images: string[];
  description: string;
  budget_level: string;
}

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

function FeaturedCarousel() {
  const [gems, setGems] = useState<FeaturedGem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = gems.length;

  useEffect(() => {
    async function fetchFeatured() {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      const { data } = await supabase
        .from("hidden_gems")
        .select("id, name, location, category, images, description, budget_level")
        .eq("status", "approved")
        .eq("is_featured", true)
        .limit(6);
      if (data && data.length > 0) setGems(data as FeaturedGem[]);
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  // Auto-advance every 5 s
  useEffect(() => {
    if (total < 2) return;
    timerRef.current = setTimeout(next, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, next, total]);

  if (loading) {
    return (
      <div className="relative min-h-[420px] rounded-[30px] bg-slate-200 animate-pulse flex items-center justify-center lg:min-h-[520px]">
        <span className="text-slate-400 text-sm">Loading featured gems…</span>
      </div>
    );
  }

  // Fallback if no featured gems yet
  if (gems.length === 0) {
    return (
      <div className="relative min-h-[420px] rounded-[30px] overflow-hidden lg:min-h-[520px]">
        <img
          src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1800&q=85"
          alt="The Philippines"
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-8 sm:p-12 max-w-xl">
          <span className="inline-block mb-3 rounded-full bg-amber-400 px-4 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-amber-950">FEATURED BY TCUNNECT</span>
          <h3 className="text-3xl font-bold text-white sm:text-4xl leading-tight">The Philippines Awaits</h3>
          <p className="mt-3 text-sm text-white/75 leading-relaxed line-clamp-3">From pristine beaches to misty mountain trails — the Philippines is full of places waiting to be discovered.</p>
          <a href="/signup" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 font-bold px-6 py-3 text-sm transition hover:bg-amber-300">
            Explore This Gem <Icon name="chevron" className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  const gem = gems[current];
  const heroImg = gem.images?.[0];
  const bestFor = BEST_FOR[gem.category] ?? BEST_FOR.default;
  const emoji = CATEGORY_EMOJIS[gem.category] ?? "📍";

  return (
    <div className="relative min-h-[420px] rounded-[30px] overflow-hidden select-none lg:min-h-[520px]">
      {/* Slide image */}
      {heroImg ? (
        <img
          key={gem.id}
          src={heroImg}
          alt={gem.name}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-700 flex items-center justify-center text-7xl">
          {emoji}
        </div>
      )}

      {/* Gradient overlays — pointer-events-none so they NEVER block clicks */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent pointer-events-none" />

      {/* Badge */}
      <span className="absolute top-6 left-6 z-10 rounded-full bg-amber-400 px-4 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-amber-950 shadow">
        FEATURED BY TCUNNECT
      </span>

      {/* Prev arrow — z-10 so it sits above gradients */}
      <button
        onClick={prev}
        aria-label="Previous gem"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
      </button>

      {/* Next arrow — z-10 so it sits above gradients */}
      <button
        onClick={next}
        aria-label="Next gem"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 sm:p-12 max-w-xl z-10">
        <h3 className="text-3xl font-bold text-white sm:text-4xl leading-tight">{gem.name}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
          <Icon name="location" className="h-4 w-4 text-rose-400" /> {gem.location}
        </p>
        {gem.description && (
          <p className="mt-3 text-sm text-white/75 leading-relaxed line-clamp-3">{gem.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">{emoji} {gem.category}</span>
          {gem.budget_level && <span className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">{gem.budget_level}</span>}
          {bestFor.length > 0 && (
            <span className="text-xs text-white/50">Best for:</span>
          )}
          {bestFor.map((b) => (
            <span key={b} className="rounded-full bg-sky-500/70 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">{b}</span>
          ))}
        </div>
        <Link
          to={`/gems/${gem.id}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 font-bold px-6 py-3 text-sm transition hover:bg-amber-300"
        >
          Explore This Gem <Icon name="chevron" className="h-4 w-4" />
        </Link>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-6 right-6 z-10 flex gap-1.5">
          {gems.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const images = {
  hero: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1800&q=85",
  nacpan:
    "https://images.unsplash.com/photo-1602587921225-3cca658d31bb?auto=format&fit=crop&w=1400&q=85",
  lagoon:
    "https://images.unsplash.com/photo-1758782551890-0f47a570859c?auto=format&fit=crop&w=900&q=80",
  islands:
    "https://images.unsplash.com/photo-1758782551916-1723a9cd00eb?auto=format&fit=crop&w=900&q=80",
  boat: "https://images.unsplash.com/photo-1462557804967-1b4876a07c17?auto=format&fit=crop&w=900&q=80",
  resort:
    "https://images.unsplash.com/photo-1605538108568-7f0d77a214c1?auto=format&fit=crop&w=900&q=80",
  traveler1:
    "https://images.unsplash.com/photo-1675705444858-97005ce93298?auto=format&fit=crop&w=700&q=80",
  traveler2:
    "https://images.unsplash.com/photo-1605741455532-384a402cf959?auto=format&fit=crop&w=700&q=80",
  traveler3:
    "https://images.unsplash.com/photo-1650666908250-b0dcbf54e08b?auto=format&fit=crop&w=700&q=80",
  friends:
    "https://images.unsplash.com/photo-1772203120950-a02082958489?auto=format&fit=crop&w=1200&q=80",
};

type IconName =
  | "arrow"
  | "chevron"
  | "compass"
  | "heart"
  | "location"
  | "menu"
  | "message"
  | "people"
  | "search"
  | "send"
  | "sparkle";

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
      </>
    ),
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    sparkle: <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
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
    <a
      className={`inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3 ${
        light ? "text-white" : "text-sky-700 hover:text-sky-800"
      }`}
      href={href}
    >
      {children}
      <Icon name="arrow" className="h-4 w-4" />
    </a>
  );
}

const gemCategories = [
  { category: "Beach & Islands", icon: "🏖", image: images.lagoon, desc: "Crystal-clear waters and white sand shores" },
  { category: "Nature & Hiking", icon: "🌿", image: images.islands, desc: "Lush mountains and untouched wilderness" },
  { category: "Hidden Gems", icon: "💎", image: images.boat, desc: "Off-the-beaten-path local discoveries" },
  { category: "Scenic Escapes", icon: "🌅", image: images.resort, desc: "Breathtaking views and peaceful retreats" },
];

const travelers = [
  { name: "Mika", city: "Makati", tags: ["Beach trips", "Food"], image: images.traveler1, color: "bg-rose-400" },
  { name: "Sam", city: "Quezon City", tags: ["Hiking", "Islands"], image: images.traveler2, color: "bg-amber-400" },
  { name: "Ana", city: "Cebu City", tags: ["Culture", "Diving"], image: images.traveler3, color: "bg-sky-500" },
];

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

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main id="top" className="overflow-hidden bg-[#fbfdfd] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Main navigation">
          <Logo />
          <div className="hidden items-center gap-8 lg:flex">
            <a className="nav-link" href="#travelers">Discover People</a>
            <a className="nav-link" href="#gems">Hidden Gems</a>
            <a className="nav-link" href="#community">Community</a>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <a className="text-sm font-semibold text-slate-700 hover:text-sky-700" href="/login">Log In</a>
            <a className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700" href="/signup">
              Get Started
            </a>
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
              <a href="#travelers" onClick={() => setMenuOpen(false)}>Discover People</a>
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

      <section className="relative min-h-[780px] pt-[76px] lg:min-h-[850px]">
        <img className="absolute inset-0 h-full w-full object-cover" src={images.hero} alt="Turquoise lagoons and limestone islands in Palawan" />
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
          <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 text-rose-500"><Icon name="heart" className="h-3.5 w-3.5" /></span>
          Join 12,000+ Filipino explorers
        </div>
      </section>

      <section className="section-pad bg-[#fffdf8]" id="gems">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <div className="eyebrow text-amber-700"><Icon name="sparkle" className="h-4 w-4" /> Featured Gem by TCUnnect</div>
            <h2 className="section-title mt-4">Discover somewhere worth getting lost in.</h2>
          </div>
          <FeaturedCarousel />
        </div>
      </section>

      <section className="section-pad bg-sky-50/70" id="travelers">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <div className="eyebrow text-rose-500"><Icon name="people" className="h-4 w-4" /> Meet Fellow Travelers</div>
            <h2 className="section-title mt-4">Your next adventure might start with a new connection.</h2>
            <p className="section-copy">
              Discover people who share your travel interests, match anonymously, then chat when the feeling is mutual.
            </p>
            <div className="mt-8"><ArrowLink href="#community">Meet Travelers</ArrowLink></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {travelers.map((traveler, index) => (
              <article className={`overflow-hidden rounded-3xl bg-white shadow-[0_15px_40px_rgba(17,80,110,0.09)] ${index === 1 ? "sm:-translate-y-6" : ""}`} key={traveler.name}>
                <div className="relative h-60 overflow-hidden">
                  <img className="h-full w-full object-cover" src={traveler.image} alt={`${traveler.name}, a traveler from ${traveler.city}`} />
                  <span className={`absolute right-4 top-4 h-3 w-3 rounded-full border-2 border-white ${traveler.color}`} title="Active recently" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{traveler.name}, {24 + index}</h3>
                      <p className="mt-1 text-xs text-slate-500">{traveler.city}</p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-rose-50 text-rose-400"><Icon name="heart" className="h-4 w-4" /></span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {traveler.tags.map((tag) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600" key={tag}>{tag}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad" id="discover">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <div className="eyebrow text-sky-700"><Icon name="compass" className="h-4 w-4" /> Hidden Gems</div>
              <h2 className="section-title mt-4">There’s more to discover.</h2>
              <p className="section-copy">Find quiet shores, misty mountains, and local favorites across the Philippines.</p>
            </div>
            <ArrowLink href="#discover">Explore All Gems</ArrowLink>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {gemCategories.map((cat) => (
              <a className="group overflow-hidden rounded-3xl bg-white shadow-[0_10px_35px_rgba(15,45,65,0.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,45,65,0.12)]" href="/signup" key={cat.category}>
                <div className="h-56 overflow-hidden">
                  <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={cat.image} alt={cat.category} />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{cat.icon} {cat.category}</h3>
                      <p className="mt-1 text-xs text-slate-500">{cat.desc}</p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad" id="community">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
          <div className="order-2 lg:order-1">
            <div className="mx-auto max-w-[520px] rounded-[34px] bg-slate-900 p-3 shadow-[0_30px_70px_rgba(15,45,65,0.18)]">
              <div className="overflow-hidden rounded-[25px] bg-[#f7fafb]">
                <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-5">
                  <div className="relative">
                    <img className="h-11 w-11 rounded-full object-cover" src={images.traveler2} alt="" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Sam</p>
                    <p className="text-[10px] text-emerald-600">Online · Trip match</p>
                  </div>
                  <Icon name="message" className="ml-auto h-5 w-5 text-sky-600" />
                </div>
                <div className="space-y-5 p-6 sm:p-8">
                  <p className="mx-auto w-fit rounded-full bg-slate-200/70 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Today</p>
                  <div className="flex gap-2.5">
                    <img className="h-7 w-7 rounded-full object-cover" src={images.traveler2} alt="" />
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm">
                      I’ve been wanting to see Siquijor! Free on the long weekend?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-sky-600 px-4 py-3 text-xs leading-5 text-white">
                      Yes! Let’s do the waterfalls and catch sunset at Paliton Beach.
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <img className="h-7 w-7 rounded-full object-cover" src={images.traveler2} alt="" />
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm">
                      Perfect. I’ll start a shared trip plan!
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-slate-200 bg-white p-4">
                  <div className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-xs text-slate-400">Type a message...</div>
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-sky-600 text-white" aria-label="Send message"><Icon name="send" className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="eyebrow text-sky-700"><Icon name="message" className="h-4 w-4" /> Connect & Chat</div>
            <h2 className="section-title mt-4">Match. Chat. Plan. Go.</h2>
            <p className="section-copy">
              Break the ice, compare bucket lists, and turn a new connection into a real adventure—all in one easy conversation.
            </p>
            <ul className="mt-8 space-y-4 text-sm font-medium text-slate-600">
              {["Private chats after a mutual match", "Share places and build trip plans", "Travel with people you genuinely click with"].map((item) => (
                <li className="flex items-center gap-3" key={item}><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-xs text-emerald-700">✓</span>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[#fffaf4]">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow justify-center text-amber-700"><Icon name="sparkle" className="h-4 w-4" /> Book Experiences</div>
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
                <div className="mt-7"><ArrowLink href="#join">Explore options</ArrowLink></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:py-20 lg:px-8" id="join">
        <div className="relative mx-auto min-h-[460px] max-w-7xl overflow-hidden rounded-[34px] bg-sky-800">
          <img className="absolute inset-0 h-full w-full object-cover opacity-35" src={images.friends} alt="Friends enjoying a walk on a tropical beach" />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-950/95 via-sky-800/80 to-sky-700/30" />
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

      <footer className="bg-slate-950 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-10 sm:flex-row sm:items-center">
            <div><Logo light /><p className="mt-4 text-sm text-slate-400">Travel. Connect. Unwind.</p></div>
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-400">
              <a className="hover:text-white" href="#travelers">People</a>
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
