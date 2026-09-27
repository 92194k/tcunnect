import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import {
  MapPin, Star, ArrowLeft, Heart, Share2, Calendar, Clock,
  Users, ChevronRight, Loader2, Utensils, ShoppingBag,
  Bed, Compass, Sparkles, ExternalLink, Phone, Bookmark,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  description: string;
  tip: string;
  is_featured: boolean;
}

interface NearbyGem {
  id: string;
  name: string;
  location: string;
  category: string;
  images: string[];
  rating: number;
}

interface GemReview {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  profiles: { full_name: string | null; profile_photo: string | null } | null;
}

// Matches gem_content_items table columns
interface ContentItem {
  id: string;
  section: "places" | "activities" | "food" | "products" | "stays" | "experiences";
  sort_order: number;
  name: string;
  description: string;
  // places
  distance: string | null;
  tag: string | null;
  // activities
  duration: string | null;
  // food / stays / experiences
  category_label: string | null;
  price_range: string | null;
  // products
  seller: string | null;
  // experiences
  action_type: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="flex-shrink-0 h-8 w-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
        {icon}
      </span>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Discovery Sub-components (data-driven) ────────────────────────────────────

function PlacesSection({ items }: { items: ContentItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <SectionHeader icon={<MapPin className="h-4 w-4" />} title="Places to Visit" subtitle="Nearby spots worth exploring" />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">{item.tag?.split(" ")[0] ?? "📍"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                {item.distance && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">📍 {item.distance}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
              {item.tag && (
                <span className="inline-block mt-1.5 text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">{item.tag}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitiesSection({ items }: { items: ContentItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <SectionHeader icon={<Compass className="h-4 w-4" />} title="Things to Do" subtitle="Activities for every kind of traveler" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
              {item.duration && <span className="text-[10px] text-slate-400 flex-shrink-0">⏱ {item.duration}</span>}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
            {item.tag && (
              <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{item.tag}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FoodSection({ items }: { items: ContentItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <SectionHeader icon={<Utensils className="h-4 w-4" />} title="Food & Drinks" subtitle="Local flavors you shouldn't miss" />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-slate-100 bg-white rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                {item.category_label && (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{item.category_label}</span>
                )}
              </div>
              {item.price_range && (
                <span className="text-xs font-semibold text-emerald-700 flex-shrink-0">{item.price_range}</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsSection({ items }: { items: ContentItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <SectionHeader icon={<ShoppingBag className="h-4 w-4" />} title="Products & Local Finds" subtitle="Take a piece of the Philippines home" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-4">
            <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
            {item.seller && (
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {item.seller}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StaysSection({ items }: { items: ContentItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <SectionHeader icon={<Bed className="h-4 w-4" />} title="Where to Stay" subtitle="Rest well before the next adventure" />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-slate-100 bg-white rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                {item.category_label && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{item.category_label}</span>
                )}
              </div>
              {item.price_range && (
                <span className="text-xs font-semibold text-sky-700 flex-shrink-0">{item.price_range}</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperiencesSection({ items }: { items: ContentItem[] }) {
  if (items.length === 0) return null;
  const actionStyle: Record<string, string> = {
    "Book Now":      "bg-sky-600 hover:bg-sky-700 text-white",
    "Inquire":       "bg-slate-800 hover:bg-slate-900 text-white",
    "View Details":  "border border-slate-300 hover:bg-slate-50 text-slate-700",
    "Get Directions":"border border-sky-300 hover:bg-sky-50 text-sky-700",
  };
  const actionIcon: Record<string, React.ReactNode> = {
    "Book Now":       <ChevronRight className="h-3.5 w-3.5" />,
    "Inquire":        <Phone className="h-3.5 w-3.5" />,
    "View Details":   <ExternalLink className="h-3.5 w-3.5" />,
    "Get Directions": <MapPin className="h-3.5 w-3.5" />,
  };

  return (
    <div className="mb-6">
      <SectionHeader icon={<Sparkles className="h-4 w-4" />} title="Experiences" subtitle="Unforgettable moments, only here" />
      <div className="space-y-3">
        {items.map((item) => {
          const action = item.action_type ?? "Inquire";
          return (
            <div key={item.id} className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                  {item.price_range && (
                    <p className="text-xs font-bold text-emerald-700 mt-2">{item.price_range}</p>
                  )}
                </div>
                <button className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-full transition ${actionStyle[action] ?? actionStyle["Inquire"]}`}>
                  {actionIcon[action] ?? actionIcon["Inquire"]} {action}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NearbyGemsSection({ nearbyGems, currentGemId }: { nearbyGems: NearbyGem[]; currentGemId: string }) {
  if (nearbyGems.length === 0) return null;
  return (
    <div className="mb-6">
      <SectionHeader icon={<Compass className="h-4 w-4" />} title="Nearby Hidden Gems" subtitle="More discovered spots in this area" />
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {nearbyGems.filter(g => g.id !== currentGemId).slice(0, 5).map((g) => (
          <Link
            key={g.id}
            to={`/gems/${g.id}`}
            className="flex-shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition"
          >
            <div className="h-28 overflow-hidden bg-slate-100">
              {g.images?.[0] ? (
                <img src={g.images[0]} alt={g.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  {CATEGORY_EMOJIS[g.category] ?? "📍"}
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold text-slate-900 text-xs leading-snug line-clamp-2">{g.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {g.location}
              </p>
              {g.rating > 0 && (
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-current" /> {g.rating}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= rating ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`} />
      ))}
    </div>
  );
}

function ReviewsSection({ reviews, loading }: { reviews: GemReview[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-amber-400 fill-current" />
          <h2 className="text-lg font-bold text-slate-900">Traveler Reviews</h2>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 text-sky-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-amber-400 fill-current" />
          <h2 className="text-lg font-bold text-slate-900">Traveler Reviews</h2>
        </div>
        <div className="bg-slate-50 rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm">No reviews yet — be the first to review after your trip!</p>
        </div>
      </div>
    );
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400 fill-current" />
          <h2 className="text-lg font-bold text-slate-900">Traveler Reviews</h2>
        </div>
        <div className="flex items-center gap-2">
          <StarDisplay rating={Math.round(avg)} size="md" />
          <span className="text-sm font-bold text-slate-800">{avg.toFixed(1)}</span>
          <span className="text-sm text-slate-400">({reviews.length})</span>
        </div>
      </div>
      <div className="space-y-4">
        {reviews.map((rv) => (
          <div key={rv.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                {rv.profiles?.profile_photo ? (
                  <img src={rv.profiles.profile_photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-bold">
                    {rv.profiles?.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-slate-900 text-sm">{rv.profiles?.full_name ?? "Traveler"}</p>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rv.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <StarDisplay rating={rv.rating} />
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{rv.review_text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlusBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
      <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
      <p className="text-xs text-amber-800 flex-1">
        <span className="font-bold">TCUnnect Plus</span> — get a Plus badge, higher profile visibility, and advanced traveler matching.
      </p>
      <button
        onClick={onUpgrade}
        className="flex-shrink-0 text-[11px] font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 px-3 py-1.5 rounded-full transition"
      >
        Learn more
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GemDetail() {
  const { gemId } = useParams<{ gemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [gem, setGem] = useState<Gem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nearbyGems, setNearbyGems] = useState<NearbyGem[]>([]);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savingLoading, setSavingLoading] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [reviews, setReviews] = useState<GemReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const isPremium = user?.isPremium ?? false;

  const fetchReviews = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) return;
    setReviewsLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, review_text, created_at, profiles(full_name, profile_photo)")
      .eq("gem_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setReviews(data as unknown as GemReview[]);
    setReviewsLoading(false);
  }, []);

  const fetchContentItems = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) return;
    setContentLoading(true);
    const { data } = await supabase
      .from("gem_content_items")
      .select("*")
      .eq("gem_id", id)
      .order("sort_order", { ascending: true });
    if (data) setContentItems(data as ContentItem[]);
    setContentLoading(false);
  }, []);

  useEffect(() => {
    if (!gemId) return;
    fetchGem(gemId);
    fetchReviews(gemId);
    fetchContentItems(gemId);
    if (user && isSupabaseConfigured) {
      supabase
        .from("saved_places")
        .select("id")
        .eq("user_id", user.id)
        .eq("gem_id", gemId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) { setSaved(true); setSavedId(data.id); }
        });
    }
  }, [gemId]);

  async function fetchGem(id: string) {
    setLoading(true);
    setNotFound(false);

    if (!isSupabaseConfigured) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const { data, error } = await supabase
      .from("hidden_gems")
      .select("id, name, location, category, images, rating, review_count, budget_level, description, tip, is_featured")
      .eq("id", id)
      .eq("status", "approved")
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setGem(data as Gem);
      fetchNearbyGems(data as Gem);
    }
    setLoading(false);
  }

  async function fetchNearbyGems(currentGem: Gem) {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from("hidden_gems")
      .select("id, name, location, category, images, rating")
      .eq("status", "approved")
      .or(`location.ilike.%${currentGem.location.split(",")[0].trim()}%,category.eq.${currentGem.category}`)
      .neq("id", currentGem.id)
      .limit(8);
    if (data) setNearbyGems(data as NearbyGem[]);
  }

  async function handleSave() {
    if (!user || !gem) return;
    setSavingLoading(true);
    if (saved && savedId) {
      if (isSupabaseConfigured) {
        await supabase.from("saved_places").delete().eq("id", savedId);
      }
      setSaved(false);
      setSavedId(null);
    } else {
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from("saved_places")
          .insert({ user_id: user.id, gem_id: gem.id })
          .select("id")
          .single();
        if (data) setSavedId(data.id);
      }
      setSaved(true);
    }
    setSavingLoading(false);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: gem?.name ?? "Hidden Gem", text: gem?.description?.slice(0, 100), url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !gem) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Gem not found</h2>
          <p className="text-slate-500 text-sm mb-6">This gem doesn't exist or hasn't been approved yet.</p>
          <Link
            to="/hidden-gems"
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition"
          >
            Back to Hidden Gems
          </Link>
        </div>
      </AppShell>
    );
  }

  const images = gem.images?.length ? gem.images : [];

  // Group content by section
  const bySection = (section: ContentItem["section"]) =>
    contentItems.filter(i => i.section === section);

  const places      = bySection("places");
  const activities  = bySection("activities");
  const food        = bySection("food");
  const products    = bySection("products");
  const stays       = bySection("stays");
  const experiences = bySection("experiences");

  const hasDiscovery = !contentLoading &&
    (places.length + activities.length + food.length +
     products.length + stays.length + experiences.length) > 0;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero Image */}
        <div className="relative rounded-2xl overflow-hidden mb-4 h-72 lg:h-96 bg-slate-100">
          {images.length > 0 ? (
            <img src={images[activeImg]} alt={gem.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              {CATEGORY_EMOJIS[gem.category] ?? "📍"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button onClick={() => setLiked(!liked)} className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
            </button>
            <button onClick={handleSave} disabled={savingLoading} title={saved ? "Remove from Saved Places" : "Save to My Places"} className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow">
              {savingLoading
                ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                : <Bookmark className={`h-4 w-4 ${saved ? "fill-emerald-500 text-emerald-500" : "text-slate-500"}`} />}
            </button>
            <button onClick={handleShare} title={copied ? "Copied!" : "Share"} className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Share2 className={`h-4 w-4 ${copied ? "text-sky-500" : "text-slate-500"}`} />
            </button>
          </div>

          {/* Category badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
            <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
              {CATEGORY_EMOJIS[gem.category] ?? "📍"} {gem.category}
            </span>
            {gem.is_featured && (
              <span className="bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-full">✨ Featured</span>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mb-5">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`h-16 w-20 rounded-lg overflow-hidden border-2 transition ${activeImg === i ? "border-sky-500" : "border-transparent"}`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{gem.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="flex items-center gap-1 text-slate-500 text-sm">
              <MapPin className="h-4 w-4 text-rose-400" /> {gem.location}
            </p>
            {gem.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-current" />
                <span className="text-sm font-semibold text-slate-800">{gem.rating}</span>
                <span className="text-sm text-slate-400">({gem.review_count} reviews)</span>
              </div>
            )}
            <span className="text-sm text-slate-500 font-medium">{gem.budget_level}</span>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-sky-50 rounded-xl p-3 text-center">
            <Calendar className="h-4 w-4 text-sky-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Reviews</p>
            <p className="text-xs font-semibold text-slate-800">{gem.review_count > 0 ? `${gem.review_count}` : "—"}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Category</p>
            <p className="text-xs font-semibold text-slate-800">{gem.category}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <Users className="h-4 w-4 text-amber-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Budget</p>
            <p className="text-xs font-semibold text-slate-800">{gem.budget_level}</p>
          </div>
        </div>

        {/* Description */}
        {gem.description && (
          <div className="mb-5">
            <h2 className="font-bold text-slate-900 mb-2">About this place</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{gem.description}</p>
          </div>
        )}

        {/* Insider Tip */}
        {gem.tip && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-amber-700 mb-1">💡 Insider Tip</p>
            <p className="text-sm text-amber-800">{gem.tip}</p>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link
            to={`/booking/${gem.id}`}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-sky-200"
          >
            Book a Trip Here <ChevronRight className="h-4 w-4" />
          </Link>
          <button
            onClick={handleSave}
            disabled={savingLoading}
            className={`flex-1 sm:flex-none sm:w-auto px-5 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition border-2 ${
              saved
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            {savingLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Bookmark className={`h-4 w-4 ${saved ? "fill-emerald-500" : ""}`} />}
            {saved ? "Saved" : "Save Place"}
          </button>
        </div>

        {/* ─── DESTINATION DISCOVERY ─────────────────────────────────── */}
        {contentLoading ? (
          <div className="border-t border-slate-100 pt-8 flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-sky-400 animate-spin" />
          </div>
        ) : hasDiscovery ? (
          <div className="border-t border-slate-100 pt-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Explore This Destination</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Everything you need to experience {gem.name} like a local.
            </p>

            <PlacesSection items={places} />
            <ActivitiesSection items={activities} />
            <FoodSection items={food} />
            <ProductsSection items={products} />
            <StaysSection items={stays} />
            <ExperiencesSection items={experiences} />
            <NearbyGemsSection nearbyGems={nearbyGems} currentGemId={gem.id} />
          </div>
        ) : (
          nearbyGems.length > 0 && (
            <div className="border-t border-slate-100 pt-8">
              <NearbyGemsSection nearbyGems={nearbyGems} currentGemId={gem.id} />
            </div>
          )
        )}

        {/* ─── REVIEWS ───────────────────────────────────────────── */}
        <div className="border-t border-slate-100 pt-8">
          <ReviewsSection reviews={reviews} loading={reviewsLoading} />
        </div>

        {/* Optional Plus upsell — shown only to free users */}
        {!isPremium && (
          <PlusBanner onUpgrade={() => navigate("/premium")} />
        )}
      </div>
    </AppShell>
  );
}
