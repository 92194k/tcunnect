import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useMatchStore, useChatStore, useAuthStore } from "../stores";
import {
  Send, ArrowLeft, MapPin, Smile, Map, MoreVertical, X,
  Flag, ShieldOff, Loader2, ChevronRight, Bookmark, Calendar,
  Star, Check, ImagePlus,
} from "lucide-react";
import type { Message } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const EMOJIS = [
  "😀","😂","🥰","😍","😎","🤩","😢","😭","😡","🤔",
  "🤣","😅","🥹","🤗","😬","🫶","🫡","😴","🥲","😇",
  "👍","👎","❤️","🔥","✨","🎉","💯","👏","🙌","🤝",
  "✈️","🏖","🌿","🗺️","🏔","🌊","🌅","🏞","🌴","🏝",
  "🍜","🍺","🥂","🍕","🍣","🥘","🍦","☕","🧋","🍻",
  "📍","💬","💌","📸","🎶","🎵","💪","🎒","🧳","🌺",
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 w-64"
    >
      <div className="grid grid-cols-10 gap-0.5">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => { onSelect(e); onClose(); }}
            className="h-7 w-7 flex items-center justify-center text-base hover:bg-sky-50 rounded transition"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Rich Message Card ────────────────────────────────────────────────────────
function RichMessageCard({ msg, onBookTrip }: { msg: Message; onBookTrip?: (gemId: string) => void }) {
  const meta = msg.metadata ?? {};
  if (msg.messageType === "gem_card") {
    return (
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-[240px]">
        {!!meta.image && (
          <img src={meta.image as string} alt="" className="w-full h-28 object-cover" />
        )}
        <div className="p-3">
          <p className="font-semibold text-slate-900 text-sm">{meta.name as string}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 text-rose-400" /> {meta.location as string}
          </p>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] bg-sky-50 text-sky-700 font-semibold px-2 py-0.5 rounded-full">
              {meta.category as string}
            </span>
            {!!meta.budgetLevel && (
              <span className="text-[10px] text-slate-500">{meta.budgetLevel as string}</span>
            )}
          </div>
          <div className="flex gap-1.5">
            <Link
              to={`/gems/${meta.gemId}`}
              className="flex-1 text-center text-[10px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-1.5 rounded-lg transition"
            >
              View Gem
            </Link>
            <button
              onClick={() => onBookTrip?.(meta.gemId as string)}
              className="flex-1 text-[10px] font-semibold text-white bg-sky-600 hover:bg-sky-700 px-2 py-1.5 rounded-lg transition"
            >
              Book a Trip
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (msg.messageType === "booking_card") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 max-w-[220px]">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-sky-500" />
          <p className="text-xs font-semibold text-slate-900">Booking Shared</p>
        </div>
        <p className="font-medium text-slate-900 text-sm">{meta.gemName as string}</p>
        <p className="text-xs text-slate-500 mt-0.5">{meta.date as string} · {meta.guests as number} {(meta.guests as number) === 1 ? "person" : "people"}</p>
        <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          meta.status === "confirmed" ? "bg-emerald-50 text-emerald-700" :
          meta.status === "pending" ? "bg-amber-50 text-amber-700" :
          "bg-slate-50 text-slate-600"
        }`}>{(meta.status as string) ?? "pending"}</span>
        <Link
          to="/my-bookings"
          className="mt-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-1.5 rounded-lg transition w-full"
        >
          View Booking <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }
  if (msg.messageType === "image") {
    return (
      <img
        src={msg.content}
        alt="Shared photo"
        className="rounded-2xl max-w-[240px] max-h-64 object-cover shadow-sm border border-slate-100 cursor-pointer"
        onClick={() => window.open(msg.content, "_blank")}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return <p className="text-sm">{msg.content}</p>;
}

// ─── Report User Modal ────────────────────────────────────────────────────────
const REPORT_REASONS = [
  "Harassment or bullying",
  "Inappropriate content",
  "Spam or scam",
  "Fake profile",
  "Threatening behaviour",
  "Other",
];

function ReportUserModal({
  reportedUserId, reporterUserId, matchId, onClose,
}: {
  reportedUserId: string; reporterUserId: string; matchId: string; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    if (isSupabaseConfigured) {
      await supabase.from("reports").insert({
        reporter_id: reporterUserId,
        reported_user_id: reportedUserId,
        reported_item_type: "user",
        reported_item_id: reportedUserId,
        match_id: matchId,
        reason,
        details: details.trim() || null,
        status: "pending",
      });
    }
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Flag className="h-4 w-4 text-rose-500" /> Report User
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        {done ? (
          <div className="p-6 text-center">
            <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">Report Submitted</p>
            <p className="text-xs text-slate-500 mb-4">Our team will review this report. Thank you for keeping TCUnnect safe.</p>
            <button onClick={onClose} className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm">Done</button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Reason *</label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <button key={r} onClick={() => setReason(r)}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition ${
                      reason === r ? "border-rose-400 bg-rose-50 text-rose-700 font-medium" : "border-slate-200 text-slate-600 hover:border-rose-200"
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Additional details (optional)</label>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Tell us more about what happened..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={!reason || submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5">
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Report Message Modal ─────────────────────────────────────────────────────
function ReportMessageModal({
  msg, reporterUserId, reportedUserId, matchId, onClose,
}: {
  msg: Message; reporterUserId: string; reportedUserId: string; matchId: string; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    if (isSupabaseConfigured) {
      await supabase.from("reports").insert({
        reporter_id: reporterUserId,
        reported_user_id: reportedUserId,
        reported_item_type: "message",
        reported_item_id: msg.id,
        match_id: matchId,
        message_content: msg.content.slice(0, 500),
        reason,
        status: "pending",
      });
    }
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Flag className="h-4 w-4 text-rose-500" /> Report Message
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        {done ? (
          <div className="p-6 text-center">
            <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">Message Reported</p>
            <p className="text-xs text-slate-500 mb-4">Our moderation team will review this message.</p>
            <button onClick={onClose} className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm">Done</button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-100 line-clamp-2">
              "{msg.content}"
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Why are you reporting this?</label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <button key={r} onClick={() => setReason(r)}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition ${
                      reason === r ? "border-rose-400 bg-rose-50 text-rose-700 font-medium" : "border-slate-200 text-slate-600 hover:border-rose-200"
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={!reason || submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5">
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trip Share Panel ─────────────────────────────────────────────────────────
interface SavedGemOption {
  id: string;
  gemId: string;
  name: string;
  location: string;
  category: string;
  image?: string;
  budgetLevel?: string;
}

function TripSharePanel({
  userId, onSelectGem, onClose,
}: {
  userId: string; onSelectGem: (gem: SavedGemOption) => void; onClose: () => void;
}) {
  const [gems, setGems] = useState<SavedGemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"saved" | "all">("saved");
  const [allGems, setAllGems] = useState<SavedGemOption[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const fetchSaved = supabase
      .from("saved_places")
      .select("id, gem_id, hidden_gems(name, location, category, images, budget_level)")
      .eq("user_id", userId)
      .limit(20);
    const fetchAll = supabase
      .from("hidden_gems")
      .select("id, name, location, category, images, budget_level")
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .limit(30);

    Promise.all([fetchSaved, fetchAll]).then(([s, a]) => {
      if (s.data) {
        setGems(s.data
          .filter((r: any) => r.hidden_gems)
          .map((r: any) => ({
            id: r.id,
            gemId: r.gem_id,
            name: r.hidden_gems.name,
            location: r.hidden_gems.location,
            category: r.hidden_gems.category,
            image: r.hidden_gems.images?.[0],
            budgetLevel: r.hidden_gems.budget_level,
          })));
      }
      if (a.data) {
        setAllGems((a.data as any[]).map((g) => ({
          id: g.id,
          gemId: g.id,
          name: g.name,
          location: g.location,
          category: g.category,
          image: g.images?.[0],
          budgetLevel: g.budget_level,
        })));
      }
      setLoading(false);
    });
  }, [userId]);

  const list = tab === "saved" ? gems : allGems;

  return (
    <div className="bg-white border-t border-slate-100 shadow-lg">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700">🗺️ Share a Place</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex gap-2 px-4 mb-2">
        <button onClick={() => setTab("saved")}
          className={`text-xs px-3 py-1 rounded-full font-medium transition ${tab === "saved" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          <Bookmark className="h-3 w-3 inline mr-1" />Saved Places
        </button>
        <button onClick={() => setTab("all")}
          className={`text-xs px-3 py-1 rounded-full font-medium transition ${tab === "all" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          <Map className="h-3 w-3 inline mr-1" />All Gems
        </button>
      </div>
      <div className="px-4 pb-3 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 text-sky-500 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-slate-500">
              {tab === "saved" ? "No saved places yet." : "No gems available."}
            </p>
            {tab === "saved" && (
              <Link to="/hidden-gems" onClick={onClose} className="text-xs text-sky-600 font-medium hover:underline">
                Explore Hidden Gems →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex gap-2 pb-1">
            {list.map((gem) => (
              <button key={gem.id} onClick={() => onSelectGem(gem)}
                className="shrink-0 w-36 rounded-xl border border-slate-200 overflow-hidden hover:border-sky-400 hover:shadow-sm transition text-left">
                <div className="h-20 bg-slate-100 relative">
                  {gem.image ? (
                    <img src={gem.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📍</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-semibold text-slate-900 line-clamp-1">{gem.name}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" /> <span className="truncate">{gem.location}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Photo Upgrade Prompt ─────────────────────────────────────────────────────
function PhotoUpgradeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-sky-500 to-violet-600 p-6 text-center">
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ImagePlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-white font-bold text-lg">Photo Sharing</h2>
          <p className="text-white/80 text-sm mt-1">TCUnnect Plus feature</p>
        </div>
        <div className="p-5">
          <p className="text-slate-700 text-sm text-center mb-4">
            Share travel photos directly in your conversations.
            Upgrade to <span className="font-bold text-sky-600">TCUnnect Plus</span> to unlock photo messaging.
          </p>
          <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-center mb-4">
            <p className="text-2xl font-bold text-sky-700">₱30</p>
            <p className="text-xs text-sky-600 font-medium">Lifetime · Founding Explorer</p>
          </div>
          <button
            onClick={() => { onClose(); navigate("/plans"); }}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-sm transition mb-2"
          >
            Upgrade to Plus
          </button>
          <button onClick={onClose} className="w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Replies ────────────────────────────────────────────────────────────
const QUICK_REPLIES = ["Hey! 👋", "Sure, when are you free?", "I'd love to! 🏖", "Let me check my schedule", "Sounds great!"];

// ─── Chat List ────────────────────────────────────────────────────────────────
function ChatList({ onSelectMatch }: { onSelectMatch: (id: string) => void }) {
  const { matches } = useMatchStore();
  const { messages } = useChatStore();
  const { user } = useAuthStore();
  const [previews, setPreviews] = useState<Record<string, { lastMsg: string; unread: number; ts?: string }>>({});

  // Fetch last message + unread count from Supabase for real matches
  useEffect(() => {
    if (!isSupabaseConfigured || !user || matches.length === 0) return;
    const ids = matches.map((m) => m.id);
    supabase
      .from("messages")
      .select("match_id, content, message_type, created_at, read, receiver_id")
      .in("match_id", ids)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { lastMsg: string; unread: number; ts?: string }> = {};
        for (const row of data) {
          const mid = row.match_id as string;
          if (!map[mid]) {
            const isCard = row.message_type !== "text";
            map[mid] = {
              lastMsg: isCard ? "📍 Shared a place" : (row.content as string),
              unread: 0,
              ts: row.created_at as string,
            };
          }
          if (!row.read && row.receiver_id === user.id) {
            map[mid].unread = (map[mid].unread ?? 0) + 1;
          }
        }
        setPreviews(map);
      });
  }, [matches.length, user?.id]);

  const allMatches = matches.map((m) => ({
    id: m.id,
    user: m.user,
    lastMsg:
      previews[m.id]?.lastMsg ??
      (messages[m.id] ?? [])[0]?.content ??
      "Start a conversation!",
  }));

  const formatTs = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 text-sm mt-1">Chat with your travel matches</p>
      </div>

      {allMatches.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">💬</div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">No matches yet</h2>
          <p className="text-slate-500 text-sm">Like someone on Discover People to start chatting</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allMatches.map((m) => {
            const unread = previews[m.id]?.unread ?? 0;
            const ts = previews[m.id]?.ts;
            return (
              <button key={m.id} onClick={() => onSelectMatch(m.id)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition text-left">
                <div className="relative shrink-0">
                  <img src={m.user.profilePhoto} alt={m.user.fullName}
                    className="h-14 w-14 rounded-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{m.user.fullName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-0.5">
                    <MapPin className="h-3 w-3" /> {m.user.location}
                  </p>
                  <p className={`text-sm truncate ${unread > 0 ? "font-medium text-slate-800" : "text-slate-500"}`}>
                    {m.lastMsg}
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  {ts && <p className="text-[10px] text-slate-400">{formatTs(ts)}</p>}
                  {unread > 0 && (
                    <span className="h-5 min-w-5 px-1 bg-sky-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Chat Thread ──────────────────────────────────────────────────────────────
function ChatThread({ matchId, onBack }: { matchId: string; onBack: () => void }) {
  const { user } = useAuthStore();
  const { matches } = useMatchStore();
  const { messages, loadingMessages, addMessage, loadMessages, sendMessage: storeSend, markConversationRead } = useChatStore();
  // addMessage is still used by the Realtime handler below
  const navigate = useNavigate();
  const location = useLocation();

  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTripPanel, setShowTripPanel] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showReportUser, setShowReportUser] = useState(false);
  const [reportMsg, setReportMsg] = useState<Message | null>(null);
  const [blockConfirm, setBlockConfirm] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoUpgrade, setShowPhotoUpgrade] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const systemMessage = (location.state as { systemMessage?: string } | null)?.systemMessage ?? null;

  const match = matches.find((m) => m.id === matchId);
  const partner = match?.user;

  const threadMsgs = messages[matchId] ?? [];
  const loadingThread = loadingMessages[matchId] ?? false;

  // Load messages from Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      loadMessages(matchId);
    }
  }, [matchId]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    markConversationRead(matchId, user.id);
  }, [matchId, user?.id]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    const channel = supabase
      .channel(`messages_${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          // Only add incoming messages (we already add our own optimistically)
          if (row.sender_id !== user.id) {
            const msg: Message = {
              id: row.id as string,
              matchId: row.match_id as string,
              senderId: row.sender_id as string,
              receiverId: row.receiver_id as string,
              content: row.content as string,
              messageType: (row.message_type as Message["messageType"]) ?? "text",
              metadata: (row.metadata as Record<string, unknown>) ?? undefined,
              timestamp: row.created_at as string,
              read: false,
            };
            addMessage(matchId, msg);
            // Auto-mark as read since we're viewing this conversation
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMsgs.length]);

  // Focus input for new matches
  useEffect(() => {
    if (systemMessage) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [systemMessage]);

  const handleSend = useCallback(async (content?: string, msgType?: string, meta?: Record<string, unknown>) => {
    const text = content ?? input.trim();
    if (!text || !user || !partner) return;
    setSending(true);

    await storeSend({
      matchId,
      senderId: user.id,
      receiverId: partner.id,
      content: text,
      messageType: msgType,
      metadata: meta,
    });

    if (!content) setInput(""); // only clear when sending from input
    setSending(false);
  }, [input, user, partner, matchId, storeSend]);

  const handleShareGem = (gem: SavedGemOption) => {
    setShowTripPanel(false);
    const label = `📍 ${gem.name} — ${gem.location}`;
    handleSend(label, "gem_card", {
      gemId: gem.gemId,
      name: gem.name,
      location: gem.location,
      category: gem.category,
      image: gem.image,
      budgetLevel: gem.budgetLevel,
    });
  };

  const handlePhotoClick = () => {
    if (!user?.isPremium) {
      setShowPhotoUpgrade(true);
    } else {
      photoInputRef.current?.click();
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !partner || !isSupabaseConfigured) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `chat/${matchId}/${user.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from("chat-images")
        .getPublicUrl(path);

      await storeSend({
        matchId,
        senderId: user.id,
        receiverId: partner.id,
        content: publicUrl,
        messageType: "image",
      });
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleBlock = async () => {
    if (!user || !partner || !isSupabaseConfigured) { setBlocked(true); return; }
    await supabase.from("blocks").insert({
      blocker_id: user.id,
      blocked_id: partner.id,
    });
    setBlocked(true);
    setBlockConfirm(false);
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

  if (blocked) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto items-center justify-center gap-4 px-4">
        <div className="text-5xl">🚫</div>
        <h3 className="font-bold text-slate-900">User Blocked</h3>
        <p className="text-sm text-slate-500 text-center">You have blocked this user. You will no longer see or receive messages from them.</p>
        <button onClick={onBack} className="mt-2 bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto relative">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {partner && (
          <>
            <img src={partner.profilePhoto} alt={partner.fullName}
              className="h-9 w-9 rounded-full object-cover cursor-pointer"
              onClick={() => navigate(`/profile/${partner.id}`)} />
            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${partner.id}`)}>
              <p className="font-semibold text-slate-900 text-sm">{partner.fullName}</p>
              <p className="text-xs text-emerald-500 font-medium">Online</p>
            </div>
          </>
        )}
        <div className="flex items-center gap-1 relative">
          <button onClick={() => { setShowTripPanel(!showTripPanel); setShowHeaderMenu(false); }}
            className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition" title="Share a place">
            <Map className="h-5 w-5" />
          </button>
          <button onClick={() => { setShowHeaderMenu(!showHeaderMenu); setShowTripPanel(false); }}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
            <MoreVertical className="h-5 w-5" />
          </button>

          {/* Header dropdown */}
          {showHeaderMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 w-44">
              <button
                onClick={() => { setShowReportUser(true); setShowHeaderMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <Flag className="h-4 w-4 text-rose-400" /> Report User
              </button>
              <button
                onClick={() => { setBlockConfirm(true); setShowHeaderMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
              >
                <ShieldOff className="h-4 w-4" /> Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trip Share Panel */}
      {showTripPanel && user && (
        <TripSharePanel
          userId={user.id}
          onSelectGem={handleShareGem}
          onClose={() => setShowTripPanel(false)}
        />
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50"
        onClick={() => { setShowHeaderMenu(false); setShowEmoji(false); }}
      >
        {systemMessage && (
          <div className="flex justify-center my-2">
            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-xs px-4 py-2 rounded-full font-medium shadow-sm">
              {systemMessage}
            </span>
          </div>
        )}

        {loadingThread && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-sky-400 animate-spin" />
          </div>
        )}

        {threadMsgs.map((msg) => {
          const isMe = user ? msg.senderId === user.id : msg.senderId !== partner?.id;
          const isCard = msg.messageType && msg.messageType !== "text" && msg.messageType !== undefined;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
              {!isMe && partner && (
                <img src={partner.profilePhoto} alt=""
                  className="h-7 w-7 rounded-full object-cover mr-2 self-end" />
              )}
              <div className="max-w-[80%]">
                {isCard ? (
                  <div className={`${isMe ? "ml-auto" : ""}`}>
                    <RichMessageCard msg={msg} onBookTrip={(gemId) => navigate(`/booking/${gemId}`)} />
                    <p className={`text-[10px] mt-1 ${isMe ? "text-right text-slate-400" : "text-slate-400"}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? "bg-sky-600 text-white rounded-br-sm" : "bg-white text-slate-800 shadow-sm rounded-bl-sm"
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-sky-200" : "text-slate-400"}`}>
                        {formatTime(msg.timestamp)}
                        {isMe && msg.read && <span className="ml-1 text-sky-200">✓✓</span>}
                      </p>
                    </div>
                    {/* Report message button — appears on hover for partner messages */}
                    {!isMe && user && partner && (
                      <button
                        onClick={() => setReportMsg(msg)}
                        className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition p-1 text-slate-300 hover:text-rose-400"
                        title="Report message"
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {threadMsgs.length === 0 && !loadingThread && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">👋</div>
            <p className="text-sm text-slate-500">Say hello to {partner?.fullName ?? "your match"}!</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 pt-2 pb-1 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_REPLIES.map((qr) => (
          <button key={qr} onClick={() => setInput(qr)}
            className="shrink-0 text-xs bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-full hover:bg-sky-600 hover:text-white transition">
            {qr}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-2 relative">
        {/* Hidden file input for photo upload */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        <button
          onClick={() => { setShowEmoji(!showEmoji); setShowTripPanel(false); }}
          className={`p-2 transition rounded-lg ${showEmoji ? "text-sky-600 bg-sky-50" : "text-slate-400 hover:text-sky-500"}`}
        >
          <Smile className="h-5 w-5" />
        </button>
        {showEmoji && (
          <EmojiPicker
            onSelect={(e) => setInput((prev) => prev + e)}
            onClose={() => setShowEmoji(false)}
          />
        )}

        {/* Photo button */}
        <button
          onClick={handlePhotoClick}
          disabled={uploadingPhoto}
          title={user?.isPremium ? "Send a photo" : "Photo sharing — Plus only"}
          className={`p-2 transition rounded-lg relative ${
            user?.isPremium
              ? "text-slate-400 hover:text-sky-500"
              : "text-slate-300 hover:text-slate-400"
          }`}
        >
          {uploadingPhoto
            ? <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
            : <ImagePlus className="h-5 w-5" />
          }
          {!user?.isPremium && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-amber-400 rounded-full border-2 border-white" title="Plus only" />
          )}
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-full focus:ring-2 focus:ring-sky-500 outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending}
          className="h-9 w-9 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {/* Photo upgrade prompt */}
      {showPhotoUpgrade && (
        <PhotoUpgradeModal onClose={() => setShowPhotoUpgrade(false)} />
      )}

      {/* Block confirmation */}
      {blockConfirm && partner && user && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="h-14 w-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldOff className="h-7 w-7 text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-center mb-2">Block {partner.fullName}?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              You won't be able to send or receive messages from this person. This action can be reversed from your settings.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setBlockConfirm(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleBlock}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition">
                Block User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report user modal */}
      {showReportUser && user && partner && (
        <ReportUserModal
          reportedUserId={partner.id}
          reporterUserId={user.id}
          matchId={matchId}
          onClose={() => setShowReportUser(false)}
        />
      )}

      {/* Report message modal */}
      {reportMsg && user && partner && (
        <ReportMessageModal
          msg={reportMsg}
          reporterUserId={user.id}
          reportedUserId={partner.id}
          matchId={matchId}
          onClose={() => setReportMsg(null)}
        />
      )}
    </div>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
export default function Chat() {
  const { matchId } = useParams<{ matchId?: string }>();
  const navigate = useNavigate();
  const [activeMatch, setActiveMatch] = useState<string | null>(matchId ?? null);

  if (activeMatch) {
    return (
      <AppShell>
        <ChatThread
          matchId={activeMatch}
          onBack={() => { setActiveMatch(null); navigate("/chat"); }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ChatList onSelectMatch={setActiveMatch} />
    </AppShell>
  );
}
