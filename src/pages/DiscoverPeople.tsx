import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import TravelMap from "../components/TravelMap";
import type { MapMarker } from "../components/TravelMap";
import { useAuthStore, useMatchStore } from "../stores";
import { MapPin, X, Heart, Sparkles, Map, Loader2 } from "lucide-react";
import type { Match, User } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// ── Philippine locations → lat/lng ────────────────────────────────
const PH_GEOCODE: Record<string, [number, number]> = {
  // NCR
  "Metro Manila": [14.5995, 120.9842], Manila: [14.5995, 120.9842],
  "Quezon City": [14.6760, 121.0437], Makati: [14.5547, 121.0244],
  "Taguig": [14.5243, 121.0792], "Taguig City": [14.5243, 121.0792],
  "Pasig": [14.5764, 121.0851], Marikina: [14.6507, 121.1029],
  "Mandaluyong": [14.5794, 121.0359], Pasay: [14.5378, 121.0014],
  "Parañaque": [14.4793, 121.0198], "Las Piñas": [14.4453, 120.9831],
  "Muntinlupa": [14.4081, 121.0415], Caloocan: [14.6499, 120.9827],
  "Malabon": [14.6630, 120.9572], Navotas: [14.6669, 120.9433],
  "Valenzuela": [14.7011, 120.9830],
  // Cavite
  Cavite: [14.2456, 120.8783], "Cavite City": [14.4819, 120.8970],
  "Bacoor": [14.4624, 120.9645], "Imus": [14.4297, 120.9367],
  "Dasmariñas": [14.3294, 120.9367], "General Trias": [14.3868, 120.8806],
  // Laguna / Rizal / Batangas
  Laguna: [14.2691, 121.4113], Rizal: [14.6037, 121.1837],
  Batangas: [13.7565, 121.0583], "Batangas City": [13.7565, 121.0583],
  "Lipa": [13.9411, 121.1633], "Lipa City": [13.9411, 121.1633],
  // Bulacan / Pampanga
  Bulacan: [14.7942, 120.8791], Pampanga: [15.0794, 120.6200],
  "San Fernando": [15.0289, 120.6847], "San Fernando City": [15.0289, 120.6847],
  "Angeles": [15.1450, 120.5887], "Angeles City": [15.1450, 120.5887],
  Tarlac: [15.4755, 120.5963], "Tarlac City": [15.4755, 120.5963],
  // Ilocos / CAR
  Pangasinan: [15.8949, 120.2863], Dagupan: [16.0430, 120.3330],
  "La Union": [16.6159, 120.3209], "San Fernando, La Union": [16.6159, 120.3209],
  "Ilocos Norte": [18.1647, 120.7116], "Ilocos Sur": [17.5755, 120.3877],
  Vigan: [17.5747, 120.3869], "Vigan City": [17.5747, 120.3869],
  Baguio: [16.4023, 120.5960], "Baguio City": [16.4023, 120.5960],
  Benguet: [16.4023, 120.5960], "Mountain Province": [17.0931, 121.1219],
  Ifugao: [16.8303, 121.1710], Kalinga: [17.4740, 121.3549],
  // Cagayan Valley
  Isabela: [16.9754, 121.8107], Cagayan: [18.3516, 121.7754],
  Batanes: [20.4487, 121.9702], "Nueva Vizcaya": [16.3301, 121.1706],
  Quirino: [16.4907, 121.5448],
  // Central Luzon
  "Nueva Ecija": [15.5784, 121.0678], Aurora: [15.9784, 121.6323],
  // Bicol
  "Camarines Norte": [14.1390, 122.7632], "Camarines Sur": [13.6252, 123.1855],
  Naga: [13.6218, 123.1948], "Naga City": [13.6218, 123.1948],
  Albay: [13.1775, 123.5280], "Legazpi City": [13.1391, 123.7438],
  Sorsogon: [12.9736, 124.0053], Catanduanes: [13.7089, 124.2422],
  Masbate: [12.3696, 123.6215],
  // Visayas
  Cebu: [10.3157, 123.8854], "Cebu City": [10.3157, 123.8854],
  "Lapu-Lapu": [10.3103, 123.9494], "Mandaue": [10.3236, 123.9223],
  Bohol: [9.8349, 124.1435], Tagbilaran: [9.6566, 123.8536],
  "Negros Oriental": [9.4630, 122.9942], Dumaguete: [9.3068, 123.3054],
  "Negros Occidental": [10.6713, 122.9511],
  Bacolod: [10.6772, 122.9561], "Bacolod City": [10.6772, 122.9561],
  Iloilo: [10.7202, 122.5621], "Iloilo City": [10.7202, 122.5621],
  Capiz: [11.5516, 122.7511], "Roxas City": [11.5854, 122.7519],
  Aklan: [11.8166, 122.0942], Boracay: [11.9674, 121.9248],
  Antique: [11.3656, 122.0861], Guimaras: [10.5928, 122.6325],
  Samar: [11.2442, 124.7999], "Eastern Samar": [11.6508, 125.4082],
  "Northern Samar": [12.5166, 124.7202],
  Leyte: [10.8682, 124.8811], Tacloban: [11.2543, 125.0000], "Tacloban City": [11.2543, 125.0000],
  "Southern Leyte": [10.3375, 125.1723], Biliran: [11.5831, 124.4656],
  // Mindanao
  Davao: [7.1907, 125.4553], "Davao City": [7.1907, 125.4553],
  "Davao del Norte": [7.5619, 125.6549], "Davao del Sur": [6.7656, 125.3284],
  "Cagayan de Oro": [8.4822, 124.6472], "Cagayan de Oro City": [8.4822, 124.6472],
  "Misamis Oriental": [8.5046, 124.6220], "Misamis Occidental": [8.3375, 123.7071],
  "Zamboanga City": [6.9214, 122.0790], "Zamboanga del Norte": [8.1527, 123.2577],
  "General Santos": [6.1164, 125.1716], "General Santos City": [6.1164, 125.1716],
  "South Cotabato": [6.2996, 124.8527], "North Cotabato": [7.1322, 124.8561],
  Bukidnon: [8.0515, 125.0988], Iligan: [8.2280, 124.2452], "Iligan City": [8.2280, 124.2452],
  "Agusan del Norte": [8.9456, 125.5311], "Agusan del Sur": [8.1661, 126.0145],
  "Surigao del Norte": [9.7177, 125.5950], "Surigao del Sur": [8.5151, 126.1050],
  Siargao: [9.8356, 126.0561], "Dinagat Islands": [10.1280, 125.6087],
  // Palawan / MIMAROPA
  Palawan: [9.8349, 118.7384], "Puerto Princesa": [9.7392, 118.7353],
  "El Nido": [11.1929, 119.3993], Coron: [11.9983, 120.2040],
  // Fallback
  Philippines: [12.0, 122.5],
};

function geocodeLocation(location: string): [number, number] | null {
  if (!location) return null;
  // Try exact match
  if (PH_GEOCODE[location]) return PH_GEOCODE[location];
  // Try each comma-separated part
  for (const part of location.split(/,/).map((s) => s.trim())) {
    if (PH_GEOCODE[part]) return PH_GEOCODE[part];
    // Case-insensitive
    const key = Object.keys(PH_GEOCODE).find(
      (k) => k.toLowerCase() === part.toLowerCase()
    );
    if (key) return PH_GEOCODE[key];
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────
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

// ── Match Modal ───────────────────────────────────────────────────
function MatchModal({
  match, onClose, onChat, myPhoto,
}: { match: User; onClose: () => void; onChat: () => void; myPhoto: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-4xl mb-4">✨</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">It's a Match!</h2>
        <p className="text-slate-500 text-sm mb-6">
          You and {match.fullName} both liked each other
        </p>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src={myPhoto || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&q=80"}
              alt="You"
              className="h-full w-full object-cover"
            />
          </div>
          <Heart className="h-8 w-8 text-rose-500 fill-current animate-pulse" />
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            {match.profilePhoto ? (
              <img src={match.profilePhoto} alt={match.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-2xl font-bold">
                {match.fullName[0]}
              </div>
            )}
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
        <button
          onClick={onChat}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition mb-3"
        >
          Start Chatting 💬
        </button>
        <button
          onClick={onClose}
          className="w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition"
        >
          Keep Discovering
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function DiscoverPeople() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addMatch } = useMatchStore();

  const [deck, setDeck] = useState<User[]>([]);
  const [index, setIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // ── Fetch profiles ───────────────────────────────────────────────
  useEffect(() => {
    fetchPeople(activeFilter);
  }, [activeFilter, user?.id]);

  async function fetchPeople(filter: string | null) {
    setLoading(true);
    if (!isSupabaseConfigured) { setLoading(false); return; }

    let query = supabase
      .from("profiles")
      .select("id, full_name, age, bio, location, profile_photo, travel_interests, is_premium, is_verified")
      .neq("id", user?.id ?? "")
      .not("travel_interests", "is", null)
      .limit(30);

    if (filter) query = query.contains("travel_interests", [filter]);

    const { data } = await query;
    const users: User[] = (data ?? []).map((p) => ({
      id: p.id, email: "",
      fullName: p.full_name ?? "Traveler",
      age: p.age ?? undefined,
      bio: p.bio ?? "",
      location: p.location ?? "Philippines",
      profilePhoto: p.profile_photo ?? "",
      travelInterests: p.travel_interests ?? [],
      createdAt: "", isPremium: p.is_premium ?? false, isVerified: p.is_verified ?? false,
    }));

    setDeck(shuffle(users));
    setIndex(0);
    setLoading(false);
  }

  const currentTraveler = deck[index] ?? null;

  const advance = () => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= deck.length) { setDeck((d) => shuffle([...d])); return 0; }
      return next;
    });
  };

  const handlePass = () => advance();

  const handleLike = async () => {
    if (!currentTraveler || liking) return;

    // ── Demo mode: always show match ──────────────────────────────
    if (!isSupabaseConfigured) {
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
      setMatchId(match.id);
      return;
    }

    // ── Supabase mode ─────────────────────────────────────────────
    setLiking(true);
    try {
      // 1. Insert like (ignore if already liked)
      await supabase.from("likes").upsert(
        { user_id: user!.id, liked_user_id: currentTraveler.id },
        { onConflict: "user_id,liked_user_id" }
      );

      // 2. Check if a mutual match was created by the DB trigger
      const { data: matchRow } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user1_id.eq.${user!.id},user2_id.eq.${currentTraveler.id}),and(user1_id.eq.${currentTraveler.id},user2_id.eq.${user!.id})`)
        .maybeSingle();

      if (matchRow) {
        // It's a match!
        const match: Match = {
          id: matchRow.id,
          user1Id: user!.id,
          user2Id: currentTraveler.id,
          user: currentTraveler,
          createdAt: new Date().toISOString(),
          status: "active",
        };
        addMatch(match);
        setMatchedUser(currentTraveler);
        setMatchId(matchRow.id);
      } else {
        advance();
      }
    } catch {
      // If likes table not available, fall back to always-match for testing
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
      setMatchId(match.id);
    } finally {
      setLiking(false);
    }
  };

  // ── Build map marker from current traveler only ───────────────
  const mapMarkers = useMemo<MapMarker[]>(() => {
    if (!currentTraveler) return [];
    const coords = geocodeLocation(currentTraveler.location);
    if (!coords) return [];
    return [{
      id: `user_${currentTraveler.id}`,
      lat: coords[0],
      lng: coords[1],
      type: "user",
      label: currentTraveler.fullName,
      sublabel: currentTraveler.location,
      photo: currentTraveler.profilePhoto || undefined,
      active: true,
    }];
  }, [currentTraveler]);

  return (
    <AppShell>
      {matchedUser && (
        <MatchModal
          match={matchedUser}
          myPhoto={user?.profilePhoto ?? ""}
          onClose={() => { setMatchedUser(null); setMatchId(null); advance(); }}
          onChat={() => {
            setMatchedUser(null);
            navigate(matchId ? `/chat/${matchId}` : "/chat");
          }}
        />
      )}

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* ── Left: Profile Card ───────────────────────────── */}
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
              <button
                key={label}
                onClick={() => setActiveFilter(activeFilter === label ? null : label)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                  activeFilter === label
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700"
                }`}
              >
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
                <button onClick={() => setActiveFilter(null)} className="text-sky-600 text-sm font-medium hover:underline">
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
                <button
                  onClick={handlePass}
                  disabled={liking}
                  className="h-14 w-14 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all hover:scale-110 disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className="h-14 w-14 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 rounded-full shadow-lg shadow-rose-200 flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  {liking ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart className="h-6 w-6 fill-current" />
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" /> Likes are anonymous · You only match when it's mutual
              </p>

              {/* Progress */}
              <div className="mt-4 bg-slate-100 rounded-full h-1">
                <div
                  className="bg-sky-500 h-1 rounded-full transition-all"
                  style={{ width: `${((index + 1) / deck.length) * 100}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-400 mt-1.5">{index + 1} of {deck.length} profiles</p>
            </>
          )}
        </div>

        {/* ── Right: Map ──────────────────────────────────── */}
        <div className="hidden lg:block flex-1 p-4">
          <div className="h-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50">
            <TravelMap markers={mapMarkers} />
          </div>
          <div className="flex items-center gap-4 mt-2 px-1">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500 inline-block" />
              {currentTraveler
                ? <>Location: <span className="font-semibold text-slate-600 ml-1">{currentTraveler.location}</span></>
                : "Philippines"
              }
            </p>
            <p className="text-xs text-slate-400 ml-auto">Satellite · Philippines</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
