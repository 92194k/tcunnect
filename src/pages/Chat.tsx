import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { Send, ArrowLeft, MapPin, Smile, Map, MessageCircle, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// ─── Types (local, lean) ────────────────────────────────────────
interface Partner {
  id: string;
  fullName: string;
  profilePhoto: string;
  location: string;
}

interface MatchRow {
  id: string;
  partner: Partner;
  lastMsg: string;
  lastTime: string | null;
  unread: number;
}

interface Msg {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

// ─── Chat List ──────────────────────────────────────────────────
function ChatList({ onSelectMatch }: { onSelectMatch: (id: string, partner: Partner) => void }) {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) { setLoading(false); return; }

    // Fetch matches where current user is user1 or user2, join profiles for the OTHER user
    Promise.all([
      supabase.from("matches")
        .select("id, user1_id, user2_id, created_at, user1:profiles!matches_user1_id_fkey(id, full_name, profile_photo, location), user2:profiles!matches_user2_id_fkey(id, full_name, profile_photo, location)")
        .eq("user1_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("matches")
        .select("id, user1_id, user2_id, created_at, user1:profiles!matches_user1_id_fkey(id, full_name, profile_photo, location), user2:profiles!matches_user2_id_fkey(id, full_name, profile_photo, location)")
        .eq("user2_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(async ([r1, r2]) => {
      const all = [...(r1.data ?? []), ...(r2.data ?? [])];
      if (all.length === 0) { setLoading(false); return; }

      // For each match, fetch the last message
      const rows: MatchRow[] = await Promise.all(all.map(async (m: any) => {
        const partner: Partner = m.user1_id === user.id
          ? { id: (m.user2 as any)?.id ?? "", fullName: (m.user2 as any)?.full_name ?? "User", profilePhoto: (m.user2 as any)?.profile_photo ?? "", location: (m.user2 as any)?.location ?? "" }
          : { id: (m.user1 as any)?.id ?? "", fullName: (m.user1 as any)?.full_name ?? "User", profilePhoto: (m.user1 as any)?.profile_photo ?? "", location: (m.user1 as any)?.location ?? "" };

        const { data: msgs } = await supabase.from("messages")
          .select("content, created_at, sender_id, read")
          .eq("match_id", m.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const last = msgs?.[0];
        const unreadCount = await supabase.from("messages")
          .select("*", { count: "exact", head: true })
          .eq("match_id", m.id)
          .eq("read", false)
          .neq("sender_id", user.id);

        return {
          id: m.id,
          partner,
          lastMsg: last?.content ?? "Say hi! 👋",
          lastTime: last?.created_at ?? null,
          unread: unreadCount.count ?? 0,
        };
      }));

      setMatches(rows);
      setLoading(false);
    });
  }, [user?.id]);

  const fmtTime = (ts: string | null) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 text-sm mt-1">Chat with your travel matches</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">No conversations yet</h2>
          <p className="text-slate-500 text-sm">Like someone on Discover People to start chatting</p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <button key={m.id} onClick={() => onSelectMatch(m.id, m.partner)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition text-left">
              <div className="relative shrink-0">
                {m.partner.profilePhoto ? (
                  <img src={m.partner.profilePhoto} alt={m.partner.fullName}
                    className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xl font-bold">
                    {m.partner.fullName.charAt(0)}
                  </div>
                )}
                <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-emerald-400 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{m.partner.fullName}</p>
                {m.partner.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" /> {m.partner.location}
                  </p>
                )}
                <p className="text-sm text-slate-500 truncate">{m.lastMsg}</p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                {m.lastTime && <p className="text-[10px] text-slate-400">{fmtTime(m.lastTime)}</p>}
                {m.unread > 0 && (
                  <span className="h-5 w-5 bg-sky-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ml-auto">
                    {m.unread > 9 ? "9+" : m.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chat Thread ────────────────────────────────────────────────
function ChatThread({ matchId, partner, onBack }: { matchId: string; partner: Partner; onBack: () => void }) {
  const { user }        = useAuthStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [showTrip, setShowTrip] = useState(false);
  const [gems, setGems]         = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMsgs = useCallback(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("messages")
      .select("id, sender_id, content, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMsgs((data ?? []).map((r: any) => ({
          id: r.id, senderId: r.sender_id, content: r.content, createdAt: r.created_at,
        })));
        setLoading(false);
        // mark partner messages as read
        supabase.from("messages")
          .update({ read: true })
          .eq("match_id", matchId)
          .neq("sender_id", user?.id ?? "")
          .then(() => {});
      });
  }, [matchId, user?.id]);

  useEffect(() => { loadMsgs(); }, [loadMsgs]);

  // Real-time subscription
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        const r = payload.new as any;
        setMsgs(prev => {
          if (prev.find(m => m.id === r.id)) return prev;
          return [...prev, { id: r.id, senderId: r.sender_id, content: r.content, createdAt: r.created_at }];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  // Load real hidden gems for trip planner
  const loadGems = () => {
    if (!isSupabaseConfigured || gems.length > 0) return;
    supabase.from("hidden_gems")
      .select("name")
      .eq("status", "approved")
      .limit(6)
      .then(({ data }) => setGems((data ?? []).map((g: any) => g.name)));
  };

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    if (isSupabaseConfigured) {
      const { data } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: user.id,
        content,
        read: false,
      }).select("id, sender_id, content, created_at").single();
      if (data) {
        setMsgs(prev => {
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, { id: data.id, senderId: data.sender_id, content: data.content, createdAt: data.created_at }];
        });
      }
    } else {
      // Offline / demo mode: add locally
      setMsgs(prev => [...prev, {
        id: `local_${Date.now()}`, senderId: user.id, content, createdAt: new Date().toISOString(),
      }]);
    }
    setSending(false);
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

  const QUICK_REPLIES = ["Hey! 👋", "Sure, when are you free?", "I'd love to! 🏖", "Let me check my schedule", "Sounds great!"];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {partner.profilePhoto ? (
          <img src={partner.profilePhoto} alt={partner.fullName} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
            {partner.fullName.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-slate-900 text-sm">{partner.fullName}</p>
          {partner.location && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" /> {partner.location}
            </p>
          )}
        </div>
        <button onClick={() => { setShowTrip(!showTrip); if (!showTrip) loadGems(); }}
          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition" title="Plan a trip together">
          <Map className="h-5 w-5" />
        </button>
      </div>

      {/* Trip planner — real gems */}
      {showTrip && (
        <div className="bg-sky-50 border-b border-sky-100 px-4 py-3">
          <p className="text-xs font-semibold text-sky-700 mb-2">🗺️ Trip Planner — Suggest a destination</p>
          {gems.length === 0 ? (
            <p className="text-xs text-sky-500">No approved hidden gems yet. Add some in the admin panel!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {gems.map((place) => (
                <button key={place}
                  onClick={() => { setInput(`Let's visit ${place}! 🗺️`); setShowTrip(false); }}
                  className="text-xs bg-white border border-sky-200 text-sky-700 rounded-lg px-2 py-1.5 hover:bg-sky-600 hover:text-white transition">
                  {place}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <MessageCircle className="h-8 w-8 text-slate-200" />
            <p className="text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : msgs.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                partner.profilePhoto ? (
                  <img src={partner.profilePhoto} alt="" className="h-7 w-7 rounded-full object-cover mr-2 self-end flex-shrink-0" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xs font-bold mr-2 self-end flex-shrink-0">
                    {partner.fullName.charAt(0)}
                  </div>
                )
              )}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                isMe ? "bg-sky-600 text-white rounded-br-sm" : "bg-white text-slate-800 shadow-sm rounded-bl-sm"
              }`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-sky-200" : "text-slate-400"}`}>{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
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

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <button className="p-2 text-slate-400 hover:text-sky-500 transition">
          <Smile className="h-5 w-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-full focus:ring-2 focus:ring-sky-500 outline-none"
        />
        <button onClick={handleSend} disabled={!input.trim() || sending}
          className="h-9 w-9 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────
export default function Chat() {
  const { matchId } = useParams<{ matchId?: string }>();
  const navigate = useNavigate();
  const [activeMatch, setActiveMatch] = useState<string | null>(matchId ?? null);
  const [activePartner, setActivePartner] = useState<Partner | null>(null);

  const handleSelect = (id: string, partner: Partner) => {
    setActiveMatch(id);
    setActivePartner(partner);
    navigate(`/chat/${id}`, { replace: true });
  };

  const handleBack = () => {
    setActiveMatch(null);
    setActivePartner(null);
    navigate("/chat", { replace: true });
  };

  if (activeMatch && activePartner) {
    return (
      <AppShell>
        <ChatThread matchId={activeMatch} partner={activePartner} onBack={handleBack} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ChatList onSelectMatch={handleSelect} />
    </AppShell>
  );
}
