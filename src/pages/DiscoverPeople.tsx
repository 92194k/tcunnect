import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore, useMatchStore } from "../stores";
import { MapPin, X, Heart, Sparkles } from "lucide-react";
import type { Match, User } from "../types";

const TRAVELERS: (User & { liked?: boolean })[] = [
  { id: "u1", email: "", fullName: "Maria", age: 21, bio: "Always looking for new places to explore 🌿", location: "Quezon City", profilePhoto: "https://images.unsplash.com/photo-1675705444858-97005ce93298?auto=format&fit=crop&w=400&q=80", travelInterests: ["Beach", "Food", "Nature"], createdAt: "", isPremium: false, isVerified: true },
  { id: "u2", email: "", fullName: "Sam", age: 24, bio: "Hiking lover & island hopper 🏔", location: "Cebu City", profilePhoto: "https://images.unsplash.com/photo-1605741455532-384a402cf959?auto=format&fit=crop&w=400&q=80", travelInterests: ["Mountain", "Waterfalls", "Nature"], createdAt: "", isPremium: false, isVerified: false },
  { id: "u3", email: "", fullName: "Ana", age: 23, bio: "History nerd & food traveler 🍜", location: "Davao City", profilePhoto: "https://images.unsplash.com/photo-1650666908250-b0dcbf54e08b?auto=format&fit=crop&w=400&q=80", travelInterests: ["Heritage", "Food", "City"], createdAt: "", isPremium: true, isVerified: true },
  { id: "u4", email: "", fullName: "Jake", age: 26, bio: "Adventure seeker & cliff diver 🌊", location: "Makati", profilePhoto: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=400&q=80", travelInterests: ["Beach", "Mountain", "Nature"], createdAt: "", isPremium: false, isVerified: false },
];

const INTEREST_EMOJI: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Food: "🍜",
  Heritage: "🏛", Cafe: "☕", Waterfalls: "💦", City: "🌆",
};

function MatchModal({ match, onClose, onChat }: { match: User; onClose: () => void; onChat: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-4xl mb-4">✨</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">It's a Match!</h2>
        <p className="text-slate-500 text-sm mb-6">You and {match.fullName} both liked each other</p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img src="https://images.unsplash.com/photo-1675705444858-97005ce93298?auto=format&fit=crop&w=200&q=80" alt="You" className="h-full w-full object-cover" />
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
                {INTEREST_EMOJI[i]} {i}
              </span>
            ))}
          </div>
        </div>

        <button onClick={onChat}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition mb-3">
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

  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  const currentTraveler = TRAVELERS[index];
  const done = index >= TRAVELERS.length;

  const handlePass = () => setIndex((i) => i + 1);

  const handleLike = () => {
    if (!currentTraveler) return;
    const newLiked = new Set(liked);
    newLiked.add(currentTraveler.id);
    setLiked(newLiked);

    // Simulate match on first like for demo
    if (index === 0) {
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
      setIndex((i) => i + 1);
    }
  };

  return (
    <AppShell>
      {matchedUser && (
        <MatchModal
          match={matchedUser}
          onClose={() => { setMatchedUser(null); setIndex((i) => i + 1); }}
          onChat={() => { setMatchedUser(null); navigate("/chat"); }}
        />
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Find Your Travel People</h1>
          <p className="text-slate-500 text-sm mt-1">Meet Filipinos who share your interests</p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {Object.entries(INTEREST_EMOJI).map(([label, emoji]) => (
            <button key={label}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-sky-400 hover:text-sky-700 transition">
              {emoji} {label}
            </button>
          ))}
        </div>

        {done ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">You've seen everyone!</h2>
            <p className="text-slate-500 text-sm">Check back later for new travelers</p>
          </div>
        ) : (
          <div className="relative">
            {/* Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
              <div className="relative h-96">
                <img
                  src={currentTraveler.profilePhoto}
                  alt={currentTraveler.fullName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                {currentTraveler.isVerified && (
                  <span className="absolute top-4 right-4 bg-sky-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    ✓ Verified
                  </span>
                )}
                {currentTraveler.isPremium && (
                  <span className="absolute top-4 left-4 bg-amber-400 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    👑 Premium
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-2xl font-bold">{currentTraveler.fullName}, {currentTraveler.age}</h3>
                  <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
                    <MapPin className="h-3.5 w-3.5" /> {currentTraveler.location}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <p className="text-slate-600 text-sm mb-4 italic">"{currentTraveler.bio}"</p>
                <div className="flex flex-wrap gap-2">
                  {currentTraveler.travelInterests.map((i) => (
                    <span key={i} className="bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1 rounded-full">
                      {INTEREST_EMOJI[i]} {i}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <button onClick={handlePass}
                className="h-16 w-16 bg-white rounded-full shadow-lg shadow-slate-200 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:shadow-rose-100 transition-all hover:scale-110">
                <X className="h-7 w-7" />
              </button>
              <button onClick={handleLike}
                className="h-16 w-16 bg-rose-500 hover:bg-rose-600 rounded-full shadow-lg shadow-rose-200 flex items-center justify-center text-white transition-all hover:scale-110">
                <Heart className="h-7 w-7 fill-current" />
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" /> Likes are anonymous · You only match when it's mutual
            </p>

            {/* Progress */}
            <div className="mt-6 bg-slate-200 rounded-full h-1">
              <div
                className="bg-sky-500 h-1 rounded-full transition-all"
                style={{ width: `${(index / TRAVELERS.length) * 100}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">{index + 1} of {TRAVELERS.length} profiles</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
