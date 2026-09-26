import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore, useMatchStore, useChatStore } from "../stores";
import { Bookmark, MapPin, Star, Loader2, Trash2, ChevronRight, Compass, Send, X, MessageCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const CATEGORIES = ["All", "Beach", "Mountain", "Nature", "Heritage", "Cafe", "Waterfalls", "City", "Food"];

const CATEGORY_EMOJIS: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Heritage: "🏛",
  Cafe: "☕", Waterfalls: "💦", City: "🌆", Food: "🍜",
};

interface SavedGem {
  id: string;           // saved_places.id
  gem_id: string;
  gem_name: string;
  gem_location: string;
  gem_category: string;
  gem_images: string[];
  gem_rating: number;
  created_at: string;
}

// ── Share to Chat Modal ────────────────────────────────────────────────────
interface ShareModalProps {
  gem: SavedGem;
  onClose: () => void;
}

function ShareToChatModal({ gem, onClose }: ShareModalProps) {
  const { user } = useAuthStore();
  const { matches } = useMatchStore();
  const { sendMessage } = useChatStore();
  const navigate = useNavigate();
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function handleShare(matchId: string, partnerId: string) {
    if (!user) return;
    setSending(matchId);
    try {
      await sendMessage({
        matchId,
        senderId: user.id,
        receiverId: partnerId,
        content: `📍 ${gem.gem_name} — ${gem.gem_location}`,
        messageType: "gem_card",
        metadata: {
          gemId: gem.gem_id,
          name: gem.gem_name,
          location: gem.gem_location,
          category: gem.gem_category,
          image: gem.gem_images?.[0] ?? null,
        },
      });
      setSent(matchId);
    } catch {
      // silent fail — still mark sent so user sees feedback
      setSent(matchId);
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Share to Chat</h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">📍 {gem.gem_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Match list */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
          {matches.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">No matches yet — connect with someone first!</p>
              <button
                onClick={() => { onClose(); navigate("/discover"); }}
                className="text-sm font-semibold text-sky-600 hover:underline"
              >
                Discover people
              </button>
            </div>
          ) : (
            matches.map((match) => {
              const partner = match.user;
              const alreadySent = sent === match.id;
              const isSending = sending === match.id;
              return (
                <div key={match.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                    {partner.profilePhoto ? (
                      <img src={partner.profilePhoto} alt={partner.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-400">
                        {partner.fullName[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{partner.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{partner.location || "Traveler"}</p>
                  </div>
                  <button
                    onClick={() => !alreadySent && handleShare(match.id, partner.id)}
                    disabled={isSending || alreadySent}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      alreadySent
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-sky-600 hover:bg-sky-700 text-white"
                    }`}
                  >
                    {isSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : alreadySent ? (
                      "✓ Sent"
                    ) : (
                      <><Send className="h-3.5 w-3.5" /> Send</>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {sent && (
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => { onClose(); navigate("/chat"); }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-sm transition"
            >
              Go to Messages
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function SavedPlaces() {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState<SavedGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sharingGem, setSharingGem] = useState<SavedGem | null>(null);

  useEffect(() => {
    fetchSaved();
  }, [user?.id]);

  async function fetchSaved() {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("saved_places")
      .select(`
        id,
        gem_id,
        created_at,
        hidden_gems (
          name,
          location,
          category,
          images,
          rating
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const mapped: SavedGem[] = data
        .filter((row: any) => row.hidden_gems)
        .map((row: any) => ({
          id: row.id,
          gem_id: row.gem_id,
          gem_name: row.hidden_gems.name ?? "Hidden Gem",
          gem_location: row.hidden_gems.location ?? "",
          gem_category: row.hidden_gems.category ?? "",
          gem_images: row.hidden_gems.images ?? [],
          gem_rating: row.hidden_gems.rating ?? 0,
          created_at: row.created_at,
        }));
      setSaved(mapped);
    }
    setLoading(false);
  }

  async function handleRemove(savedId: string) {
    setRemoving(savedId);
    if (isSupabaseConfigured) {
      await supabase.from("saved_places").delete().eq("id", savedId);
    }
    setSaved(prev => prev.filter(s => s.id !== savedId));
    setRemoving(null);
  }

  const filtered = activeCategory === "All"
    ? saved
    : saved.filter(s => s.gem_category === activeCategory);

  return (
    <AppShell>
      {/* Share to Chat Modal */}
      {sharingGem && (
        <ShareToChatModal gem={sharingGem} onClose={() => setSharingGem(null)} />
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Bookmark className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Saved Places</h1>
            <p className="text-sm text-slate-500">Your personal list of hidden gems</p>
          </div>
        </div>

        {/* Category filter chips */}
        {!loading && saved.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  activeCategory === cat
                    ? "bg-sky-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-sky-300"
                }`}
              >
                {cat === "All" ? "All" : `${CATEGORY_EMOJIS[cat] ?? ""} ${cat}`}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 text-sky-500 animate-spin" />
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">No saved places yet</h2>
            <p className="text-slate-500 text-sm mb-6">
              Tap the bookmark icon on any hidden gem to save it here.
            </p>
            <Link
              to="/hidden-gems"
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
            >
              <Compass className="h-4 w-4" /> Explore Hidden Gems
            </Link>
          </div>
        ) : filtered.length === 0 && activeCategory !== "All" ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">{CATEGORY_EMOJIS[activeCategory] ?? "📍"}</div>
            <p className="text-slate-500 text-sm">No saved {activeCategory} places yet.</p>
            <button onClick={() => setActiveCategory("All")} className="mt-3 text-sky-600 text-sm font-medium hover:underline">
              Show all saved places
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium mb-4">
              {filtered.length} place{filtered.length !== 1 ? "s" : ""}{activeCategory !== "All" ? ` in ${activeCategory}` : " saved"}
            </p>
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex gap-0"
              >
                {/* Image */}
                <div className="w-28 h-28 flex-shrink-0 bg-slate-100 relative overflow-hidden">
                  {item.gem_images?.[0] ? (
                    <img
                      src={item.gem_images[0]}
                      alt={item.gem_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {CATEGORY_EMOJIS[item.gem_category] ?? "📍"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{item.gem_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-rose-400 flex-shrink-0" />
                        <span className="truncate">{item.gem_location}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {CATEGORY_EMOJIS[item.gem_category] ?? "📍"} {item.gem_category}
                        </span>
                        {item.gem_rating > 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-current" /> {item.gem_rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removing === item.id}
                      className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition"
                      title="Remove from saved"
                    >
                      {removing === item.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Link
                      to={`/gems/${item.gem_id}`}
                      className="flex-1 text-center text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      View <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => setSharingGem(item)}
                      className="flex-1 text-center text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                      title="Share this gem in a chat"
                    >
                      <Send className="h-3 w-3" /> Share
                    </button>
                    <Link
                      to={`/booking/${item.gem_id}`}
                      className="flex-1 text-center text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-lg transition"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
