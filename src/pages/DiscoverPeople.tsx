import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import TravelMap from "../components/TravelMap";
import type { MapMarker } from "../components/TravelMap";
import { useAuthStore, useMatchStore } from "../stores";
import { MapPin, X, Heart, Sparkles, Map, Loader2 } from "lucide-react";
import type { Match, User } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// ── Static gem markers for the map ───────────────────────────────
const GEM_MARKERS: MapMarker[] = [
  { id: "feat1", lat: 11.967, lng: 121.924, type: "featured", label: "Boracay", sublabel: "White Beach, Aklan" },
  { id: "feat2", lat: 11.171, lng: 119.409, type: "featured", label: "El Nido", sublabel: "Palawan" },
  { id: "feat3", lat: 9.835,  lng: 126.050, type: "featured", label: "Siargao", sublabel: "Surigao del Norte" },
  { id: "gem1",  lat: 16.412, lng: 120.594, type: "gem",      label: "Baguio City", sublabel: "Session Road cafes" },
  { id: "gem2",  lat: 17.574, lng: 120.387, type: "gem",      label: "Vigan City", sublabel: "Spanish heritage town" },
  { id: "gem3",  lat: 9.803,  lng: 124.169, type: "gem",      label: "Chocolate Hills", sublabel: "Bohol" },
  { id: "gem4",  lat: 11.998, lng: 120.203, type: "gem",      label: "Coron", sublabel: "Palawan dive spots" },
  { id: "gem5",  lat: 16.919, lng: 121.085, type: "gem",      label: "Batad Rice Terraces", sublabel: "Ifugao" },
  { id: "gem6",  lat: 13.257, lng: 123.685, type: "gem",      label: "Mayon Volcano", sublabel: "Albay" },
];

const INTEREST_EMOJI: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Food: "🍜",
  Heritage: "🏛", Cafe: "☕", Waterfalls: "💦", City: "🌆",
  "Beach & Island Hopping": "🏖", "Nature & Hiking": "🌿",
  "Camping & Outdoors": "⛺", "City Exploring": "🌆",
  "Food & Cafés": "🍜", Photography: "📷", "History & Culture": "🏛",
  "Arts & Creative Places": "🎨", "Adventure & Thrills": "🪂",
  "Scenic & Sunset Spots": "🌅", "Shopping & Local Markets": "🛍",
  "Relaxation & Wellness": "🧘", Staycations: "🏨",
  "Road Trips": "🚗", "Hidden Gems": "💎",
  "Events & Festivals": "🎉", "Eco & Sustainable Travel": "♻️",
  "Couple Getaways": "💑", "Group Trips": "👥", "Budget Travel": "💰",
};

const FILTER_CHIPS = [
  { label: "Beach", emoji: "🏖" },
  { label: "Mountain", emoji: "🏔" },
  { label: "Nature", emoji: "🌿" },
  { label: "Food", emoji: "🍜" },
  { label: "Heritage", emoji: "🏛" },
  { label: "Cafe", emoji: "☕" },
  { label: "Waterfalls", emoji: "💦" },
  { label: "City", emoji: "🌆" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MatchModal({ match, onClose, onChat, myPhoto }: { match: User; onClose: () => void; onChat: () => void; myPhoto: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-4xl mb-4">✨</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">It's a Match!</h2>
        <p className="text-slate-500 text-sm mb-6">You and {match.fullName} both liked each other</p>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img src={myPhoto || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&q=80"} alt="You" className="h-full w-full object-cover" />
          </div>
          <Heart className="h-8 w-8 text-rose-500 fill-current animate-pulse" />
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img src={match.profilePhoto} alt={match.fullName} className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="mb-6">
          <p className="text-xs text-slate-500 mb-2">You both love:</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {match.travelInterests.slice(0, 3).map((i) => (
              <span key={i} className="bg-sky-50 text-sky-700 text-xs px-3 py-1 rounded-full font-medium">
                {INTEREST_EMOJI[i] ?? "📍"} {i}
              </span>
            ))}
          </div>
        </div>
        <button onClick={onChat} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition mb-3">
          Start Chatting 💬
        </button>
        <button onClick={onClose} className="w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition">
          Keep Discovering
        </button>
      </div>
    </div>
  );
}

export default function DiscoverPeople() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addMatch } = useMatchStore();

  const [deck, setDeck] = useState<User[]>([]);
  const [index, setIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPeople() {
      setLoading(true);
      if (!isSupabaseConfigured) { setLoading(false); return; }

      let query = supabase
        .from("profiles")
        .select("id, full_name, age, bio, location, profile_photo, travel_interests, is_premium, is_verified")
        .neq("id", user?.id ?? "")
        .not("travel_interests", "is", null)
        .limit(20);

      if (activeFilter) {
        query = query.contains("travel_interests", [activeFilter]);
      }

      const { data } = await query;

      const users: User[] = (data ?? []).map((p) => ({
        id: p.id,
        email: "",
        fullName: p.full_name ?? "Traveler",
        age: p.age ?? undefined,
        bio: p.bio ?? "",
        location: p.location ?? "Philippines",
        profilePhoto: p.profile_photo ?? "",
        travelInterests: p.travel_interests ?? [],
        createdAt: "",
        isPremium: p.is_premium ?? false,
        isVerified: p.is_verified ?? false,
      }));

      setDeck(shuffle(users));
      setIndex(0);
      setLoading(false);
    }
    fetchPeople();
  }, [activeFilter, user?.id]);

  const currentTraveler = deck[index] ?? null;

  const advance = () => {
    if (index + 1 >= deck.length) {
      setDeck((d) => shuffle([...d]));
      setIndex(0);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handlePass = () => advance();

  const handleLike = () => {
    if (!currentTraveler) return;
    const isMutual = Math.random() < 0.3;
    if (isMutual) {
      const match: Match = {
        id: `match_${Date.now()}`,
        user1Id: user?.id ?? "",
        user2Id: currentTraveler.id,
        user: currentTraveler,
        createdAt: new Date().toISOString(),
        status: "active",
      };
      addMatch(match);
      setMatchedUser(currentTraveler);
    } else {
      advance();
    }
  };

  const mapMarkers = useMemo<MapMarker[]>(() => GEM_MARKERS, []);

  return (
    <AppShell>
      {matchedUser && (
        <MatchModal
          match={matchedUser}
          myPhoto={user?.profilePhoto ?? ""}
          onClose={() => { setMatchedUser(null); advance(); }}
          onChat={() => { setMatchedUser(null); navigate("/chat"); }}
        />
      )}

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* ── Left: Profile Card ──────────────────────────────── */}
        <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 overflow-y-auto px-4 py-5 lg:border-r lg:border-slate-100">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Find Your Travel People</h1>
              <p className="text-slate-500 text-xs mt-0.5">Meet Filipinos who share your interests</p>
            </div>
            <button
              onClick={() => setShowMapMobile((v) => !v)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200"
            >
              <Map className="h-3.5 w-3.5" /> Map
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {FILTER_CHIPS.map(({ label, emoji }) => (
              <button key={label}
                onClick={() => setActiveFilter(activeFilter === label ? null : label)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                  activeFilter === label
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700"
                }`}>
                {emoji} {label}
              </button>
            ))}
          </div>

          {/* Mobile map panel */}
          {showMapMobile && (
            <div className="lg:hidden h-56 mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow">
              <TravelMap markers={mapMarkers} />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && !currentTraveler && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🌏</div>
              <h3 className="font-semibold text-slate-700 mb-1">
                {activeFilter ? `No travelers with "${activeFilter}" interest yet` : "No travelers found yet"}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {activeFilter ? "Try a different filter or check back later." : "Be the first to invite friends to TCUnnect!"}
              </p>
              {activeFilter && (
                <button onClick={() => setActiveFilter(null)}
                  className="text-sky-600 text-sm font-medium hover:underline">
                  Clear filter
                </button>
              )}
            </div>
          )}

          {!loading && currentTraveler && (
            <>
              {/* Card */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
                <div className="relative h-80">
                  {currentTraveler.profilePhoto ? (
                    <img src={currentTraveler.profilePhoto} alt={currentTraveler.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-100 to-slate-200 flex items-center justify-center">
                      <span className="text-6xl">👤</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                  {currentTraveler.isVerified && (
                    <span className="absolute top-3 right-3 bg-sky-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">✓ Verified</span>
                  )}
                  {currentTraveler.isPremium && (
                    <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded-full">👑 Premium</span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-xl font-bold">
                      {currentTraveler.fullName}{currentTraveler.age ? `, ${currentTraveler.age}` : ""}
                    </h3>
                    <p className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                      <MapPin className="h-3 w-3" /> {currentTraveler.location}
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  {currentTraveler.bio && (
                    <p className="text-slate-600 text-sm mb-3 italic">"{currentTraveler.bio}"</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {currentTraveler.travelInterests.map((i) => (
                      <span key={i} className="bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {INTEREST_EMOJI[i] ?? "📍"} {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 mt-5">
                <button onClick={handlePass}
                  className="h-14 w-14 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all hover:scale-110">
                  <X className="h-6 w-6" />
                </button>
                <button onClick={handleLike}
                  className="h-14 w-14 bg-rose-500 hover:bg-rose-600 rounded-full shadow-lg shadow-rose-200 flex items-center justify-center text-white transition-all hover:scale-110">
                  <Heart className="h-6 w-6 fill-current" />
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" /> Likes are anonymous · You only match when it's mutual
              </p>

              {/* Progress */}
              <div className="mt-4 bg-slate-100 rounded-full h-1">
                <div className="bg-sky-500 h-1 rounded-full transition-all" style={{ width: `${((index + 1) / deck.length) * 100}%` }} />
              </div>
              <p className="text-center text-xs text-slate-400 mt-1.5">{index + 1} of {deck.length} profiles</p>
            </>
          )}
        </div>

        {/* ── Right: Map ─────────────────────────────────────── */}
        <div className="hidden lg:block flex-1 p-4">
          <div className="h-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50">
            <TravelMap markers={mapMarkers} />
          </div>
          <div className="flex items-center gap-4 mt-2 px-1">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500 inline-block" />
              Active: <span className="font-semibold text-slate-600">{currentTraveler?.location ?? "Philippines"}</span>
            </p>
            <p className="text-xs text-slate-400 ml-auto">Satellite · Philippines</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
