import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useMatchStore, useChatStore, useAuthStore } from "../stores";
import { Send, ArrowLeft, MapPin, Smile, Map, Loader2 } from "lucide-react";

const QUICK_REPLIES = ["Hey! 👋", "Sure, when are you free?", "I'd love to! 🏖", "Let me check my schedule", "Sounds great!"];

// ─── Chat List ────────────────────────────────────────────────
function ChatList({ onSelectMatch }: { onSelectMatch: (id: string) => void }) {
  const { user } = useAuthStore();
  const { matches, fetchMatches } = useMatchStore();
  const { messages, fetchMessages, unreadByMatch } = useChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      await fetchMatches(user.id);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  // Fetch last message for each match
  useEffect(() => {
    matches.forEach((m) => {
      if (!messages[m.id]) fetchMessages(m.id);
    });
  }, [matches.length]);

  const getLastMsg = (matchId: string) => {
    const msgs = messages[matchId];
    if (!msgs || msgs.length === 0) return "Start a conversation!";
    return msgs[msgs.length - 1].content;
  };

  const getLastTime = (matchId: string) => {
    const msgs = messages[matchId];
    if (!msgs || msgs.length === 0) return "";
    const d = new Date(msgs[msgs.length - 1].timestamp);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 text-sm mt-1">Chat with your travel matches</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">💬</div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">No matches yet</h2>
          <p className="text-slate-500 text-sm">Like someone on Discover People to start chatting</p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const unread = unreadByMatch[m.id] ?? 0;
            return (
              <button key={m.id} onClick={() => onSelectMatch(m.id)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition text-left">
                <div className="relative shrink-0">
                  <img src={m.user.profilePhoto} alt={m.user.fullName}
                    className="h-14 w-14 rounded-full object-cover bg-slate-100" />
                  <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-slate-300 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{m.user.fullName}</p>
                  {m.user.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-0.5">
                      <MapPin className="h-3 w-3" /> {m.user.location}
                    </p>
                  )}
                  <p className={`text-sm truncate ${unread > 0 ? "text-slate-900 font-medium" : "text-slate-500"}`}>
                    {getLastMsg(m.id)}
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  {getLastTime(m.id) && (
                    <span className="text-[10px] text-slate-400">{getLastTime(m.id)}</span>
                  )}
                  {unread > 0 && (
                    <span className="h-5 w-5 bg-sky-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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

// ─── Chat Thread ──────────────────────────────────────────────
function ChatThread({ matchId, onBack }: { matchId: string; onBack: () => void }) {
  const { user } = useAuthStore();
  const { matches } = useMatchStore();
  const { messages, fetchMessages, sendMessage, markMatchRead, subscribeToMatch } = useChatStore();
  const location = useLocation();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTripPlanner, setShowTripPlanner] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const systemMessage = (location.state as { systemMessage?: string } | null)?.systemMessage ?? null;
  const match = matches.find((m) => m.id === matchId);
  const partner = match?.user;
  const threadMsgs = messages[matchId] ?? [];

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      await fetchMessages(matchId);
      await markMatchRead(matchId, user.id);
      setLoading(false);
      inputRef.current?.focus();
    };
    load();
    const unsub = subscribeToMatch(matchId);
    return unsub;
  }, [matchId, user?.id]);

  // Mark read when new messages arrive from partner
  useEffect(() => {
    if (user && threadMsgs.some((m) => m.senderId !== user.id && !m.read)) {
      markMatchRead(matchId, user.id);
    }
  }, [threadMsgs.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMsgs.length]);

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await sendMessage(matchId, user.id, text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {partner ? (
          <>
            <img src={partner.profilePhoto} alt={partner.fullName}
              className="h-9 w-9 rounded-full object-cover bg-slate-100" />
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">{partner.fullName}</p>
              {partner.location && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" /> {partner.location}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1">
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        )}
        <button onClick={() => setShowTripPlanner(!showTripPlanner)}
          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition" title="Plan a trip together">
          <Map className="h-5 w-5" />
        </button>
      </div>

      {/* Trip planner banner */}
      {showTripPlanner && (
        <div className="bg-sky-50 border-b border-sky-100 px-4 py-3">
          <p className="text-xs font-semibold text-sky-700 mb-2">🗺️ Trip Planner</p>
          <div className="grid grid-cols-3 gap-2">
            {["Nacpan Beach", "Kayangan Lake", "Kalanggaman"].map((place) => (
              <button key={place} onClick={() => { setInput(`Let's go to ${place}! 🗺️`); setShowTripPlanner(false); }}
                className="text-xs bg-white border border-sky-200 text-sky-700 rounded-lg px-2 py-1.5 hover:bg-sky-600 hover:text-white transition">
                {place}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {systemMessage && (
          <div className="flex justify-center my-2">
            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-xs px-4 py-2 rounded-full font-medium shadow-sm">
              {systemMessage}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          </div>
        ) : threadMsgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-slate-500 text-sm">You matched with {partner?.fullName ?? "someone"}!</p>
            <p className="text-slate-400 text-xs mt-1">Say hello and start planning your next trip.</p>
          </div>
        ) : (
          threadMsgs.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && partner && (
                  <img src={partner.profilePhoto} alt=""
                    className="h-7 w-7 rounded-full object-cover bg-slate-100 mr-2 self-end shrink-0" />
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe ? "bg-sky-600 text-white rounded-br-sm" : "bg-white text-slate-800 shadow-sm rounded-bl-sm"
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-sky-200" : "text-slate-400"}`}>
                    {formatTime(msg.timestamp)}
                    {isMe && <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>}
                  </p>
                </div>
              </div>
            );
          })
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

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <button className="p-2 text-slate-400 hover:text-sky-500 transition">
          <Smile className="h-5 w-5" />
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
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

// ─── Page ─────────────────────────────────────────────────────
export default function Chat() {
  const { matchId } = useParams<{ matchId?: string }>();
  const navigate = useNavigate();
  const [activeMatch, setActiveMatch] = useState<string | null>(matchId ?? null);

  if (activeMatch) {
    return (
      <AppShell>
        <ChatThread matchId={activeMatch} onBack={() => { setActiveMatch(null); navigate("/chat"); }} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ChatList onSelectMatch={setActiveMatch} />
    </AppShell>
  );
}
