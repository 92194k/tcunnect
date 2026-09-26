import { useState, useEffect } from "react";

const CATEGORY_EMOJIS: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Heritage: "🏛",
  Cafe: "☕", Waterfalls: "💦", City: "🌆", Food: "🍜",
};

import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import {
  MapPin, Star, ArrowLeft, Heart, Share2, Calendar, Clock,
  Users, ChevronRight, Loader2, Lock, Utensils, ShoppingBag,
  Bed, Compass, Sparkles, ExternalLink, Phone, Bookmark,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

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
  best_time: string;
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

// ─── Static discovery data (future: pull from Supabase) ───────────────────────
// Each section is keyed by gem category so discovery feels relevant.
// For now we use curated placeholder data; real business listings come later.

const DISCOVERY_DATA: Record<string, {
  places: { name: string; desc: string; distance: string; tag: string }[];
  activities: { name: string; desc: string; duration: string; tag: string }[];
  food: { name: string; desc: string; type: string; price: string }[];
  products: { name: string; desc: string; where: string }[];
  stays: { name: string; desc: string; price: string; type: string }[];
  experiences: { name: string; desc: string; price: string; action: "Book Now" | "Inquire" | "View Details" | "Get Directions" }[];
}> = {
  Beach: {
    places: [
      { name: "Coral Garden Viewpoint", desc: "Crystal-clear waters teeming with marine life. Great for snorkeling at low tide.", distance: "0.8 km", tag: "🐠 Snorkel Spot" },
      { name: "Sunset Bluff", desc: "The best vantage point for the most dramatic sunsets on the island.", distance: "1.5 km", tag: "🌅 Sunset Spot" },
      { name: "Hidden Lagoon", desc: "A secluded lagoon only accessible by a short hike through coconut groves.", distance: "2.1 km", tag: "🏝 Secluded" },
    ],
    activities: [
      { name: "Island Hopping Tour", desc: "Explore 3–5 surrounding islands with a local bangka crew.", duration: "Full day", tag: "⛵ Boat Tour" },
      { name: "Snorkel & Freedive", desc: "Guided underwater adventure over pristine coral reefs.", duration: "3–4 hrs", tag: "🤿 Water Activity" },
      { name: "Kayak Rental", desc: "Paddle at your own pace along the coastline.", duration: "Flexible", tag: "🚣 Self-Guided" },
    ],
    food: [
      { name: "Kubo sa Dalampasigan", desc: "Fresh catch grilled to order. The garlic shrimp is a must-try.", type: "Seafood Grill", price: "₱300–₱600 / person" },
      { name: "Sari-Sari Smoothie Bar", desc: "Cold coconut shakes and local fruit blends. Perfect after a swim.", type: "Drinks & Snacks", price: "₱80–₱150" },
      { name: "Lola Elena's Karinderya", desc: "Home-cooked Filipino food. Try the kare-kare on weekends.", type: "Filipino", price: "₱120–₱250 / meal" },
    ],
    products: [
      { name: "Woven Banig Mats", desc: "Handwoven by local weavers. Doubles as a beach blanket.", where: "Barangay Crafts Market" },
      { name: "Dried Danggit & Tuyô", desc: "Local sun-dried fish — great pasalubong for the family.", where: "Bayside Tiangge" },
      { name: "Shell & Sea Glass Jewelry", desc: "Handcrafted by coastal artisans using natural materials.", where: "Port Gift Shop" },
    ],
    stays: [
      { name: "Beachfront Glamping", desc: "Tent cabins right on the sand with full amenities.", price: "From ₱2,500/night", type: "🏕 Glamping" },
      { name: "Nipa Hut Guesthouse", desc: "Cozy traditional-style rooms steps from the water.", price: "From ₱900/night", type: "🏡 Guesthouse" },
      { name: "Budget Hostel — The Hammock", desc: "Dorms and private rooms for solo travelers. Great common area.", price: "From ₱450/night", type: "🛏 Hostel" },
    ],
    experiences: [
      { name: "Sunrise Paddleboard Session", desc: "Greet the morning on the water with a local instructor.", price: "₱750/person", action: "Book Now" },
      { name: "Seaweed Farm Visit", desc: "Learn how local communities cultivate seaweed sustainably.", price: "Free (donation)", action: "Get Directions" },
      { name: "Coastal Cleanup & Dive", desc: "Give back to the reef — guided cleanup with free dive rental.", price: "₱500/person", action: "Inquire" },
    ],
  },
  Mountain: {
    places: [
      { name: "Summit Viewdeck", desc: "360° views of the valley and neighboring peaks on clear mornings.", distance: "At peak", tag: "🏔 Viewpoint" },
      { name: "Mossy Forest Trail", desc: "A surreal cloud-forest zone accessible from the mid-trail junction.", distance: "3.2 km in", tag: "🌿 Trail" },
      { name: "Cold Spring Basin", desc: "A natural cold pool at the base of the mountain. Post-hike essential.", distance: "0.5 km", tag: "💧 Swimming Hole" },
    ],
    activities: [
      { name: "Guided Summit Trek", desc: "With a certified local guide who knows every shortcut and story.", duration: "6–8 hrs", tag: "🥾 Hiking" },
      { name: "Birdwatching at Dawn", desc: "Spot endemic species at sunrise with a birding enthusiast guide.", duration: "3–4 hrs", tag: "🦅 Wildlife" },
      { name: "Mountain Biking Trail", desc: "Intermediate trail with epic views. Bike rental available at trailhead.", duration: "2–3 hrs", tag: "🚵 Biking" },
    ],
    food: [
      { name: "Amá's Halo-Halo Hut", desc: "Legendary roadside stop with towering halo-halo and hot lugaw.", type: "Snacks & Sweets", price: "₱80–₱180" },
      { name: "Mountain View Eatery", desc: "Piping hot bulalo and grilled corn while overlooking the valley.", type: "Filipino / Comfort Food", price: "₱250–₱500 / meal" },
      { name: "Café Altitude", desc: "Specialty coffee made with locally grown beans. Good WiFi.", type: "Café", price: "₱120–₱250" },
    ],
    products: [
      { name: "Local Strawberry Jam", desc: "Made fresh from highland farms. No preservatives.", where: "Farmers' Roadside Stalls" },
      { name: "Hand-Knit Blankets & Scarves", desc: "Indigenous weave patterns in wool and cotton blends.", where: "Village Weavers Coop" },
      { name: "Root Crop Snack Bags", desc: "Dried camote, gabi, and cassava chips — best trail snack.", where: "Mountaintop Pasalubong Shop" },
    ],
    stays: [
      { name: "Firepit Glamping Pod", desc: "Heated pods with mountain views and a private fire pit.", price: "From ₱3,200/night", type: "🏕 Glamping" },
      { name: "Pine Lodge Guesthouse", desc: "Log cabin vibes with hot showers and hearty breakfasts included.", price: "From ₱1,400/night", type: "🏡 Guesthouse" },
      { name: "Camp Base Hostel", desc: "The go-to for hikers — wake-up calls, packed lunches, gear storage.", price: "From ₱600/night", type: "🛏 Hostel" },
    ],
    experiences: [
      { name: "Overnight Camping Package", desc: "Tent, meals, and a guide from base to summit and back.", price: "₱1,800/person", action: "Book Now" },
      { name: "Coffee Farm Tour", desc: "See how highland beans are grown, harvested, and roasted.", price: "₱350/person", action: "Inquire" },
      { name: "Waterfall Photography Walk", desc: "A slow-paced scenic walk with a local photographer/guide.", price: "₱600/person", action: "Book Now" },
    ],
  },
  default: {
    places: [
      { name: "Town Plaza & Heritage Church", desc: "The heart of the community — centuries of Filipino history in one square.", distance: "Town center", tag: "🏛 Heritage" },
      { name: "Local Market (Palengke)", desc: "Vibrant morning market with fresh produce, snacks, and local color.", distance: "0.5 km", tag: "🛒 Market" },
      { name: "Nature Walk Trailhead", desc: "A pleasant walk through local flora with views of the surrounding area.", distance: "1.2 km", tag: "🌿 Trail" },
    ],
    activities: [
      { name: "Cultural Walking Tour", desc: "A local guide brings the history of the area to life on foot.", duration: "2–3 hrs", tag: "🚶 Walking Tour" },
      { name: "Cooking Class: Filipino Classics", desc: "Learn to make adobo, sinigang, or native kakanin from a local cook.", duration: "2–3 hrs", tag: "🍳 Cooking" },
      { name: "Tricycle City Hop", desc: "Get around like a local — hire a tricycle for a self-paced circuit.", duration: "Flexible", tag: "🛺 Local Transport" },
    ],
    food: [
      { name: "Lutong Bahay Carinderia", desc: "Home-style Filipino cooking. The daily specials are always the best bet.", type: "Filipino Home Cooking", price: "₱100–₱200 / meal" },
      { name: "Buko Pie & Pasalubong Corner", desc: "Famous local pastries and native sweets to bring home.", type: "Bakery / Pasalubong", price: "₱50–₱200" },
      { name: "Merienda Spot by the Park", desc: "Kwek-kwek, fishballs, and cold gulaman. A classic Filipino afternoon snack run.", type: "Street Food", price: "₱20–₱80" },
    ],
    products: [
      { name: "Bayong & Woven Bags", desc: "Traditional Filipino bags hand-woven from buri or rattan.", where: "Municipal Crafts Center" },
      { name: "Native Delicacies Sampler", desc: "Assorted local kakanin and sweets — the perfect pasalubong set.", where: "Palengke / Market Stalls" },
      { name: "Handmade Pottery", desc: "Earthenware crafted by local potters using traditional methods.", where: "Artisan Village" },
    ],
    stays: [
      { name: "Heritage Pension House", desc: "Charming old-style rooms in a well-preserved colonial building.", price: "From ₱900/night", type: "🏡 Pension House" },
      { name: "Family Inn & Breakfast", desc: "Homey and affordable. Breakfast is included and genuinely good.", price: "From ₱750/night", type: "🏡 Inn" },
      { name: "Budget Guesthouse", desc: "Clean, simple, well-located. Great for budget travelers.", price: "From ₱450/night", type: "🛏 Guesthouse" },
    ],
    experiences: [
      { name: "Local Family Homestay", desc: "Live with a Filipino family for a day or weekend. Immersive and heartwarming.", price: "From ₱1,200/night", action: "Inquire" },
      { name: "Jeepney Art Workshop", desc: "Paint a mini-jeepney with a local folk artist. Great for kids too.", price: "₱400/person", action: "Book Now" },
      { name: "Fiesta & Festival Events", desc: "Check if a local fiesta or festival is happening during your visit.", price: "Usually free", action: "View Details" },
    ],
  },
};

function getDiscoveryData(category: string) {
  return DISCOVERY_DATA[category] ?? DISCOVERY_DATA.default;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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

function PlacesSection({ places }: { places: typeof DISCOVERY_DATA.Beach.places }) {
  return (
    <div className="mb-6">
      <SectionHeader icon={<MapPin className="h-4 w-4" />} title="Places to Visit" subtitle="Nearby spots worth exploring" />
      <div className="space-y-3">
        {places.map((place) => (
          <div key={place.name} className="bg-slate-50 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">{place.tag.split(" ")[0]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 text-sm">{place.name}</p>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">📍 {place.distance}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{place.desc}</p>
              <span className="inline-block mt-1.5 text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">{place.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitiesSection({ activities }: { activities: typeof DISCOVERY_DATA.Beach.activities }) {
  return (
    <div className="mb-6">
      <SectionHeader icon={<Compass className="h-4 w-4" />} title="Things to Do" subtitle="Activities for every kind of traveler" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activities.map((act) => (
          <div key={act.name} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-slate-900 text-sm">{act.name}</p>
              <span className="text-[10px] text-slate-400 flex-shrink-0">⏱ {act.duration}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{act.desc}</p>
            <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{act.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FoodSection({ food }: { food: typeof DISCOVERY_DATA.Beach.food }) {
  return (
    <div className="mb-6">
      <SectionHeader icon={<Utensils className="h-4 w-4" />} title="Food & Drinks" subtitle="Local flavors you shouldn't miss" />
      <div className="space-y-3">
        {food.map((item) => (
          <div key={item.name} className="border border-slate-100 bg-white rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{item.type}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 flex-shrink-0">{item.price}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsSection({ products }: { products: typeof DISCOVERY_DATA.Beach.products }) {
  return (
    <div className="mb-6">
      <SectionHeader icon={<ShoppingBag className="h-4 w-4" />} title="Products & Local Finds" subtitle="Take a piece of the Philippines home" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {products.map((p) => (
          <div key={p.name} className="bg-slate-50 rounded-xl p-4">
            <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {p.where}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaysSection({ stays }: { stays: typeof DISCOVERY_DATA.Beach.stays }) {
  return (
    <div className="mb-6">
      <SectionHeader icon={<Bed className="h-4 w-4" />} title="Where to Stay" subtitle="Rest well before the next adventure" />
      <div className="space-y-3">
        {stays.map((stay) => (
          <div key={stay.name} className="border border-slate-100 bg-white rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{stay.name}</p>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{stay.type}</span>
              </div>
              <span className="text-xs font-semibold text-sky-700 flex-shrink-0">{stay.price}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{stay.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperiencesSection({ experiences }: { experiences: typeof DISCOVERY_DATA.Beach.experiences }) {
  const actionStyle: Record<string, string> = {
    "Book Now": "bg-sky-600 hover:bg-sky-700 text-white",
    "Inquire": "bg-slate-800 hover:bg-slate-900 text-white",
    "View Details": "border border-slate-300 hover:bg-slate-50 text-slate-700",
    "Get Directions": "border border-sky-300 hover:bg-sky-50 text-sky-700",
  };
  const actionIcon: Record<string, React.ReactNode> = {
    "Book Now": <ChevronRight className="h-3.5 w-3.5" />,
    "Inquire": <Phone className="h-3.5 w-3.5" />,
    "View Details": <ExternalLink className="h-3.5 w-3.5" />,
    "Get Directions": <MapPin className="h-3.5 w-3.5" />,
  };

  return (
    <div className="mb-6">
      <SectionHeader icon={<Sparkles className="h-4 w-4" />} title="Experiences" subtitle="Unforgettable moments, only here" />
      <div className="space-y-3">
        {experiences.map((exp) => (
          <div key={exp.name} className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{exp.name}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{exp.desc}</p>
                <p className="text-xs font-bold text-emerald-700 mt-2">{exp.price}</p>
              </div>
              <button className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-full transition ${actionStyle[exp.action]}`}>
                {actionIcon[exp.action]} {exp.action}
              </button>
            </div>
          </div>
        ))}
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

function PlusPaywall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 mb-6 text-center">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)", backgroundSize: "24px 24px" }} />
      <div className="relative">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-1">Explore This Destination</h3>
        <p className="text-slate-600 text-sm mb-1">Unlock the full discovery layer — places, food, stays, activities, experiences, and more.</p>
        <p className="text-xs text-slate-400 mb-5">Available exclusively on <span className="font-bold text-amber-600">TCUnnect Plus</span></p>

        <div className="grid grid-cols-3 gap-2 mb-5 text-xs text-slate-600">
          {[
            { icon: "📍", label: "Places to Visit" },
            { icon: "🎯", label: "Things to Do" },
            { icon: "🍜", label: "Food & Drinks" },
            { icon: "🛍", label: "Local Finds" },
            { icon: "🛏", label: "Where to Stay" },
            { icon: "✨", label: "Experiences" },
          ].map((f) => (
            <div key={f.label} className="bg-white/70 rounded-xl py-2.5 px-1 border border-amber-100">
              <div className="text-lg mb-1">{f.icon}</div>
              <p className="font-medium text-[10px] leading-tight">{f.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onUpgrade}
          className="w-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <Sparkles className="h-4 w-4" /> Upgrade to TCUnnect Plus
        </button>
        <p className="text-[10px] text-slate-400 mt-2">Starts at ₱99/month · Cancel anytime</p>
      </div>
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

  const isPremium = user?.isPremium ?? false;

  useEffect(() => {
    if (!gemId) return;
    fetchGem(gemId);
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
      .select("id, name, location, category, images, rating, review_count, budget_level, description, tip, best_time, is_featured")
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
    // Fetch other approved gems in the same location or category
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
      } catch {
        /* cancelled */
      }
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
  const discovery = getDiscoveryData(gem.category);

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
            <img
              src={images[activeImg]}
              alt={gem.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              {CATEGORY_EMOJIS[gem.category] ?? "📍"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => setLiked(!liked)}
              className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
            </button>
            <button
              onClick={handleSave}
              disabled={savingLoading}
              title={saved ? "Remove from Saved Places" : "Save to My Places"}
              className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow"
            >
              {savingLoading
                ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                : <Bookmark className={`h-4 w-4 ${saved ? "fill-emerald-500 text-emerald-500" : "text-slate-500"}`} />}
            </button>
            <button
              onClick={handleShare}
              title={copied ? "Copied!" : "Share"}
              className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow"
            >
              <Share2 className={`h-4 w-4 ${copied ? "text-sky-500" : "text-slate-500"}`} />
            </button>
          </div>

          {/* Category badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
            <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
              {CATEGORY_EMOJIS[gem.category] ?? "📍"} {gem.category}
            </span>
            {gem.is_featured && (
              <span className="bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-full">
                ✨ Featured
              </span>
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
                className={`h-16 w-20 rounded-lg overflow-hidden border-2 transition ${
                  activeImg === i ? "border-sky-500" : "border-transparent"
                }`}
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
            <p className="text-[10px] text-slate-500 mb-0.5">Best Time</p>
            <p className="text-xs font-semibold text-slate-800">{gem.best_time || "—"}</p>
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
        <div className="border-t border-slate-100 pt-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Explore This Destination</h2>
            {isPremium && (
              <span className="ml-auto text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full tracking-wide">
                PLUS
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Everything you need to experience {gem.name} like a local.
          </p>

          {isPremium ? (
            <>
              <PlacesSection places={discovery.places} />
              <ActivitiesSection activities={discovery.activities} />
              <FoodSection food={discovery.food} />
              <ProductsSection products={discovery.products} />
              <StaysSection stays={discovery.stays} />
              <ExperiencesSection experiences={discovery.experiences} />
              <NearbyGemsSection nearbyGems={nearbyGems} currentGemId={gem.id} />
            </>
          ) : (
            <PlusPaywall onUpgrade={() => navigate("/premium")} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
