import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  "Metro Manila": [14.5995, 120.9842], Manila: [14.5995, 120.9842],
  "Quezon City": [14.6760, 121.0437], Makati: [14.5547, 121.0244],
  "Taguig": [14.5243, 121.0792], "Taguig City": [14.5243, 121.0792],
  "Pasig": [14.5764, 121.0851], Marikina: [14.6507, 121.1029],
  "Mandaluyong": [14.5794, 121.0359], Pasay: [14.5378, 121.0014],
  "Parañaque": [14.4793, 121.0198], "Las Piñas": [14.4453, 120.9831],
  "Muntinlupa": [14.4081, 121.0415], Caloocan: [14.6499, 120.9827],
  "Malabon": [14.6630, 120.9572], Navotas: [14.6669, 120.9433],
  "Valenzuela": [14.7011, 120.9830],
  Cavite: [14.2456, 120.8783], "Cavite City": [14.4819, 120.8970],
  "Bacoor": [14.4624, 120.9645], "Imus": [14.4297, 120.9367],
  "Dasmariñas": [14.3294, 120.9367], "General Trias": [14.3868, 120.8806],
  Laguna: [14.2691, 121.4113], Rizal: [14.6037, 121.1837],
  Batangas: [13.7565, 121.0583], "Batangas City": [13.7565, 121.0583],
  "Lipa": [13.9411, 121.1633], "Lipa City": [13.9411, 121.1633],
  Bulacan: [14.7942, 120.8791], Pampanga: [15.0794, 120.6200],
  "San Fernando": [15.0289, 120.6847], "San Fernando City": [15.0289, 120.6847],
  "Angeles": [15.1450, 120.5887], "Angeles City": [15.1450, 120.5887],
  Tarlac: [15.4755, 120.5963], "Tarlac City": [15.4755, 120.5963],
  Pangasinan: [15.8949, 120.2863], Dagupan: [16.0430, 120.3330],
  "La Union": [16.6159, 120.3209], "San Fernando, La Union": [16.6159, 120.3209],
  "Ilocos Norte": [18.1647, 120.7116], "Ilocos Sur": [17.5755, 120.3877],
  Vigan: [17.5747, 120.3869], "Vigan City": [17.5747, 120.3869],
  Baguio: [16.4023, 120.5960], "Baguio City": [16.4023, 120.5960],
  Benguet: [16.4023, 120.5960], "Mountain Province": [17.0931, 121.1219],
  Ifugao: [16.8303, 121.1710], Kalinga: [17.4740, 121.3549],
  Isabela: [16.9754, 121.8107], Cagayan: [18.3516, 121.7754],
  Batanes: [20.4487, 121.9702], "Nueva Vizcaya": [16.3301, 121.1706],
  Quirino: [16.4907, 121.5448],
  "Nueva Ecija": [15.5784, 121.0678], Aurora: [15.9784, 121.6323],
  "Camarines Norte": [14.1390, 122.7632], "Camarines Sur": [13.6252, 123.1855],
  Naga: [13.6218, 123.1948], "Naga City": [13.6218, 123.1948],
  Albay: [13.1775, 123.5280], "Legazpi City": [13.1391, 123.7438],
  Sorsogon: [12.9736, 124.0053], Catanduanes: [13.7089, 124.2422],
  Masbate: [12.3696, 123.6215],
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
  Palawan: [9.8349, 118.7384], "Puerto Princesa": [9.7392, 118.7353],
  "El Nido": [11.1929, 119.3993], Coron: [11.9983, 120.2040],
  Philippines: [12.0, 122.5],
};

function geocodeLocation(location: string): [number, number] | null {
  if (!location) return null;
  if (PH_GEOCODE[location]) return PH_GEOCODE[location];
  for (const part of location.split(/,/).map((s) => s.trim())) {
    if (PH_GEOCODE[part]) return PH_GEOCODE[part];
    const key = Object.keys(PH_GEOCODE).find(
      (k) => k.toLowerCase() === part.toLowerCase()
    );
    if (key) return PH_GEOCODE[key];
  }
  return null;
}

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
  traveler, onClose, onChat, myPhoto,
}: {
  traveler: User;
  onClose: () => void;
  onChat: () => void;
  myPhoto: string;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fadeIn">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">It's a Match!</h2>
        <p className="text-slate-500 text-sm mb-6">
          You and <span className="font-semibold text-slate-700">{traveler.fullName}</span> liked each other!
        </p>

        {/* Avatars */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-sky-300">
            {myPhoto ? (
              <img src={myPhoto} alt="You" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-2xl font-bold">
                👤
              </div>
            )}
          </div>
          <Heart className="h-8 w-8 text-rose-500 fill-current animate-pulse" />
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-rose-300">
            {traveler.profilePhoto ? (
              <img src={traveler.profilePhoto} alt={traveler.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-2xl font-bold">
                {traveler.fullName[0]}
              </div>
            )}
          </div>
        </div>

        {/* Shared interests */}
        {traveler.travelInterests.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-medium">You both love</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {traveler.travelInterests.slice(0, 3).map((i) => (
                <span key={i} className="bg-sky-50 text-sky-700 text-xs px-3 py-1 rounded-full font-medium border border-sky-100">
                  {INTEREST_EMOJI[i] ?? "📍"} {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={onChat}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3.5 rounded-xl transition-colors mb-3 flex items-center justify-center gap-2"
        >
          💬 Send a Message
        </button>
        <button
          onClick={onClose}
          className="w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition-colors"
        >
          Keep Exploring
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── Match phase type ──────────────────────────────────────────────
type MatchPhase = "idle" | "animating" | "modal";

// ── Main Page ─────────────────────────────────────────────────────
export default function DiscoverPeople() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addMatch } = useMatchStore();

  const [deck, setDeck] = useState<User[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);

  // ── Match state machine ───────────────────────────────────────────
  // pendingMatch: holds the matched traveler + match ID throughout the animation → modal flow
  const [pendingMatch, setPendingMatch] = useState<{ traveler: User; matchId: string } | null>(null);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("idle");

  // When phase transitions to "animating", auto-advance to "modal" after 2 s
  useEffect(() => {
    if (matchPhase !== "animating") return;
    const timer = setTimeout(() => setMatchPhase("modal"), 2000);
    return () => clearTimeout(timer);
  }, [matchPhase]);

  const matchAnimation = matchPhase === "animating";
  const showModal = matchPhase === "modal" && pendingMatch !== null;

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

  // During a match sequence, freeze the displayed traveler so the card/map don't jump
  const currentTraveler: User | null =
    (pendingMatch && matchPhase !== "idle") ? pendingMatch.traveler : (deck[index] ?? null);

  const advance = () => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= deck.length) { setDeck((d) => shuffle([...d])); return 0; }
      return next;
    });
  };

  // ── Start match sequence ─────────────────────────────────────────
  function startMatch(traveler: User, matchId: string) {
    const match: Match = {
      id: matchId,
      user1Id: user?.id ?? "",
      user2Id: traveler.id,
      user: traveler,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    addMatch(match);
    setPendingMatch({ traveler, matchId });
    setMatchPhase("animating"); // triggers the useEffect timer → "modal"
  }

  // ── Dismiss match (Keep Exploring) ───────────────────────────────
  function dismissMatch() {
    setPendingMatch(null);
    setMatchPhase("idle");
    advance();
  }

  // ── Navigate to chat ─────────────────────────────────────────────
  function goToChat() {
    if (!pendingMatch) return;
    const { traveler, matchId } = pendingMatch;
    setPendingMatch(null);
    setMatchPhase("idle");
    navigate(`/chat/${matchId}`, {
      state: {
        systemMessage: `You and ${traveler.fullName} liked each other! You can now start chatting. 🎉`,
      },
    });
  }

  // ── Like handler ──────────────────────────────────────────────────
  const handleLike = async () => {
    if (!currentTraveler || liking || matchPhase !== "idle") return;

    // Demo mode (no Supabase) — always simulate a match
    if (!isSupabaseConfigured) {
      startMatch(currentTraveler, `demo_${Date.now()}`);
      return;
    }

    setLiking(true);
    try {
      // 1. Save the like
      const { error: likeError } = await supabase
        .from("likes")
        .upsert(
          { user_id: user!.id, liked_user_id: currentTraveler.id },
          { onConflict: "user_id,liked_user_id" }
        );

      if (likeError) {
        console.error("Like insert error:", likeError);
        advance();
        return;
      }

      // 2. Check if a mutual match was auto-created by the DB trigger.
      //    The trigger stores (least(A,B), greatest(A,B)), so compute the same ordering.
      const myId = user!.id;
      const theirId = currentTraveler.id;
      const minId = myId < theirId ? myId : theirId;
      const maxId = myId < theirId ? theirId : myId;

      const { data: matchRow, error: matchError } = await supabase
        .from("matches")
        .select("id")
        .eq("user1_id", minId)
        .eq("user2_id", maxId)
        .maybeSingle();

      if (matchError) {
        console.error("Match query error:", matchError);
        advance();
        return;
      }

      if (matchRow?.id) {
        // Mutual match found — start the animation → modal sequence
        startMatch(currentTraveler, matchRow.id);
      } else {
        // No match yet — just advance to the next traveler
        advance();
      }
    } catch (err) {
      console.error("handleLike unexpected error:", err);
      advance();
    } finally {
      setLiking(false);
    }
  };

  const handlePass = () => {
    if (matchPhase !== "idle") return;
    advance();
  };

  // ── Build map markers ─────────────────────────────────────────────
  const mapMarkers = useMemo<MapMarker[]>(() => {
    const markers: MapMarker[] = [];

    if (currentTraveler) {
      const coords = geocodeLocation(currentTraveler.location);
      if (coords) {
        markers.push({
          id: `user_${currentTraveler.id}`,
          lat: coords[0],
          lng: coords[1],
          type: "user",
          label: currentTraveler.fullName,
          sublabel: currentTraveler.location,
          photo: currentTraveler.profilePhoto || undefined,
          // Don't set active during match animation — fitBounds handles the view
          active: !matchAnimation,
        });
      }
    }

    // During match animation, also pin the logged-in user's location
    if (matchAnimation && user?.location) {
      const myCoords = geocodeLocation(user.location);
      if (myCoords) {
        markers.push({
          id: `me_${user.id}`,
          lat: myCoords[0],
          lng: myCoords[1],
          type: "user",
          label: `${user.fullName} (You)`,
          sublabel: user.location,
          photo: user.profilePhoto || undefined,
          active: false,
        });
      }
    }

    return markers;
  }, [currentTraveler, matchAnimation, user]);

  // ── Build match line (only during animation) ──────────────────────
  const matchLine = useMemo(() => {
    if (!matchAnimation || !currentTraveler || !user?.location) return undefined;
    const theirCoords = geocodeLocation(currentTraveler.location);
    const myCoords = geocodeLocation(user.location);
    if (!theirCoords || !myCoords) return undefined;
    return {
      fromLat: myCoords[0],
      fromLng: myCoords[1],
      toLat: theirCoords[0],
      toLng: theirCoords[1],
    };
  }, [matchAnimation, currentTraveler, user]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <AppShell>
      {/* Match Modal — rendered above everything, always visible when showModal is true */}
      {showModal && pendingMatch && (
        <MatchModal
          traveler={pendingMatch.traveler}
          myPhoto={user?.profilePhoto ?? ""}
          onClose={dismissMatch}
          onChat={goToChat}
        />
      )}

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* ── Left: Card deck ───────────────────────────────── */}
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

          {/* Mobile map */}
          {showMapMobile && (
            <div className="lg:hidden h-56 mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow">
              <TravelMap markers={mapMarkers} matchLine={matchLine} />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!loading && !currentTraveler && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🌏</div>
              <h3 className="font-semibold text-slate-700 mb-1">
                {activeFilter
                  ? `No travelers with "${activeFilter}" interest yet`
                  : "No travelers found yet"}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {activeFilter
                  ? "Try a different filter or check back later."
                  : "Be the first to invite friends to TCUnnect!"}
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
              {/* Traveler card */}
              <div className={`bg-white rounded-3xl shadow-xl overflow-hidden border transition-all duration-300 ${
                matchAnimation ? "border-rose-300 shadow-rose-100/80" : "border-slate-100 shadow-slate-200/60"
              }`}>
                <div className="relative h-80">
                  {currentTraveler.profilePhoto ? (
                    <img
                      src={currentTraveler.profilePhoto}
                      alt={currentTraveler.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-100 to-slate-200 flex items-center justify-center">
                      <span className="text-6xl">👤</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />

                  {currentTraveler.isVerified && (
                    <span className="absolute top-3 right-3 bg-sky-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                  {currentTraveler.isPremium && (
                    <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      👑 Premium
                    </span>
                  )}

                  {/* Match animation overlay on card */}
                  {matchAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="bg-rose-500 text-white font-bold text-xl px-8 py-4 rounded-2xl shadow-xl animate-bounce">
                        ❤️ It's a Match!
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-xl font-bold">
                      {currentTraveler.fullName}
                      {currentTraveler.age ? `, ${currentTraveler.age}` : ""}
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
                  disabled={liking || matchPhase !== "idle"}
                  className="h-14 w-14 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <X className="h-6 w-6" />
                </button>
                <button
                  onClick={handleLike}
                  disabled={liking || matchPhase !== "idle"}
                  className="h-14 w-14 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full shadow-lg shadow-rose-200 flex items-center justify-center text-white transition-all hover:scale-110"
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

              {/* Progress bar */}
              <div className="mt-4 bg-slate-100 rounded-full h-1">
                <div
                  className="bg-sky-500 h-1 rounded-full transition-all"
                  style={{ width: `${((index + 1) / Math.max(deck.length, 1)) * 100}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-400 mt-1.5">
                {index + 1} of {deck.length} profiles
              </p>
            </>
          )}
        </div>

        {/* ── Right: Map ────────────────────────────────────── */}
        <div className="hidden lg:block flex-1 p-4">
          <div className="h-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50">
            <TravelMap markers={mapMarkers} matchLine={matchLine} />
          </div>
          <div className="flex items-center gap-4 mt-2 px-1">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500 inline-block" />
              {currentTraveler ? (
                <>Location: <span className="font-semibold text-slate-600 ml-1">{currentTraveler.location}</span></>
              ) : (
                "Philippines"
              )}
            </p>
            <p className="text-xs text-slate-400 ml-auto">Satellite · Philippines</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
