import { useState, useRef, useEffect } from "react";
import Logo from "../components/Logo";
import { STUDENTS, MATCHES, CONVERSATIONS, FEED_POSTS, NOTIFICATIONS, ME, type Student } from "../data";
import { supabase, likeUser, getMyLikers, getMyMatches, getMessages, sendMessage, unmatch, deleteConversation, getFeedPosts, createFeedPost, toggleFeedUpvote, getMyVotedPostIds, reportFeedPost, fileReport, getFeedComments, createFeedComment, getMyProfile, updateMyProfile, recordProfileView, getMyProfileViewCount, getMyViewers, getMyNotifications, markNotificationRead, getReports, resolveReport, banReportedUser, suspendUser, unsuspendUser, deleteReport, deleteReportedContent, notifyReporter, getAllUsers, setUserBanned, getAllFeedPostsAdmin, setFeedPostRemoved, deleteFeedPostAdmin, getAdminStats, getMyBlockedUsers, unblockUser, unblockUserByTargetId, requestAccountDeletion, getDeletionRequests, adminApproveDeletion, adminDenyDeletion, getPublicProfile, submitPaymentRequest, getMyPaymentRequest, getPaymentRequests, adminApprovePayment, adminRejectPayment, type Liker, type MatchWithUser, type ChatMessage, type FeedPost, type FeedComment, type MyProfile, type NotificationRow, type AdminReport, type AdminUser, type AdminFeedPost, type AdminStats, type BlockedUser, type Viewer, type DeletionRequest, type PublicProfile, type PremiumPaymentRequest } from "../lib/supabase";

type View = "discover" | "likes" | "matches" | "messages" | "feed" | "notifications" | "profile" | "premium" | "admin" | "settings";
type Props = { initialView: View; onNavigate: (v: string) => void };

const NAV = [
  { id: "discover", icon: "🔍", label: "Discover" },
  { id: "likes", icon: "❤️", label: "Likes" },
  { id: "matches", icon: "🎉", label: "Matches" },
  { id: "messages", icon: "💬", label: "Messages" },
  { id: "feed", icon: "📰", label: "Campus Feed" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "profile", icon: "👤", label: "My Profile" },
  { id: "premium", icon: "⭐", label: "Premium" },
];

function DeptBadge({ dept }: { dept: string }) {
  const colors: Record<string, string> = {
    CICT: "bg-blue-100 text-blue-700",
    COED: "bg-green-100 text-green-700",
    CBA: "bg-orange-100 text-orange-700",
    CCS: "bg-purple-100 text-purple-700",
    CON: "bg-pink-100 text-pink-700",
    COE: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors[dept] ?? "bg-slate-100 text-slate-600"}`}>{dept}</span>;
}

function InterestTag({ label, shared }: { label: string; shared?: boolean }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${shared ? "bg-primary text-white" : "bg-[#EDE9FF] text-primary"}`}>
      {label}
    </span>
  );
}

/* ============================
   SHARED: REPORT MODAL
   ============================ */
type ReportTarget = { type: "user" | "feed_post" | "feed_comment" | "message"; id: string; label: string };

function ReportModal({ target, onClose, onSubmitted }: { target: ReportTarget; onClose: () => void; onSubmitted: () => void }) {
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) { setError("Please describe the issue."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await fileReport(target.type, target.id, reason.trim(), file);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl slide-up" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-extrabold text-[#1A1033] mb-1">Report {target.label}</h3>
        <p className="text-sm text-slate-500 mb-4">Tell us what's wrong — our team reviews every report.</p>
        {error && <div className="bg-like-light border border-like/30 rounded-xl px-4 py-3 text-sm text-like font-medium mb-3">{error}</div>}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What happened?"
          rows={4}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary mb-3"
          autoFocus
        />
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Screenshot (optional)</label>
        {file ? (
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-4 text-sm">
            <span className="truncate text-slate-600">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-slate-400 hover:text-like text-xs font-bold ml-2">Remove</button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl px-4 py-3 mb-4 text-sm text-slate-400 hover:border-primary/50 hover:text-primary cursor-pointer transition-colors">
            📎 Attach a screenshot
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
          </label>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={submitting} className="flex-1 py-3 rounded-xl bg-like text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================
   DISCOVER VIEW
   ============================ */
type DiscoverStudent = {
  id: string; name: string; dept: string; year: string; program: string;
  bio: string; interests: string[]; sharedInterests: string[]; photo: string;
};

function DiscoverView({ onMatch }: { onMatch: (s: Student) => void }) {
  const [cardIndex, setCardIndex] = useState(0);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [swipeAnim, setSwipeAnim] = useState<"" | "left" | "right">("");
  const [candidates, setCandidates] = useState<DiscoverStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Not signed in.");

      const { data: me } = await supabase
        .from("users")
        .select("id, interests")
        .eq("auth_id", authData.user.id)
        .single();
      if (!me) throw new Error("Your profile isn't set up yet — finish onboarding first.");

      // RLS (003_row_level_security.sql) already restricts this to verified,
      // non-blocked users only — no need to filter that client-side.
      const { data: others, error: othersError } = await supabase
        .from("users")
        .select("id, name, dept, year_level, program, bio, interests, photo_url")
        .neq("id", me.id)
        .limit(50);
      if (othersError) throw othersError;

      const { data: myLikes } = await supabase
        .from("likes")
        .select("to_user")
        .eq("from_user", me.id);
      const alreadyLiked = new Set((myLikes ?? []).map((l) => l.to_user));

      const myInterests: string[] = me.interests ?? [];
      const mapped: DiscoverStudent[] = (others ?? [])
        .filter((o) => !alreadyLiked.has(o.id))
        .map((o) => ({
          id: o.id,
          name: o.name,
          dept: o.dept,
          year: o.year_level,
          program: o.program ?? "",
          bio: o.bio ?? "",
          interests: o.interests ?? [],
          sharedInterests: (o.interests ?? []).filter((i: string) => myInterests.includes(i)),
          photo: o.photo_url ?? "",
        }));
      setCandidates(mapped);
    } catch (err: any) {
      setLoadError(err?.message || "Failed to load profiles.");
    } finally {
      setLoading(false);
    }
  }

  const student = candidates[cardIndex % (candidates.length || 1)];
  const nextStudent = candidates[(cardIndex + 1) % (candidates.length || 1)];

  function swipe(dir: "left" | "right") {
    if (!student) return;
    setShowFullProfile(false);
    setSwipeAnim(dir);
    recordProfileView(student.id).catch(() => {}); // fire-and-forget, doesn't block the swipe
    setTimeout(async () => {
      if (dir === "right") {
        try {
          // No longer triggering the match popup directly from here — both
          // people need to see it, not just whoever completes the mutual
          // like. The Dashboard-level realtime subscription on `matches`
          // handles showing it for both sides uniformly, see
          // 20250908340001_enable_realtime_matches.sql.
          await likeUser(student.id);
        } catch (err) {
          console.error("Like failed:", err);
        }
      }
      setCardIndex((i) => i + 1);
      setSwipeAnim("");
    }, 380);
  }

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400">
        <p className="font-medium">Loading profiles…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-like-light border border-like/30 rounded-2xl p-6 text-center">
        <p className="text-like font-semibold">{loadError}</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#1A1033] font-display">Discover</h1>
          <p className="text-slate-500 mt-1">Find people you might connect with.</p>
        </div>
        <div className="text-center py-24 text-slate-400">
          <div className="text-4xl mb-3">✨</div>
          <p className="font-medium">No more profiles right now</p>
          <p className="text-sm mt-1">Check back later as more students join and get verified.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1A1033] font-display">Discover</h1>
        <p className="text-slate-500 mt-1">Find people you might connect with.</p>
      </div>
      <div className="flex gap-8 items-start">
        {/* Main card */}
        <div className="relative w-80 h-[540px] flex-shrink-0">
          {/* Back card (next) */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-lg scale-95 translate-y-3 bg-white border border-slate-100">
            <img src={nextStudent.photo} alt="" className="w-full h-72 object-cover" />
          </div>
          {/* Main card */}
          <div
            className={`absolute inset-0 bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 transition-transform ${
              swipeAnim === "left" ? "card-left" : swipeAnim === "right" ? "card-right" : ""
            }`}
          >
            <div className="relative">
              <img src={student.photo} alt={student.name} className="w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1033]/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-white text-2xl font-extrabold font-display">{student.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <DeptBadge dept={student.dept} />
                  <span className="text-white/80 text-xs">{student.year}</span>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400 mb-1">{student.program}</p>
              <p className="text-sm text-[#1A1033] mb-3">"{student.bio}"</p>
              {student.sharedInterests.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 font-medium mb-1.5">Shared interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {student.sharedInterests.map((i) => <InterestTag key={i} label={i} shared />)}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {student.interests.filter((i) => !student.sharedInterests.includes(i)).slice(0, 3).map((i) => (
                  <InterestTag key={i} label={i} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions + side info */}
        <div className="flex-1">
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => swipe("left")}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
            >
              <span className="text-xl">✕</span> Pass
            </button>
            <button
              onClick={() => swipe("right")}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-like text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-like/30 active:scale-95"
            >
              <span className="text-xl">❤️</span> Like
            </button>
          </div>
          <button onClick={() => setShowFullProfile(true)} className="w-full py-3 rounded-2xl border-2 border-primary/30 text-primary font-bold text-sm hover:bg-primary-light transition-colors mb-8">
            👁 View Full Profile
          </button>

          {/* Next up */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-4">Up Next</p>
            {candidates.slice(cardIndex + 1, cardIndex + 4).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                <img src={s.photo} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1A1033] truncate">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.dept} · {s.year}</p>
                </div>
                <span className="text-xs text-slate-300">#{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showFullProfile && student && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setShowFullProfile(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl slide-up overflow-hidden max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <img src={student.photo} alt={student.name} className="w-full h-72 object-cover" />
            <div className="p-6">
              <h3 className="text-2xl font-extrabold text-[#1A1033] font-display">{student.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <DeptBadge dept={student.dept} />
                <span className="text-sm text-slate-500">{student.year}{student.program && ` · ${student.program}`}</span>
              </div>
              {student.bio && <p className="text-sm text-[#1A1033] mt-4 leading-relaxed">"{student.bio}"</p>}
              {student.interests.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {student.interests.map((i) => <InterestTag key={i} label={i} shared={student.sharedInterests.includes(i)} />)}
                  </div>
                </div>
              )}
              <button onClick={() => setShowFullProfile(false)} className="w-full mt-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================
   LIKES VIEW
   ============================ */
function LikesView({ isPremium, onNavigate }: { isPremium: boolean; onNavigate: (v: string) => void }) {
  const [tab, setTab] = useState<"likes" | "views">("likes");
  const [likers, setLikers] = useState<Liker[]>([]);
  const [likersLoading, setLikersLoading] = useState(true);
  const [likersError, setLikersError] = useState<string | null>(null);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [viewersLoading, setViewersLoading] = useState(true);
  const [viewersError, setViewersError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "likes") return;
    setLikersLoading(true);
    setLikersError(null);
    getMyLikers()
      .then(setLikers)
      .catch((err) => setLikersError(err?.message || "Failed to load who liked you."))
      .finally(() => setLikersLoading(false));
    // Note: is_premium gating for the returned photo/name fields happens
    // server-side inside get_my_likers() (004_rpc_functions.sql), based on
    // the REAL users.is_premium column — not the `isPremium` prop below,
    // which is still Dashboard's local demo toggle until Phase 3's PayMongo
    // webhook is wired up to actually flip that column.
  }, [tab]);

  useEffect(() => {
    if (tab !== "views") return;
    setViewersLoading(true);
    setViewersError(null);
    getMyViewers()
      .then(setViewers)
      .catch((err) => setViewersError(err?.message || "Failed to load who viewed you."))
      .finally(() => setViewersLoading(false));
  }, [tab]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A1033] font-display">Who likes you</h1>
          <p className="text-slate-500 mt-1">{isPremium ? "You can see everyone who liked you." : "Upgrade to reveal who liked you."}</p>
        </div>
        {!isPremium && (
          <button onClick={() => onNavigate("premium")} className="bg-premium text-[#1A1033] font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            ⭐ Get Premium
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-8">
        {(["likes", "views"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${tab === t ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "likes" ? "❤️ Likes" : "👁 Views"}
          </button>
        ))}
      </div>

      {!isPremium && (
        <div className="bg-gradient-to-r from-premium-light to-white border border-premium/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="text-3xl">⭐</div>
          <div className="flex-1">
            <p className="font-bold text-[#1A1033]">See who likes you</p>
            <p className="text-sm text-slate-500">Upgrade to Premium for ₱30 lifetime and unlock all profiles.</p>
          </div>
          <button onClick={() => onNavigate("premium")} className="bg-premium text-[#1A1033] font-bold px-5 py-2 rounded-xl text-sm hover:opacity-90 whitespace-nowrap">
            Unlock — ₱30
          </button>
        </div>
      )}

      {tab === "likes" && likersLoading && (
        <p className="text-center text-slate-400 py-16">Loading…</p>
      )}
      {tab === "likes" && likersError && (
        <div className="bg-like-light border border-like/30 rounded-xl px-4 py-3 text-sm text-like font-medium max-w-md mx-auto text-center">
          {likersError}
        </div>
      )}
      {tab === "likes" && !likersLoading && !likersError && likers.length === 0 && (
        <p className="text-center text-slate-400 py-16">No likes yet — keep discovering!</p>
      )}

      {tab === "views" && viewersLoading && (
        <p className="text-center text-slate-400 py-16">Loading…</p>
      )}
      {tab === "views" && viewersError && (
        <div className="bg-like-light border border-like/30 rounded-xl px-4 py-3 text-sm text-like font-medium max-w-md mx-auto text-center">
          {viewersError}
        </div>
      )}
      {tab === "views" && !viewersLoading && !viewersError && viewers.length === 0 && (
        <p className="text-center text-slate-400 py-16">No profile views yet.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tab === "likes" && likers.map((l) => {
          // name/photo_url are only non-null when get_my_likers() (server-side)
          // determined the caller is actually premium — this is what "gating
          // happens in the function, not frontend conditional rendering" means.
          const revealed = l.name !== null;
          return (
            <div key={l.like_id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative">
              <div className="relative">
                <img
                  src={l.photo_url || "https://placehold.co/400x300?text=%F0%9F%91%A4"}
                  alt={revealed ? l.name! : "Blurred profile"}
                  className={`w-full h-48 object-cover transition-all ${!revealed ? "blur-lg scale-105" : ""}`}
                />
                {!revealed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <p className="text-white font-bold text-center text-sm px-4 drop-shadow-lg">
                      Someone from {l.dept}
                    </p>
                    <p className="text-white/80 text-xs">{l.year_level}</p>
                    <button onClick={() => onNavigate("premium")} className="mt-2 bg-white/90 text-primary font-bold text-xs px-4 py-2 rounded-full hover:bg-white transition-colors">
                      Unlock with Premium
                    </button>
                  </div>
                )}
                {revealed && (
                  <div className="absolute top-3 right-3 bg-like text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    ❤️ Liked you
                  </div>
                )}
              </div>
              <div className="p-4">
                {revealed ? (
                  <>
                    <p className="font-bold text-[#1A1033]">{l.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DeptBadge dept={l.dept} />
                      <span className="text-xs text-slate-400">{l.year_level}</span>
                    </div>
                    {l.shared_interest_count > 0 && (
                      <p className="text-xs text-primary font-medium mt-2">🔗 {l.shared_interest_count} shared interests</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{new Date(l.liked_at).toLocaleDateString()}</p>
                    <button
                      onClick={async () => { if (l.user_id) { await likeUser(l.user_id); } }}
                      className="mt-3 w-full bg-like text-white font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
                    >
                      ❤️ Like Back
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[#1A1033]">Someone from {l.dept}</p>
                    <p className="text-sm text-slate-400">{l.year_level}</p>
                    <p className="text-xs text-primary font-medium mt-1">{l.shared_interest_count} shared interests</p>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {tab === "views" && viewers.map((v) => {
          const revealed = v.name !== null;
          return (
            <div key={v.view_id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative">
              <div className="relative">
                <img
                  src={v.photo_url || "https://placehold.co/400x300?text=%F0%9F%91%A4"}
                  alt={revealed ? v.name! : "Blurred profile"}
                  className={`w-full h-48 object-cover transition-all ${!revealed ? "blur-lg scale-105" : ""}`}
                />
                {!revealed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <p className="text-white font-bold text-center text-sm px-4 drop-shadow-lg">
                      Someone from {v.dept}
                    </p>
                    <p className="text-white/80 text-xs">{v.year_level}</p>
                    <button onClick={() => onNavigate("premium")} className="mt-2 bg-white/90 text-primary font-bold text-xs px-4 py-2 rounded-full hover:bg-white transition-colors">
                      Unlock with Premium
                    </button>
                  </div>
                )}
                {revealed && (
                  <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    👁 Viewed you
                  </div>
                )}
              </div>
              <div className="p-4">
                {revealed ? (
                  <>
                    <p className="font-bold text-[#1A1033]">{v.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DeptBadge dept={v.dept} />
                      <span className="text-xs text-slate-400">{v.year_level}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{new Date(v.viewed_at).toLocaleDateString()}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[#1A1033]">Someone from {v.dept}</p>
                    <p className="text-sm text-slate-400">{v.year_level}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================
   MATCHES VIEW
   ============================ */
function MatchesView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyMatches()
      .then(setMatches)
      .catch((err) => setError(err?.message || "Failed to load matches."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-slate-400 py-24">Loading…</p>;
  if (error) return <p className="text-center text-like font-medium py-24">{error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-[#1A1033] font-display mb-2">Your Matches</h1>
      <p className="text-slate-500 mb-8">You matched with {matches.length} people.</p>

      {matches.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">💔</div>
          <h3 className="text-xl font-bold text-[#1A1033] mb-2">No matches yet</h3>
          <p className="text-slate-500 mb-6">Keep discovering — your next connection might be one swipe away.</p>
          <button onClick={() => onNavigate("discover")} className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark">Discover People</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {matches.map((m) => (
            <div key={m.match_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative">
                <img src={m.photo_url || "https://placehold.co/400x300?text=%F0%9F%91%A4"} alt={m.name} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1033]/60 to-transparent" />
                {m.blockedByMe ? (
                  <div className="absolute top-3 right-3 bg-like text-white text-xs font-bold px-2.5 py-1 rounded-full">🚫 Blocked</div>
                ) : (
                  <div className="absolute top-3 right-3 bg-match text-white text-xs font-bold px-2.5 py-1 rounded-full">🎉 Match</div>
                )}
                <div className="absolute bottom-4 left-4">
                  <p className="text-white font-bold text-lg">{m.name}</p>
                  <p className="text-white/80 text-xs">{m.dept} · {m.year_level}</p>
                </div>
              </div>
              <div className="p-4">
                {m.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {m.interests.slice(0, 4).map((i) => <InterestTag key={i} label={i} shared />)}
                  </div>
                )}
                <button onClick={() => onNavigate("messages")} className="w-full bg-primary text-white font-bold py-3 rounded-xl text-sm hover:bg-primary-dark transition-colors">
                  💬 Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================
   MESSAGES VIEW
   ============================ */
function MessagesView() {
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: me } = await supabase.from("users").select("id").eq("auth_id", authData.user.id).single();
        if (me) setMyId(me.id);
      }
      try {
        const m = await getMyMatches();
        setMatches(m);
        if (m.length > 0) setActiveMatchId(m[0].match_id);
      } catch (err) {
        console.error("Failed to load matches:", err);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeMatchId) return;
    getMessages(activeMatchId).then(setMessages).catch((err) => console.error("Failed to load messages:", err));

    // Live updates so the other person's messages show up without refreshing.
    const channel = supabase
      .channel(`messages:${activeMatchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${activeMatchId}` },
        (payload) => {
          // Realtime sends Postgres's raw timestamp format ("2025-09-08
          // 09:12:33+00"), which some browsers fail to parse — normalize it
          // to ISO 8601 ("2025-09-08T09:12:33+00") so `new Date(...)` works
          // immediately instead of only after a refetch via getMessages().
          const raw = payload.new as ChatMessage;
          const fixed = { ...raw, sent_at: raw.sent_at.includes("T") ? raw.sent_at : raw.sent_at.replace(" ", "T") };
          setMessages((prev) => (prev.some((m) => m.id === fixed.id) ? prev : [...prev, fixed]));
        }
      )
      .subscribe((status, err) => {
        // If the live connection silently fails (network issue, realtime
        // not enabled correctly, etc.), this logs exactly why — check the
        // browser console if messages still aren't appearing live.
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || err) {
          console.error("Messages realtime subscription problem:", status, err);
        }
      });

    // Backup poll: even if the live connection above has an issue, this
    // guarantees new messages show up within a few seconds — no more
    // needing to restart the app to see what was already sent.
    const pollInterval = setInterval(() => {
      getMessages(activeMatchId).then((fresh) => {
        setMessages((prev) => (fresh.length !== prev.length ? fresh : prev));
      }).catch(() => {});
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [activeMatchId]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages]);

  async function send() {
    if (!input.trim() || !activeMatchId) return;
    const text = input.trim();
    setInput("");
    try {
      await sendMessage(activeMatchId, text);
      // The realtime subscription above appends the confirmed row — not
      // adding it optimistically here to avoid a duplicate if it arrives fast.
    } catch (err) {
      console.error("Send failed:", err);
    }
  }

  const conv = matches.find((m) => m.match_id === activeMatchId) ?? matches[0];

  async function handleUnmatch() {
    if (!activeMatchId || !conv) return;
    if (!window.confirm(`Unmatch this person?\n\nYou will no longer be matched and will not be able to continue this conversation. This person will appear again in Discover.`)) return;
    try {
      await unmatch(activeMatchId);
      // Silent by design (Phase 1 rule 5) — no message sent to the other
      // side, we just stop showing them the match on our end.
      setMatches((prev) => prev.filter((m) => m.match_id !== activeMatchId));
      setActiveMatchId(null);
    } catch (err) {
      console.error("Unmatch failed:", err);
      window.alert(err instanceof Error ? err.message : "Unmatch failed — check the console for the exact error.");
    }
  }

  async function handleDeleteConversation() {
    if (!activeMatchId || !conv) return;
    if (!window.confirm(`Delete this entire conversation?\n\nThis permanently deletes every message for BOTH of you — it will be completely gone, not just hidden. This can't be undone.`)) return;
    try {
      await deleteConversation(activeMatchId);
      setMatches((prev) => prev.filter((m) => m.match_id !== activeMatchId));
      setActiveMatchId(null);
    } catch (err) {
      console.error("Delete conversation failed:", err);
      window.alert(err instanceof Error ? err.message : "Failed to delete conversation — check the console for the exact error.");
    }
  }

  async function handleBlock() {
    if (!activeMatchId || !conv || !myId) return;
    if (!window.confirm(`Block this person?\n\nThey will no longer be able to contact you or access this conversation.`)) return;
    try {
      await supabase.from("blocks").insert({ blocker_id: myId, blocked_id: conv.other_user_id });
      // No longer calling unmatch() here — blocking keeps the conversation
      // visible on YOUR side (marked blockedByMe), it just stops future
      // messages both ways (enforced server-side, see 021_block_prevents_
      // messaging.sql) and hides you from each other in Discover/Likes.
      setMatches((prev) => prev.map((m) => (m.match_id === activeMatchId ? { ...m, blockedByMe: true } : m)));
    } catch (err) {
      console.error("Block failed:", err);
    }
  }

  async function handleUnblockFromChat() {
    if (!conv) return;
    if (!window.confirm(`Unblock this person?\n\nYou will be able to communicate with them again.`)) return;
    try {
      await unblockUserByTargetId(conv.other_user_id);
      setMatches((prev) => prev.map((m) => (m.match_id === activeMatchId ? { ...m, blockedByMe: false } : m)));
    } catch (err) {
      console.error("Unblock failed:", err);
    }
  }

  function handleReport() {
    if (!conv) return;
    setReportTarget({ type: "user", id: conv.other_user_id, label: conv.name });
  }

  if (loading) return <p className="text-center text-slate-400 py-24">Loading…</p>;

  if (matches.length === 0 || !conv) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-bold text-[#1A1033] mb-2">No conversations yet</h3>
        <p className="text-slate-500">Match with someone to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-extrabold text-[#1A1033] font-display">Messages</h2>
          <div className="mt-2 relative">
            <input className="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm pl-8 focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Search..." />
            <span className="absolute left-2.5 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {matches.map((m) => (
            <button
              key={m.match_id}
              onClick={() => setActiveMatchId(m.match_id)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left ${activeMatchId === m.match_id ? "bg-primary-light" : ""}`}
            >
              <img src={m.photo_url || "https://placehold.co/100x100?text=%F0%9F%91%A4"} alt={m.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#1A1033] truncate flex items-center gap-1.5">
                  {m.name}
                  {m.blockedByMe && <span className="text-[10px] bg-like-light text-like font-bold px-1.5 py-0.5 rounded-full">Blocked</span>}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{m.dept} · {m.year_level}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src={conv.photo_url || "https://placehold.co/100x100?text=%F0%9F%91%A4"} alt={conv.name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-bold text-[#1A1033]">{conv.name}</p>
              <DeptBadge dept={conv.dept} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUnmatch} className="text-xs text-slate-400 hover:text-like px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Unmatch</button>
            <button onClick={handleDeleteConversation} className="text-xs text-slate-400 hover:text-like px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Delete Conversation</button>
            {conv.blockedByMe ? (
              <button onClick={handleUnblockFromChat} className="text-xs text-primary font-bold px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors">Unblock</button>
            ) : (
              <button onClick={handleBlock} className="text-xs text-slate-400 hover:text-like px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Block</button>
            )}
            <button onClick={handleReport} className="text-xs text-slate-400 hover:text-like px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Report</button>
          </div>
        </div>

        {conv.blockedByMe && (
          <div className="bg-like-light border-b border-like/20 px-6 py-2.5 text-xs text-like font-semibold text-center">
            🚫 You blocked this person. Unblock them to continue the conversation.
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.map((m) => {
            const isMe = m.sender_id === myId;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <img src={conv.photo_url || "https://placehold.co/100x100?text=%F0%9F%91%A4"} alt="" className="w-7 h-7 rounded-full object-cover mr-2 mt-auto flex-shrink-0" />
                )}
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
                    isMe ? "bg-primary text-white rounded-br-sm" : "bg-slate-100 text-[#1A1033] rounded-bl-sm"
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-slate-400"}`}>
                    {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} {isMe && "✓"}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 items-center">
          <button onClick={() => window.alert("Emoji picker isn't built yet — you can still type emoji directly on your keyboard.")} disabled={conv.blockedByMe} className="text-slate-400 hover:text-primary transition-colors text-xl disabled:opacity-30">😊</button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={conv.blockedByMe ? "You blocked this person — unblock to send messages" : "Write a message..."}
            disabled={conv.blockedByMe}
            className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!input.trim() || conv.blockedByMe}
            className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onSubmitted={() => { setReportTarget(null); window.alert("Report submitted — our team will review it."); }}
        />
      )}
    </div>
  );
}

/* ============================
   COMMENT THREAD (flat: all replies under a top-level comment sit at one
   consistent indent level, no matter how deep the actual reply chain goes —
   keeps threads from creeping further right with every extra reply)
   ============================ */
/* ============================
   MINI PROFILE MODAL (click a commenter's name/photo to preview them)
   ============================ */
function MiniProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicProfile(userId)
      .then(setProfile)
      .catch((err) => setError(err?.message || "Couldn't load this profile."))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl slide-up overflow-hidden max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {loading && <p className="text-center text-slate-400 py-16">Loading…</p>}
        {error && <p className="text-center text-like font-medium py-16 px-6">{error}</p>}
        {profile && (
          <>
            <img src={profile.photo_url || "https://placehold.co/400x300?text=%F0%9F%91%A4"} alt={profile.name} className="w-full h-64 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-extrabold text-[#1A1033] font-display">{profile.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <DeptBadge dept={profile.dept} />
                <span className="text-sm text-slate-500">{profile.year_level}{profile.program && ` · ${profile.program}`}</span>
              </div>
              {profile.bio && <p className="text-sm text-[#1A1033] mt-4 leading-relaxed">"{profile.bio}"</p>}
              {profile.interests.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((i) => <InterestTag key={i} label={i} />)}
                  </div>
                </div>
              )}
              <button onClick={onClose} className="w-full mt-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CommentThread({
  comment, allComments, postId, replyingTo, setReplyingTo, replyText, setReplyText, onSubmitReply, onReport, isAdmin, onDelete, onViewProfile,
}: {
  comment: FeedComment; // the TOP-LEVEL comment
  allComments: FeedComment[];
  postId: string;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (t: string) => void;
  onSubmitReply: (postId: string, parentCommentId: string) => void;
  onReport: (commentId: string) => void;
  isAdmin: boolean;
  onDelete: (commentId: string) => void;
  onViewProfile: (userId: string) => void;
}) {
  // Every descendant of this top-level comment, at any real depth, flattened
  // into one chronological list — parent_comment_id in the database still
  // tracks exactly who each reply was really replying to, this just avoids
  // visually indenting further for every extra level.
  const byId = new Map(allComments.map((c) => [c.id, c]));
  function isDescendantOf(c: FeedComment, ancestorId: string): boolean {
    let cur: FeedComment | undefined = c;
    while (cur?.parent_comment_id) {
      if (cur.parent_comment_id === ancestorId) return true;
      cur = byId.get(cur.parent_comment_id);
    }
    return false;
  }
  const replies = allComments
    .filter((c) => c.id !== comment.id && isDescendantOf(c, comment.id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  function CommentRow({ c, replyingToName }: { c: FeedComment; replyingToName?: string }) {
    return (
      <div>
        <div className="flex gap-2 text-sm group">
          <button onClick={() => c.author_id && onViewProfile(c.author_id)} disabled={!c.author_id} className="flex-shrink-0">
            <img src={c.author_photo || "https://placehold.co/60x60?text=%F0%9F%91%A4"} alt={c.author_name} className="w-6 h-6 rounded-full object-cover hover:opacity-80 transition-opacity" />
          </button>
          <div className="flex-1">
            <button onClick={() => c.author_id && onViewProfile(c.author_id)} disabled={!c.author_id} className="font-semibold text-xs text-[#1A1033] hover:text-primary hover:underline">
              {c.author_name}
            </button>
            {replyingToName && <p className="text-[10px] text-primary font-medium">replying to @{replyingToName}</p>}
            <p className="text-[#1A1033]">{c.text}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString()}</p>
              <button onClick={() => { setReplyingTo(c.id); setReplyText(""); }} className="text-[10px] font-bold text-slate-400 hover:text-primary">Reply</button>
              {isAdmin && (
                <button onClick={() => onDelete(c.id)} className="text-[10px] font-bold text-like hover:underline">Delete</button>
              )}
            </div>
          </div>
          <button onClick={() => onReport(c.id)} className="text-slate-300 hover:text-like text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">🚩</button>
        </div>

        {replyingTo === c.id && (
          <div className="mt-2 ml-8 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmitReply(postId, c.id)}
              placeholder={`Reply to ${c.author_name}…`}
              className="flex-1 bg-slate-100 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <button onClick={() => onSubmitReply(postId, c.id)} className="text-primary font-bold text-sm px-2">Post</button>
            <button onClick={() => setReplyingTo(null)} className="text-slate-400 text-sm px-1">Cancel</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <CommentRow c={comment} />
      {replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-3 border-l-2 border-slate-100 pl-3">
          {replies.map((r) => (
            <CommentRow
              key={r.id}
              c={r}
              // Only label "replying to @X" when it's not a direct reply to
              // the top-level comment itself — that relationship is already
              // obvious from being in this indented block at all.
              replyingToName={r.parent_comment_id !== comment.id ? byId.get(r.parent_comment_id!)?.author_name : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================
   FEED VIEW
   ============================ */
function FeedView() {
  const [filter, setFilter] = useState("Hot");
  const [showCreate, setShowCreate] = useState(false);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [postAsAdmin, setPostAsAdmin] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
    getMyVotedPostIds().then((ids) => {
      const record: Record<string, boolean> = {};
      ids.forEach((id) => { record[id] = true; });
      setVoted(record);
    }).catch(() => {});
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: me } = await supabase.from("users").select("is_admin").eq("auth_id", data.user.id).single();
      setIsAdmin(!!me?.is_admin);
    });
  }, []);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      setPosts(await getFeedPosts());
    } catch (err: any) {
      setError(err?.message || "Failed to load the feed.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      await createFeedPost(postText.trim(), isAdmin && postAsAdmin);
      setPostText("");
      setPostAsAdmin(false);
      setShowCreate(false);
      await loadPosts();
    } catch (err) {
      console.error("Post failed:", err);
    } finally {
      setPosting(false);
    }
  }

  async function toggleComments(postId: string) {
    const nowOpen = !expandedComments[postId];
    setExpandedComments((e) => ({ ...e, [postId]: nowOpen }));
    if (nowOpen && !comments[postId]) {
      try {
        const c = await getFeedComments(postId);
        setComments((prev) => ({ ...prev, [postId]: c }));
      } catch (err: any) {
        console.error("Failed to load comments:", err);
        window.alert(err?.message || "Failed to load comments — check the console for details.");
      }
    }
  }

  async function handleAdminDeleteComment(postId: string, commentId: string) {
    if (!window.confirm("Delete this comment? This can't be undone.")) return;
    try {
      await deleteReportedContent("feed_comment", commentId);
      const c = await getFeedComments(postId);
      setComments((prev) => ({ ...prev, [postId]: c }));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(p.comment_count - 1, 0) } : p)));
    } catch (err: any) {
      console.error("Delete comment failed:", err);
      window.alert(err?.message || "Failed to delete comment.");
    }
  }

  async function handleAdminDeletePost(postId: string) {
    if (!window.confirm("Permanently delete this post? This can't be undone.")) return;
    try {
      await deleteFeedPostAdmin(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      console.error("Delete post failed:", err);
      window.alert(err?.message || "Failed to delete post.");
    }
  }

  async function submitComment(postId: string, parentCommentId: string | null = null) {
    const text = parentCommentId ? replyText.trim() : (commentInputs[postId] || "").trim();
    if (!text) return;
    if (parentCommentId) {
      setReplyText("");
      setReplyingTo(null);
    } else {
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    }
    try {
      await createFeedComment(postId, text, parentCommentId);
      const c = await getFeedComments(postId);
      setComments((prev) => ({ ...prev, [postId]: c }));
      // Bump the counter shown on the post card immediately — the database
      // trigger already updated the real value, this just keeps the
      // already-fetched `posts` list in sync without needing a full reload.
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)));
    } catch (err: any) {
      console.error("Comment failed:", err);
      window.alert(err?.message || "Failed to post comment — check the console for details.");
    }
  }

  async function upvote(post: FeedPost) {
    // Optimistic UI, but the server (toggle_feed_upvote RPC) is the real
    // source of truth — reconciled once it responds.
    const optimisticVoted = !voted[post.id];
    setVoted((v) => ({ ...v, [post.id]: optimisticVoted }));
    setPosts((p) => p.map((x) => x.id === post.id ? { ...x, upvotes: x.upvotes + (optimisticVoted ? 1 : -1) } : x));
    try {
      const result = await toggleFeedUpvote(post.id);
      setVoted((v) => ({ ...v, [post.id]: result.nowVoted }));
      setPosts((p) => p.map((x) => x.id === post.id ? { ...x, upvotes: result.upvotes } : x));
    } catch (err: any) {
      // Revert the optimistic update since it didn't actually happen.
      setVoted((v) => ({ ...v, [post.id]: !optimisticVoted }));
      setPosts((p) => p.map((x) => x.id === post.id ? { ...x, upvotes: x.upvotes + (optimisticVoted ? -1 : 1) } : x));
      console.error("Upvote failed:", err);
      window.alert(err?.message || "Upvote failed — check the console for details.");
    }
  }

  function report(post: FeedPost) {
    setReportTarget({ type: "feed_post", id: post.id, label: "this post" });
  }

  const sortedPosts = filter === "Top"
    ? [...posts].sort((a, b) => b.upvotes - a.upvotes)
    : posts; // "Hot" and "Recent" both just use created_at desc order for now

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A1033] font-display">Campus Feed</h1>
          <p className="text-slate-500 mt-1">Say it anonymously.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary-dark flex items-center gap-2">
          + Create Post
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {["Hot", "Recent", "Top"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === f ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {f === "Hot" ? "🔥" : f === "Recent" ? "🕐" : "📈"} {f}
          </button>
        ))}
      </div>

      {/* Create post modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl slide-up">
            <h3 className="text-xl font-extrabold text-[#1A1033] mb-2 font-display">
              {isAdmin && postAsAdmin ? "Post as TCUnnect Admin" : "Share anonymously"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {isAdmin && postAsAdmin ? "This post will show your admin identity, not Anonymous." : "Your name and profile will not appear on this post."}
            </p>
            {isAdmin && (
              <label className="flex items-center gap-2 mb-4 text-sm font-medium text-[#1A1033] cursor-pointer">
                <input type="checkbox" checked={postAsAdmin} onChange={(e) => setPostAsAdmin(e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                Post as TCUnnect Admin (not anonymous)
              </label>
            )}
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value.slice(0, 500))}
              placeholder="What's on your mind?"
              rows={5}
              className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary mb-2"
              autoFocus
            />
            <div className="flex justify-between items-center mb-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full font-medium">
                {isAdmin && postAsAdmin ? "🛡️ Posting as TCUnnect Admin" : "🎭 Your name will not appear on this post"}
              </span>
              <span>{postText.length} / 500</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
              <button onClick={handlePost} disabled={!postText.trim() || posting} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50">
                {posting ? "Posting…" : isAdmin && postAsAdmin ? "Post as Admin" : "Post Anonymously"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-slate-400 py-16">Loading feed…</p>}
      {error && <p className="text-center text-like font-medium py-16">{error}</p>}
      {!loading && !error && sortedPosts.length === 0 && (
        <p className="text-center text-slate-400 py-16">No posts yet — be the first to share something.</p>
      )}

      <div className="space-y-4 max-w-2xl">
        {sortedPosts.map((post) => (
          <div key={post.id} className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow ${post.is_admin_post ? "border-primary/30" : "border-slate-100"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${post.is_admin_post ? "bg-primary text-white" : "bg-slate-100"}`}>
                {post.is_admin_post ? "🛡️" : "🎭"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[#1A1033]">{post.is_admin_post ? "TCUnnect Admin" : "Anonymous"}</p>
                  {post.is_admin_post && <span className="text-[10px] bg-primary-light text-primary font-bold px-2 py-0.5 rounded-full">Official</span>}
                  {post.dept_tag && <DeptBadge dept={post.dept_tag} />}
                </div>
                <p className="text-xs text-slate-400">{new Date(post.created_at).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-[#1A1033] mb-4 leading-relaxed">{post.text}</p>
            <div className="flex items-center gap-4 text-sm">
              <button onClick={() => upvote(post)} className={`flex items-center gap-1.5 font-semibold transition-colors ${voted[post.id] ? "text-primary" : "text-slate-400 hover:text-primary"}`}>
                👍 {post.upvotes}
              </button>
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 font-semibold text-slate-400 hover:text-primary transition-colors">
                💬 {post.comment_count} Comments
              </button>
              <button onClick={() => report(post)} className={isAdmin ? "text-slate-300 hover:text-like text-xs transition-colors" : "ml-auto text-slate-300 hover:text-like text-xs transition-colors"}>🚩 Report</button>
              {isAdmin && (
                <button onClick={() => handleAdminDeletePost(post.id)} className="ml-auto text-xs font-bold text-like hover:underline">Delete</button>
              )}
            </div>

            {expandedComments[post.id] && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {(comments[post.id] ?? []).filter((c) => !c.parent_comment_id).map((c) => (
                  <CommentThread
                    key={c.id}
                    comment={c}
                    allComments={comments[post.id] ?? []}
                    postId={post.id}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    onSubmitReply={submitComment}
                    onReport={(commentId) => setReportTarget({ type: "feed_comment", id: commentId, label: "this comment" })}
                    isAdmin={isAdmin}
                    onDelete={(commentId) => handleAdminDeleteComment(post.id, commentId)}
                    onViewProfile={(userId) => setViewingProfileId(userId)}
                  />
                ))}
                {(comments[post.id] ?? []).length === 0 && (
                  <p className="text-xs text-slate-400">No comments yet — be the first.</p>
                )}
                <div className="flex gap-2 pt-1">
                  <input
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                    placeholder="Add a comment…"
                    className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button onClick={() => submitComment(post.id)} className="text-primary font-bold text-sm px-3">Post</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onClose={() => setReportTarget(null)}
          onSubmitted={() => { setReportTarget(null); window.alert("Report submitted — our team will review it."); }}
        />
      )}

      {viewingProfileId && (
        <MiniProfileModal userId={viewingProfileId} onClose={() => setViewingProfileId(null)} />
      )}
    </div>
  );
}

/* ============================
   NOTIFICATIONS VIEW
   ============================ */
function NotificationsView() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyNotifications()
      .then(setItems)
      .catch((err) => setError(err?.message || "Failed to load notifications."))
      .finally(() => setLoading(false));
  }, []);

  async function open(n: NotificationRow) {
    if (n.is_read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    try {
      await markNotificationRead(n.id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  }

  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
  const today = items.filter((n) => isToday(n.created_at));
  const earlier = items.filter((n) => !isToday(n.created_at));

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-[#1A1033] font-display mb-8">Notifications</h1>
      {loading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-like font-medium">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-slate-400">No notifications yet — likes, matches, and messages will show up here.</p>
      )}
      <div className="max-w-2xl space-y-8">
        {[{ label: "Today", items: today }, { label: "Earlier", items: earlier }].map(({ label, items: group }) => group.length > 0 && (
          <div key={label}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
            <div className="space-y-2">
              {group.map((n) => (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-colors text-left ${!n.is_read ? "bg-primary-light border-primary/20" : "bg-white border-slate-100"}`}
                >
                  <div className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-xl flex-shrink-0 border border-slate-100">
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${!n.is_read ? "text-primary" : "text-[#1A1033]"}`}>{n.text}</p>
                    <p className="text-xs text-slate-300 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-2" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================
   PROFILE VIEW
   ============================ */
function ProfileView() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    getMyProfile()
      .then((p) => { setProfile(p); setBio(p.bio ?? ""); setName(p.name); })
      .catch((err) => setError(err?.message || "Failed to load your profile."))
      .finally(() => setLoading(false));
    getMyMatches().then((m) => setMatchCount(m.length)).catch(() => {});
    getMyProfileViewCount().then(setViewCount).catch(() => {});
  }, []);

  const nameCooldownUntil = profile?.name_changed_at
    ? new Date(new Date(profile.name_changed_at).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  const nameLocked = nameCooldownUntil !== null && nameCooldownUntil > new Date();

  async function handleSave() {
    setSaving(true);
    setNameError(null);
    try {
      const fields: Partial<Pick<MyProfile, "bio" | "name">> = { bio };
      if (name.trim() && name.trim() !== profile?.name) {
        fields.name = name.trim();
      }
      await updateMyProfile(fields);
      setProfile((p) => (p ? { ...p, bio, ...(fields.name ? { name: fields.name, name_changed_at: new Date().toISOString() } : {}) } : p));
      setEditing(false);
    } catch (err) {
      // The 7-day cooldown trigger raises a specific error — surface it
      // next to the name field instead of a generic save failure.
      setNameError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(file: File) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user || !profile) return;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${profile.id}/photo.${ext}`;
      const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
      await updateMyProfile({ photo_url: pub.publicUrl });
      setProfile((p) => (p ? { ...p, photo_url: pub.publicUrl } : p));
    } catch (err) {
      console.error("Photo upload failed:", err);
    }
  }

  if (loading) return <p className="text-center text-slate-400 py-24">Loading…</p>;
  if (error || !profile) return <p className="text-center text-like font-medium py-24">{error || "Profile not found."}</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-[#1A1033] font-display">My Profile</h1>
        <div className="flex gap-3">
          <button onClick={() => setEditing(!editing)} className="border-2 border-primary text-primary font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary-light transition-colors">
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="relative h-40 bg-gradient-to-r from-primary to-[#EC4899]">
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <img src={profile.photo_url || "https://placehold.co/200x200?text=%F0%9F%91%A4"} alt="Me" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              {editing && (
                <label className="absolute bottom-1 right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-sm text-xs cursor-pointer">
                  📷
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f); }} />
                </label>
              )}
            </div>
          </div>
        </div>
        <div className="pt-16 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editing ? (
                <div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={nameLocked}
                    className="text-2xl font-extrabold text-[#1A1033] font-display border-2 border-primary/30 rounded-xl px-3 py-1.5 w-full focus:outline-none focus:border-primary disabled:opacity-50 disabled:bg-slate-50"
                  />
                  {nameLocked ? (
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      You can change your name again on {nameCooldownUntil!.toLocaleDateString()} (once every 7 days).
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">You can change your name once every 7 days.</p>
                  )}
                  {nameError && <p className="text-xs text-like font-medium mt-1">{nameError}</p>}
                </div>
              ) : (
                <h2 className="text-2xl font-extrabold text-[#1A1033] font-display">{profile.name}</h2>
              )}
              <div className="flex items-center gap-2 mt-1">
                <DeptBadge dept={profile.dept} />
                <span className="text-sm text-slate-500">{profile.year_level} · {profile.program}</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                rows={3}
                className="w-full border-2 border-primary/30 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
              />
            ) : (
              <p className="text-sm text-[#1A1033]">"{profile.bio || "No bio yet."}"</p>
            )}
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => <InterestTag key={i} label={i} />)}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-[#F8F7FF] rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-primary">{viewCount}</p>
              <p className="text-xs text-slate-400 mt-0.5">Profile Views</p>
            </div>
            <div className="bg-[#F8F7FF] rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-match">{matchCount}</p>
              <p className="text-xs text-slate-400 mt-0.5">Matches</p>
            </div>
          </div>

          {editing && (
            <button onClick={handleSave} disabled={saving} className="w-full mt-6 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      <BlockedUsersCard />
    </div>
  );
}

function BlockedUsersCard() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getMyBlockedUsers().then(setBlocked).catch((err) => console.error("Failed to load blocked users:", err)).finally(() => setLoading(false));
  }, []);

  async function handleUnblock(b: BlockedUser) {
    setBlocked((prev) => prev.filter((x) => x.block_id !== b.block_id));
    try { await unblockUser(b.block_id); } catch (err) { console.error("Unblock failed:", err); }
  }

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
        <span className="text-xl w-8 text-center">🚫</span>
        <span className="flex-1 text-sm font-medium text-[#1A1033]">Blocked users {blocked.length > 0 && `(${blocked.length})`}</span>
        <svg className={`text-slate-300 transition-transform ${open ? "rotate-90" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      {open && (
        <div className="px-5 pb-4 divide-y divide-slate-50">
          {blocked.length === 0 && <p className="text-sm text-slate-400 py-3">No one blocked.</p>}
          {blocked.map((b) => (
            <div key={b.block_id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#1A1033]">{b.name}</p>
                <p className="text-xs text-slate-400">{b.dept} · blocked {new Date(b.blocked_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleUnblock(b)} className="text-xs font-bold text-primary hover:underline">Unblock</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================
   PREMIUM VIEW
   ============================ */
function PremiumView({ isPremium, onPurchase }: { isPremium: boolean; onPurchase: () => void }) {
  const [step, setStep] = useState<"intro" | "choose" | "qr" | "submit" | "pending">("intro");
  const [method, setMethod] = useState<"gcash" | "maya">("gcash");
  const [refNumber, setRefNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [scanStatus, setScanStatus] = useState<"scanning" | "found" | "failed" | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setScanStatus("scanning");
    setRefNumber("");
    setScanError(null);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-receipt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        }
      );

      const data = await response.json();
      console.log("scan-receipt response:", response.status, JSON.stringify(data));
      if (data.error) {
        setScanStatus("failed");
        setScanError(`Scan error: ${data.error}`);
        return;
      }
      const extracted = (data.referenceNumber ?? "NONE").trim();
      if (extracted && extracted !== "NONE" && extracted.length >= 6) {
        setRefNumber(extracted);
        setScanStatus("found");
      } else {
        setScanStatus("failed");
      }
    } catch (err) {
      setScanStatus("failed");
      setScanError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  useEffect(() => {
    getMyPaymentRequest().then((req) => {
      if (req?.status === "pending") setStep("pending");
    }).catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!refNumber.trim() || refNumber.trim().length < 6) {
      setError("Please enter a valid reference number (at least 6 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPaymentRequest(method, refNumber.trim());
      setStep("pending");
    } catch (err: any) {
      setError(err?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const qrImage = method === "gcash" ? "/gcash-qr.png" : "/maya-qr.png";
  const methodLabel = method === "gcash" ? "GCash" : "Maya";
  const methodColor = method === "gcash" ? "text-[#007AFF]" : "text-[#5BC236]";

  if (isPremium) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">⭐</div>
        <h2 className="text-3xl font-extrabold text-premium font-display">You're Premium!</h2>
        <p className="text-slate-500 mt-3">You have lifetime access to all premium features.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-premium/10 text-premium text-sm font-bold px-4 py-2 rounded-full mb-4">
          ⭐ TCUnnect Premium
        </div>
        <h1 className="text-4xl font-extrabold text-[#1A1033] font-display">See who's into you.</h1>
        <p className="text-5xl font-extrabold text-primary mt-3">₱30</p>
        <p className="text-slate-400">One-time · Lifetime access · No subscription</p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[["👀","See who liked you"],["🔍","See profile viewers"],["♾️","Unlimited access"],["⭐","Premium badge"]].map(([i,t]) => (
          <div key={t} className="bg-white rounded-2xl p-4 border border-slate-100 flex gap-3 items-center text-sm font-medium text-[#1A1033]">
            <span className="text-xl">{i}</span>{t}
          </div>
        ))}
      </div>

      {/* STEP: INTRO */}
      {step === "intro" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
          <div className="text-5xl mb-3">⭐</div>
          <h3 className="text-2xl font-extrabold text-[#1A1033] font-display mb-1">Unlock TCUnnect Premium</h3>
          <p className="text-slate-500 text-sm mb-4">One-time payment · Lifetime access</p>
          <p className="text-5xl font-extrabold text-primary mb-6">₱30</p>
          <div className="grid grid-cols-2 gap-3 mb-6 text-left">
            {[["👀","See who liked you"],["🔍","See profile viewers"],["♾️","Unlimited access"],["⭐","Premium badge"]].map(([i,t]) => (
              <div key={t} className="bg-slate-50 rounded-2xl p-3 flex gap-2 items-center text-sm font-medium text-[#1A1033]">
                <span className="text-lg">{i}</span>{t}
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep("choose")}
            className="w-full bg-primary text-white font-extrabold py-4 rounded-2xl hover:bg-primary-dark transition-colors text-lg"
          >
            Get Premium — ₱30
          </button>
        </div>
      )}

      {/* STEP: CHOOSE METHOD */}
      {step === "choose" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <button onClick={() => setStep("intro")} className="text-sm text-slate-400 hover:text-primary mb-4 block text-left">← Back</button>
          <h3 className="font-bold text-[#1A1033] mb-4">Choose payment method</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["gcash","maya"] as const).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`py-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all ${method === m ? "border-primary bg-primary-light text-primary" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                <span className="text-2xl">{m === "gcash" ? "💙" : "💚"}</span>
                {m === "gcash" ? "GCash" : "Maya"}
              </button>
            ))}
          </div>
          <button onClick={() => setStep("qr")}
            className="w-full bg-primary text-white font-extrabold py-4 rounded-2xl hover:bg-primary-dark transition-colors text-lg">
            Continue with {method === "gcash" ? "GCash" : "Maya"} →
          </button>
        </div>
      )}

      {/* STEP: SHOW QR */}
      {step === "qr" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className={`px-6 py-5 ${method === "gcash" ? "bg-[#007AFF]" : "bg-[#5BC236]"}`}>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wide mb-0.5">{methodLabel} Payment</p>
            <p className="text-xl font-extrabold text-white">Pay ₱30.00 via {methodLabel}</p>
            <p className="text-sm text-white/80 mt-1">Scan the QR code below and complete the payment.</p>
          </div>

          <div className="p-6">
            <button onClick={() => setStep("choose")} className="text-xs text-slate-400 hover:text-primary mb-5 block">← Back</button>

            <div className="flex justify-center mb-5">
              <img
                src={qrImage}
                alt={`${methodLabel} QR Code`}
                className="w-56 h-56 rounded-2xl border border-slate-200 object-contain bg-white"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/224x224?text=QR+Code"; }}
              />
            </div>

            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 mb-6">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-[#1A1033]">₱30.00</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-slate-500">Recipient</span>
                <span className="font-bold text-[#1A1033]">{method === "gcash" ? "KH*******Y A." : "KHEMBERLY ALAO"}</span>
              </div>
            </div>

            <button
              onClick={() => setStep("submit")}
              className="w-full bg-primary text-white font-extrabold py-4 rounded-2xl hover:bg-primary-dark transition-colors text-base"
            >
              ✓ Paid — Submit Receipt
            </button>
          </div>
        </div>
      )}

      {/* STEP: SUBMIT REFERENCE */}
      {step === "submit" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Payment Verification</p>
            <p className="text-xl font-extrabold text-[#1A1033]">Upload Payment Receipt</p>
          </div>

          {/* Full-panel scanning overlay — keeps the user on screen while we process */}
          {scanStatus === "scanning" && (
            <div className="absolute inset-0 bg-white/95 z-10 rounded-3xl flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-14 h-14 rounded-full border-4 border-primary-light border-t-primary animate-spin" />
              <div className="text-center">
                <p className="font-extrabold text-[#1A1033] text-lg">Scanning receipt…</p>
                <p className="text-sm text-slate-400 mt-1">Reading your payment details.</p>
                <p className="text-xs text-slate-300 mt-3">Please wait, do not close this screen.</p>
              </div>
            </div>
          )}

          <div className="p-6">
            <button onClick={() => setStep("qr")} className="text-xs text-slate-400 hover:text-primary mb-5 block">← Back</button>

            {/* Receipt upload */}
            <p className="text-sm text-slate-500 mb-3">Please upload a screenshot of your completed {methodLabel} payment.</p>

            {receiptFile ? (
              <div className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 mb-5 text-sm">
                <span className="truncate text-slate-600 text-xs">{receiptFile.name}</span>
                <button onClick={() => { setReceiptFile(null); setRefNumber(""); setScanStatus(null); setScanError(null); }} className="text-slate-400 hover:text-like text-xs font-bold ml-3 flex-shrink-0">Remove</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-4 mb-5 text-sm font-semibold text-slate-500 hover:border-primary hover:text-primary cursor-pointer transition-colors">
                📎 Upload Receipt
                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
              </label>
            )}

            {scanStatus === "found" && (
              <p className="text-xs text-match font-medium mb-4">✓ Reference number identified.</p>
            )}
            {scanStatus === "failed" && (
              <p className="text-xs text-like font-medium mb-4">
                {scanError ?? "Could not identify reference number — please enter it manually below."}
              </p>
            )}

            {/* Reference number */}
            <label className="block text-sm font-bold text-[#1A1033] mb-2">Reference / Transaction Number</label>
            <input
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="Reference number"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-base font-mono focus:outline-none focus:border-primary transition-colors mb-5"
            />

            {error && <p className="text-xs text-like font-medium mb-4">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || refNumber.trim().length < 6}
              className="w-full bg-primary text-white font-extrabold py-4 rounded-2xl hover:bg-primary-dark transition-colors disabled:opacity-40 text-base mb-4"
            >
              {submitting ? "Submitting…" : "Submit for Verification"}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Note: If the reference number cannot be identified from the receipt, please enter it manually.
            </p>
          </div>
        </div>
      )}

      {/* STEP: PENDING */}
      {step === "pending" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h3 className="text-xl font-extrabold text-[#1A1033] font-display mb-2">Payment under review</h3>
          <p className="text-sm text-slate-500">
            Your payment has been submitted. Our admin will verify it and activate your Premium access within 24 hours.
            You'll see a notification once it's approved.
          </p>
        </div>
      )}
    </div>
  );
}


/* ============================
   ADMIN VIEW
   ============================ */
/* ============================
   SETTINGS VIEW
   ============================ */
function SettingsView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteDetails, setDeleteDetails] = useState("");
  const [deleteSubmitted, setDeleteSubmitted] = useState(false);

  const deletionReasons = [
    "Found a match / no longer looking",
    "Privacy concerns",
    "Not using the app anymore",
    "Getting unwanted messages",
    "Safety concern with another user",
    "Other",
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user?.email) setEmail(data.user.email); });
  }, []);

  async function handleSubmitDeletionRequest() {
    if (!deleteReason) { window.alert("Please select a reason."); return; }
    setDeleting(true);
    try {
      await requestAccountDeletion(deleteReason, deleteDetails || undefined);
      setDeleteSubmitted(true);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to submit deletion request. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    if (!newEmail || newEmail === email) return;
    setEmailLoading(true);
    try {
      // Supabase sends a confirmation link to the NEW address — the email
      // doesn't actually change until that link is clicked.
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMsg({ type: "ok", text: `Confirmation link sent to ${newEmail}. Your email won't change until you click it.` });
      setNewEmail("");
    } catch (err) {
      setEmailMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to update email." });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 8) { setPasswordMsg({ type: "error", text: "New password must be at least 8 characters." }); return; }
    if (newPassword !== confirmNewPassword) { setPasswordMsg({ type: "error", text: "New passwords don't match." }); return; }

    setPasswordLoading(true);
    try {
      // Re-authenticate with the CURRENT password first — supabase-js's
      // updateUser() doesn't require this itself, but skipping it would let
      // anyone with an already-open session change the password without
      // proving they know the current one. Worth keeping as a safety check.
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (reauthError) throw new Error("Current password is incorrect.");

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: "ok", text: "Password updated." });
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to update password." });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold text-[#1A1033] font-display mb-8">Account Settings</h1>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-[#1A1033] mb-1">Change Email</h2>
        <p className="text-xs text-slate-400 mb-4">Current: {email || "…"}</p>
        <form onSubmit={handleChangeEmail} className="space-y-3">
          {emailMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${emailMsg.type === "ok" ? "bg-match-light text-match" : "bg-like-light text-like"}`}>{emailMsg.text}</div>
          )}
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email address"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
          <button type="submit" disabled={emailLoading || !newEmail} className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50">
            {emailLoading ? "Sending…" : "Update Email"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-[#1A1033] mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {passwordMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${passwordMsg.type === "ok" ? "bg-match-light text-match" : "bg-like-light text-like"}`}>{passwordMsg.text}</div>
          )}
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" minLength={8} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
          <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
          <button type="submit" disabled={passwordLoading} className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50">
            {passwordLoading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-like/20 shadow-sm p-6">
        <h2 className="font-bold text-like mb-1">Danger Zone</h2>
        <p className="text-sm text-slate-500 mb-4">
          Submitting this sends a request to our admin team along with your reason — nothing about
          your account changes until they review and approve it. You'll keep full access in the
          meantime.
        </p>
        <button
          onClick={() => { setShowDeleteModal(true); setDeleteSubmitted(false); setDeleteReason(""); setDeleteDetails(""); }}
          className="text-like font-bold text-sm border-2 border-like/30 px-5 py-2.5 rounded-xl hover:bg-like-light transition-colors"
        >
          Request Account Deletion
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 fade-in" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl slide-up" onClick={(e) => e.stopPropagation()}>
            {deleteSubmitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-match-light flex items-center justify-center text-3xl">✅</div>
                <h3 className="text-lg font-extrabold text-[#1A1033] mb-2">Request submitted</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Our admin team has been notified and will review your request. Your account stays
                  fully active until then.
                </p>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark">
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-extrabold text-[#1A1033] mb-1">Request Account Deletion</h3>
                <p className="text-sm text-slate-500 mb-4">Help us understand why — this goes to our admin team for review.</p>
                <div className="space-y-2 mb-4">
                  {deletionReasons.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="deleteReason" value={r} checked={deleteReason === r} onChange={() => setDeleteReason(r)} className="accent-like" />
                      {r}
                    </label>
                  ))}
                </div>
                <textarea
                  value={deleteDetails}
                  onChange={(e) => setDeleteDetails(e.target.value)}
                  placeholder="Anything else you'd like to share? (optional)"
                  rows={3}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-like mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
                  <button onClick={handleSubmitDeletionRequest} disabled={deleting || !deleteReason} className="flex-1 py-3 rounded-xl bg-like text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
                    {deleting ? "Submitting…" : "Submit Request"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminView() {
  const [adminTab, setAdminTab] = useState("dashboard");
  const [queue, setQueue] = useState<{
    id: string; name: string; dept: string; program: string;
    idPhoto: string; selfie: string; faceMatch: number | null;
    submitted: string; status: string;
  }[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const pendingCount = queue.filter((q) => q.status === "pending").length;

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setQueueLoading(true);
    setQueueError(null);
    try {
      // Only pending + recently-decided submissions, joined with the
      // applicant's basic info. RLS (003_row_level_security.sql) restricts
      // this to admins only — a non-admin calling this gets an empty result.
      const { data, error } = await supabase
        .from("verification_submissions")
        .select("id, user_id, status, face_match_score, submitted_at, id_document_url, selfie_url, users!verification_submissions_user_id_fkey(name, dept, program)")
        .order("submitted_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Keep only the MOST RECENT submission per user. Before the onboarding
      // idempotency fix, a retried submission could create more than one row
      // for the same person — without this, an old already-decided duplicate
      // could still show as "pending" here even after the real one was approved.
      const seenUsers = new Set<string>();
      const latestPerUser = (data ?? []).filter((row: any) => {
        if (seenUsers.has(row.user_id)) return false;
        seenUsers.add(row.user_id);
        return true;
      });

      const rows = await Promise.all(
        latestPerUser.map(async (row: any) => {
          // id_document_url / selfie_url are storage PATHS (private bucket),
          // not public URLs — generate a short-lived signed URL to display them.
          const [idSigned, selfieSigned] = await Promise.all([
            supabase.storage.from("verification-docs").createSignedUrl(row.id_document_url, 300),
            supabase.storage.from("verification-docs").createSignedUrl(row.selfie_url, 300),
          ]);
          return {
            id: row.id as string,
            name: row.users?.name ?? "Unknown",
            dept: row.users?.dept ?? "—",
            program: row.users?.program ?? "—",
            idPhoto: idSigned.data?.signedUrl ?? "",
            selfie: selfieSigned.data?.signedUrl ?? "",
            faceMatch: row.face_match_score as number | null,
            submitted: new Date(row.submitted_at).toLocaleString(),
            status: row.status as string,
          };
        })
      );
      setQueue(rows);
    } catch (err: any) {
      setQueueError(err?.message || "Failed to load verification queue.");
      console.error("Verification queue load failed:", err);
    } finally {
      setQueueLoading(false);
    }
  }

  async function decide(id: string, status: "approved" | "rejected") {
    const submission = queue.find((q) => q.id === id);
    // Optimistic UI update
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { error: subError } = await supabase
        .from("verification_submissions")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (subError) throw subError;

      if (status === "approved" && submission) {
        // Flip the user's own record so their VerificationPending screen
        // (once wired to read this) can redirect them into the app.
        const { data: sub } = await supabase
          .from("verification_submissions")
          .select("user_id")
          .eq("id", id)
          .single();
        if (sub) {
          await supabase
            .from("users")
            .update({ is_verified: true, verification_status: "approved" })
            .eq("id", sub.user_id);
        }
      }
    } catch (err) {
      // Revert optimistic update on failure
      setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: "pending" } : q)));
      setQueueError(err instanceof Error ? err.message : "Failed to save decision. Please try again.");
    }
  }

  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => { getAdminStats().then(setStats).catch((err) => console.error("Failed to load admin stats:", err)); }, []);

  const statCards = [
    { label: "Total Users", value: stats ? String(stats.totalUsers) : "…", icon: "👥", color: "text-primary" },
    { label: "Verified Users", value: stats ? String(stats.verifiedUsers) : "…", icon: "✅", color: "text-match" },
    { label: "New Signups (24h)", value: stats ? String(stats.newSignups24h) : "…", icon: "✨", color: "text-blue-500" },
    { label: "Pending Verifications", value: String(pendingCount), icon: "🪪", color: "text-amber-500" },
    { label: "Open Reports", value: stats ? String(stats.openReports) : "…", icon: "🚩", color: "text-like" },
    { label: "Premium Users", value: stats ? String(stats.premiumUsers) : "…", icon: "⭐", color: "text-premium" },
    { label: "Revenue", value: stats ? `₱${stats.revenuePhp.toLocaleString()}` : "…", icon: "💰", color: "text-match" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-[#1A1033] font-display">Admin Dashboard</h1>
        <span className="bg-like/10 text-like font-bold text-xs px-3 py-1.5 rounded-full">Admin</span>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-8 overflow-x-auto scrollbar-hide">
        {["dashboard", "verification", "deletions", "payments", "users", "reports", "posts"].map((t) => (
          <button key={t} onClick={() => setAdminTab(t)} className={`relative px-4 py-2.5 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-all ${adminTab === t ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t}
            {t === "verification" && pendingCount > 0 && (
              <span className="ml-1.5 bg-like text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full align-top">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {adminTab === "dashboard" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs text-match font-medium bg-match/10 px-2 py-1 rounded-full">↑ 12%</span>
                </div>
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Analytics mini-chart placeholder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-[#1A1033] mb-4">Daily Active Users</h3>
            <div className="flex items-end gap-2 h-24">
              {[60, 80, 55, 90, 70, 95, 85, 100, 78, 88, 92, 97, 84, 110].map((h, i) => (
                <div key={i} className="flex-1 bg-primary rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>14 days ago</span><span>Today</span>
            </div>
          </div>
        </>
      )}

      {adminTab === "verification" && (
        <div className="space-y-4">
          {queueLoading && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-400 py-16">
              <p className="font-medium">Loading verification queue…</p>
            </div>
          )}
          {queueError && (
            <div className="bg-like-light border border-like/30 rounded-xl px-4 py-3 text-sm text-like font-medium">
              {queueError}
            </div>
          )}
          {!queueLoading && queue.filter((q) => q.status === "pending").length === 0 && !queueError && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-400 py-16">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium">Queue is clear</p>
              <p className="text-sm mt-1">No pending verifications right now.</p>
            </div>
          )}
          {queue.map((q) => q.status === "pending" && (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-bold text-[#1A1033]">{q.name}</p>
                  <p className="text-xs text-slate-400">{q.dept} · {q.program} · submitted {q.submitted}</p>
                </div>
                {q.faceMatch !== null ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${q.faceMatch >= 80 ? "bg-match-light text-match" : q.faceMatch >= 65 ? "bg-amber-100 text-amber-700" : "bg-like-light text-like"}`}>
                    Face match: {q.faceMatch}%
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">
                    Face match: not yet scored
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">ID / COE</p>
                  <img src={q.idPhoto} alt="ID submission" className="w-full h-40 object-cover rounded-xl border border-slate-100" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Live selfie</p>
                  <img src={q.selfie} alt="Selfie submission" className="w-full h-40 object-cover rounded-xl border border-slate-100" />
                </div>
              </div>

              {q.faceMatch !== null && q.faceMatch < 65 && (
                <div className="bg-like-light border border-like/30 rounded-xl px-3 py-2 mb-4 text-xs text-like font-medium">
                  Low face-match score — review carefully before approving.
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => decide(q.id, "approved")}
                  className="flex-1 py-2.5 rounded-xl bg-match text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => decide(q.id, "rejected")}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:border-like hover:text-like transition-colors"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}

          {queue.some((q) => q.status !== "pending") && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Recently decided</p>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                {queue.filter((q) => q.status !== "pending").map((q) => (
                  <div key={q.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium text-slate-600">{q.name}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${q.status === "approved" ? "bg-match-light text-match" : "bg-like-light text-like"}`}>
                      {q.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {adminTab === "reports" && <AdminReportsTab />}

      {adminTab === "users" && <AdminUsersTab />}

      {adminTab === "deletions" && <AdminDeletionsTab />}

      {adminTab === "payments" && <AdminPaymentsTab />}

      {adminTab === "posts" && <AdminPostsTab />}
    </div>
  );
}

/* ============================
   ADMIN: REPORTS TAB
   ============================ */
function AdminReportsTab() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setReports(await getReports());
    } catch (err: any) {
      setError(err?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss(r: AdminReport) {
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "dismissed" } : x)));
    try {
      await resolveReport(r.id, "dismissed");
      await notifyReporter(r.id, `Hi! We reviewed your report about "${r.reason}" — after looking into it, we didn't find a violation of our Terms, so no action was taken. Thanks for helping keep TCUnnect safe. Feel free to reply if you have more details to share.`);
    } catch (err) { console.error(err); load(); }
  }

  async function handleBan(r: AdminReport) {
    if (r.target_type !== "user") {
      window.alert("Banning is only wired up for user reports right now — this is a " + r.target_type + " report.");
      return;
    }
    if (!window.confirm("Ban this user? This is more severe than a suspension — it's indefinite.")) return;
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "actioned" } : x)));
    try {
      await banReportedUser(r.target_id, r.reason);
      await resolveReport(r.id, "actioned");
      await notifyReporter(r.id, `Hi! We reviewed your report about "${r.reason}" — the account has been banned from TCUnnect. Thanks for the report, it helps keep the community safe. Feel free to reply if you want to add anything.`);
    } catch (err) {
      console.error(err);
      load();
    }
  }

  async function handleSuspend(r: AdminReport) {
    if (r.target_type !== "user") {
      window.alert("Suspending is only for user reports — this is a " + r.target_type + " report.");
      return;
    }
    const daysStr = window.prompt("Suspend for how many days?", "7");
    if (!daysStr) return;
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days <= 0) { window.alert("Enter a valid number of days."); return; }
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "actioned" } : x)));
    try {
      await suspendUser(r.target_id, days);
      await resolveReport(r.id, "actioned");
      await notifyReporter(r.id, `Hi! We reviewed your report about "${r.reason}" — the account has been suspended for ${days} day${days === 1 ? "" : "s"}. Thanks for the report. Feel free to reply if you want to add anything.`);
    } catch (err) {
      console.error(err);
      load();
    }
  }

  async function handleRemovePost(r: AdminReport) {
    if (r.target_type !== "feed_post") return;
    if (!window.confirm("Remove this reported post from the feed?")) return;
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "actioned" } : x)));
    try {
      await setFeedPostRemoved(r.target_id, true);
      await resolveReport(r.id, "actioned");
      await notifyReporter(r.id, `Hi! We reviewed your report about "${r.reason}" — the post has been removed from the feed. Thanks for flagging it. Feel free to reply if you want to add anything.`);
    } catch (err) {
      console.error(err);
      load();
    }
  }

  async function handleDelete(r: AdminReport) {
    if (r.target_type === "user") {
      window.alert("A reported user account can't be permanently deleted from here — that needs elevated access this app doesn't have client-side. Use Ban instead, which is fully enforced.");
      return;
    }
    if (!window.confirm(`Permanently delete this ${r.target_type.replace("_", " ")}? This can't be undone. The report record itself will stay as an audit trail, marked resolved.`)) return;
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "actioned" } : x)));
    try {
      await deleteReportedContent(r.target_type, r.target_id);
      await resolveReport(r.id, "actioned");
      await notifyReporter(r.id, `Hi! We reviewed your report about "${r.reason}" — the ${r.target_type.replace("_", " ")} has been permanently deleted. Thanks for flagging it. Feel free to reply if you want to add anything.`);
    } catch (err) {
      console.error(err);
      load();
    }
  }

  async function handleClearRecord(r: AdminReport) {
    if (!window.confirm("Remove this report record from the list? (The reported content/account itself is untouched — this just clears old paperwork.)")) return;
    setReports((prev) => prev.filter((x) => x.id !== r.id));
    try { await deleteReport(r.id); } catch (err) { console.error(err); load(); }
  }

  if (loading) return <p className="text-center text-slate-400 py-16">Loading reports…</p>;
  if (error) return <p className="text-center text-like font-medium py-16">{error}</p>;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F8F7FF]">
            <tr>
              {["Type", "Reported Content", "Reason", "Reporter", "Date", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-4 font-bold text-slate-400 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {reports.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-400 py-12">No reports filed.</td></tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors align-top">
                <td className="px-5 py-4 font-medium capitalize">{r.target_type.replace("_", " ")}</td>
                <td className="px-5 py-4 text-slate-600 max-w-xs">
                  <p className="line-clamp-2">{r.preview}</p>
                  {r.screenshot_url && (
                    <a href={r.screenshot_url} target="_blank" rel="noreferrer" className="inline-block mt-1.5">
                      <img src={r.screenshot_url} alt="Reporter's screenshot" className="w-16 h-16 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity" />
                    </a>
                  )}
                </td>
                <td className="px-5 py-4 text-slate-600">{r.reason}</td>
                <td className="px-5 py-4 text-slate-600">{r.reporter_name ?? "—"}</td>
                <td className="px-5 py-4 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.status === "open" ? "bg-amber-100 text-amber-700" : r.status === "actioned" ? "bg-like-light text-like" : "bg-slate-100 text-slate-500"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {r.status === "open" ? (
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => handleDismiss(r)} className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors">Dismiss</button>
                      {r.target_type === "user" && (
                        <>
                          <button onClick={() => handleSuspend(r)} className="text-xs px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">Suspend</button>
                          <button onClick={() => handleBan(r)} className="text-xs px-2.5 py-1 rounded-lg border border-like/30 text-like hover:bg-like-light transition-colors">Ban</button>
                        </>
                      )}
                      {r.target_type === "feed_post" && (
                        <button onClick={() => handleRemovePost(r)} className="text-xs px-2.5 py-1 rounded-lg border border-like/30 text-like hover:bg-like-light transition-colors">Remove Post</button>
                      )}
                      <button onClick={() => handleDelete(r)} className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-400 hover:border-like hover:text-like transition-colors">Delete</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300">Resolved</span>
                      <button onClick={() => handleClearRecord(r)} className="text-xs px-2 py-1 rounded-lg text-slate-300 hover:text-like transition-colors">Clear Record</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================
   ADMIN: USERS TAB
   ============================ */
function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    getAllUsers().then(setUsers).catch((err) => setError(err?.message || "Failed to load users.")).finally(() => setLoading(false));
    // Needed to block self-ban/self-suspend below — with the single-admin
    // constraint (016_single_admin_constraint.sql), locking yourself out
    // would lock EVERYONE out of the admin panel, with no other account
    // able to undo it. Worth preventing outright rather than just warning.
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: me } = await supabase.from("users").select("id").eq("auth_id", data.user.id).single();
      if (me) setMyUserId(me.id);
    });
  }, []);

  async function toggleBan(u: AdminUser) {
    if (u.id === myUserId) { window.alert("You can't ban your own admin account — that would lock everyone out of the admin panel."); return; }
    const next = !u.is_banned;
    if (next && !window.confirm(`Ban ${u.name}? This is more severe than a suspension — it's indefinite.`)) return;
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_banned: next } : x)));
    try { await setUserBanned(u.id, next); } catch (err) { console.error(err); }
  }

  async function handleSuspend(u: AdminUser) {
    if (u.id === myUserId) { window.alert("You can't suspend your own admin account — that would lock everyone out of the admin panel."); return; }
    const daysStr = window.prompt(`Suspend ${u.name} for how many days?`, "7");
    if (!daysStr) return;
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days <= 0) { window.alert("Enter a valid number of days."); return; }
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_suspended_until: until } : x)));
    try { await suspendUser(u.id, days); } catch (err) { console.error(err); }
  }

  async function handleUnsuspend(u: AdminUser) {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_suspended_until: null } : x)));
    try { await unsuspendUser(u.id); } catch (err) { console.error(err); }
  }

  function statusOf(u: AdminUser): "deleted" | "banned" | "suspended" | "active" {
    if (u.deletion_requested_at) return "deleted";
    if (u.is_banned) return "banned";
    if (u.is_suspended_until && new Date(u.is_suspended_until) > new Date()) return "suspended";
    return "active";
  }

  if (loading) return <p className="text-center text-slate-400 py-16">Loading users…</p>;
  if (error) return <p className="text-center text-like font-medium py-16">{error}</p>;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F8F7FF]">
            <tr>
              {["Name", "Email", "Dept", "Verified", "Premium", "Joined", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-4 font-bold text-slate-400 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => {
              const status = statusOf(u);
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium">{u.name} {u.id === myUserId && <span className="text-xs text-primary font-bold">(You)</span>}</td>
                  <td className="px-5 py-4 text-slate-500">{u.email}</td>
                  <td className="px-5 py-4"><DeptBadge dept={u.dept} /></td>
                  <td className="px-5 py-4">{u.is_verified ? "✅" : "⏳"}</td>
                  <td className="px-5 py-4">{u.is_premium ? "⭐" : "—"}</td>
                  <td className="px-5 py-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status === "deleted" ? "bg-slate-200 text-slate-600" : status === "banned" ? "bg-like-light text-like" : status === "suspended" ? "bg-amber-100 text-amber-700" : "bg-match-light text-match"}`}>
                      {status === "deleted" ? "Deleted" : status === "banned" ? "Banned" : status === "suspended" ? `Suspended until ${new Date(u.is_suspended_until!).toLocaleDateString()}` : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.id === myUserId || status === "deleted" ? (
                      <span className="text-xs text-slate-300">—</span>
                    ) : (
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleBan(u)} className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${u.is_banned ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "border border-like/30 text-like hover:bg-like-light"}`}>
                        {u.is_banned ? "Unban" : "Ban"}
                      </button>
                      {status === "suspended" ? (
                        <button onClick={() => handleUnsuspend(u)} className="text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-200 text-slate-500 hover:bg-slate-50">Unsuspend</button>
                      ) : (
                        <button onClick={() => handleSuspend(u)} disabled={u.is_banned} className="text-xs px-2.5 py-1 rounded-lg font-bold border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-40">Suspend</button>
                      )}
                    </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================
   ADMIN: POSTS TAB
   ============================ */
function AdminDeletionsTab() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRequests(await getDeletionRequests());
    } catch (err: any) {
      setError(err?.message || "Failed to load deletion requests.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(r: DeletionRequest) {
    if (!window.confirm(`Approve deletion for ${r.user_name}? This permanently purges their data and blocks the account from logging in again.`)) return;
    setBusyId(r.id);
    try {
      await adminApproveDeletion(r.id);
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "approved" } : x)));
    } catch (err: any) {
      window.alert(err?.message || "Failed to approve deletion.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeny(r: DeletionRequest) {
    setBusyId(r.id);
    try {
      await adminDenyDeletion(r.id);
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "denied" } : x)));
    } catch (err: any) {
      window.alert(err?.message || "Failed to deny request.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-center text-slate-400 py-16">Loading deletion requests…</p>;
  if (error) return <p className="text-center text-like font-medium py-16">{error}</p>;

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-4">
      {pending.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-400 py-16">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-medium">No pending deletion requests.</p>
        </div>
      )}
      {pending.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-bold text-[#1A1033]">{r.user_name}</p>
              <p className="text-xs text-slate-400">{r.user_email} · requested {new Date(r.created_at).toLocaleString()}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Pending</span>
          </div>
          <p className="text-sm text-[#1A1033] mb-1"><span className="font-semibold">Reason:</span> {r.reason}</p>
          {r.details && <p className="text-sm text-slate-500 mb-3">"{r.details}"</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={() => handleApprove(r)} disabled={busyId === r.id} className="flex-1 py-2.5 rounded-xl bg-like text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
              {busyId === r.id ? "Working…" : "Approve & Delete Data"}
            </button>
            <button onClick={() => handleDeny(r)} disabled={busyId === r.id} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50">
              Deny
            </button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Resolved</p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-medium text-slate-600">{r.user_name} — {r.reason}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.status === "approved" ? "bg-like-light text-like" : "bg-slate-100 text-slate-500"}`}>
                  {r.status === "approved" ? "Approved" : "Denied"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPaymentsTab() {
  const [requests, setRequests] = useState<PremiumPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setRequests(await getPaymentRequests()); }
    catch (err: any) { window.alert(err?.message || "Failed to load payments."); }
    finally { setLoading(false); }
  }

  async function handleApprove(r: PremiumPaymentRequest) {
    if (!window.confirm(`Approve ₱${r.amount} ${r.payment_method.toUpperCase()} payment from ${r.user_name}?\nRef: ${r.reference_number}\n\nThis will activate their Premium immediately.`)) return;
    setBusyId(r.id);
    try {
      await adminApprovePayment(r.id);
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "approved" } : x)));
    } catch (err: any) { window.alert(err?.message || "Failed to approve."); }
    finally { setBusyId(null); }
  }

  async function handleReject(r: PremiumPaymentRequest) {
    const note = window.prompt("Optional: reason for rejection (student will not see this, for your records only)");
    if (note === null) return; // cancelled
    setBusyId(r.id);
    try {
      await adminRejectPayment(r.id, note || undefined);
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "rejected" } : x)));
    } catch (err: any) { window.alert(err?.message || "Failed to reject."); }
    finally { setBusyId(null); }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  if (loading) return <p className="text-center text-slate-400 py-16">Loading payment requests…</p>;

  return (
    <div className="space-y-4">
      <div className="bg-[#F8F7FF] rounded-2xl p-4 text-sm text-slate-600 border border-primary/10">
        <p className="font-bold text-primary mb-1">💰 How to verify payments</p>
        <p>Open GCash or Maya → tap <strong>Transactions</strong> → search the reference number. If the amount is ₱30 and the status is Successful, approve it. If not, reject it.</p>
      </div>

      {pending.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-medium">No pending payment requests.</p>
        </div>
      )}

      {pending.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border border-primary/20 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-bold text-[#1A1033]">{r.user_name}</p>
              <p className="text-xs text-slate-400">{r.user_email}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">Pending</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">Method</p>
              <p className="font-bold text-[#1A1033]">{r.payment_method === "gcash" ? "💙 GCash" : "💚 Maya"}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">Amount</p>
              <p className="font-bold text-[#1A1033]">₱{r.amount}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 col-span-2">
              <p className="text-xs text-slate-400 mb-0.5">Reference Number</p>
              <p className="font-bold text-primary font-mono text-lg">{r.reference_number}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-3">Submitted {new Date(r.created_at).toLocaleString()}</p>
          <div className="flex gap-2">
            <button onClick={() => handleApprove(r)} disabled={busyId === r.id}
              className="flex-1 py-2.5 rounded-xl bg-match text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
              {busyId === r.id ? "Working…" : "✅ Approve Premium"}
            </button>
            <button onClick={() => handleReject(r)} disabled={busyId === r.id}
              className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50">
              ❌ Reject
            </button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Resolved</p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-600 truncate">{r.user_name} — {r.payment_method === "gcash" ? "GCash" : "Maya"} #{r.reference_number}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${r.status === "approved" ? "bg-match-light text-match" : "bg-slate-100 text-slate-500"}`}>
                  {r.status === "approved" ? "Approved" : "Rejected"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPostsTab() {
  const [posts, setPosts] = useState<AdminFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllFeedPostsAdmin().then(setPosts).catch((err) => setError(err?.message || "Failed to load posts.")).finally(() => setLoading(false));
  }, []);

  async function toggleRemoved(p: AdminFeedPost) {
    const next = !p.is_removed;
    setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_removed: next } : x)));
    try { await setFeedPostRemoved(p.id, next); } catch (err) { console.error(err); }
  }

  async function handleDelete(p: AdminFeedPost) {
    if (!window.confirm("Permanently delete this post? This can't be undone — comments and votes on it go too.")) return;
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
    try { await deleteFeedPostAdmin(p.id); } catch (err) { console.error(err); }
  }

  if (loading) return <p className="text-center text-slate-400 py-16">Loading posts…</p>;
  if (error) return <p className="text-center text-like font-medium py-16">{error}</p>;

  return (
    <div className="space-y-3">
      {posts.length === 0 && <p className="text-center text-slate-400 py-16">No posts yet.</p>}
      {posts.map((p) => (
        <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 ${p.is_removed ? "border-like/30 opacity-60" : "border-slate-100"}`}>
          <div className="flex-1">
            <p className="text-sm text-[#1A1033]">{p.text}</p>
            <p className="text-xs text-slate-400 mt-1">👍 {p.upvotes} · {new Date(p.created_at).toLocaleString()} {p.is_removed && "· HIDDEN"}</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => toggleRemoved(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${p.is_removed ? "bg-match-light text-match" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
            >
              {p.is_removed ? "Restore" : "Hide"}
            </button>
            <button
              onClick={() => handleDelete(p)}
              className="text-xs px-3 py-1.5 rounded-lg font-bold whitespace-nowrap bg-like-light text-like hover:bg-like/20 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================
   MATCH OVERLAY
   ============================ */
function MatchOverlay({ student, myPhoto, onClose, onMessage }: { student: Student; myPhoto?: string | null; onClose: () => void; onMessage: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#1A1033]/80 z-50 flex items-center justify-center p-4 fade-in">
      <div className="text-center match-pop">
        <div className="text-5xl mb-2">🎉</div>
        <h2 className="text-4xl font-extrabold text-white font-display mb-2">It's a Match!</h2>
        <p className="text-white/70 mb-8">You both liked each other.</p>
        <div className="flex items-center justify-center gap-4 mb-10">
          <img src={myPhoto || "https://placehold.co/200x200?text=%F0%9F%91%A4"} alt="You" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-2xl" />
          <div className="text-3xl sparkle">❤️</div>
          <img src={student.photo} alt={student.name} className="w-24 h-24 rounded-full object-cover border-4 border-like shadow-2xl" />
        </div>
        <p className="text-white/70 mb-6">You matched with <span className="text-white font-bold">{student.name}</span></p>
        <div className="flex gap-4 justify-center">
          <button onClick={onMessage} className="bg-primary text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-primary-dark transition-colors">
            Start Chatting 💬
          </button>
          <button onClick={onClose} className="bg-white/10 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-white/20 transition-colors">
            Keep Discovering
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================
   MAIN DASHBOARD
   ============================ */
export default function Dashboard({ initialView, onNavigate }: Props) {
  const [view, setView] = useState<View>(initialView);
  const [isPremium, setIsPremium] = useState(false);
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [myFirstName, setMyFirstName] = useState("");

  useEffect(() => {
    getMyProfile().then((p) => {
      setMyPhoto(p.photo_url);
      setMyFirstName(p.name.split(" ")[0] + (p.name.split(" ")[1] ? ` ${p.name.split(" ")[1][0]}.` : ""));
    }).catch(() => {});
    // Load the REAL premium status from the database — this used to always
    // start false regardless of the actual users.is_premium column, so an
    // admin (or anyone else genuinely premium) would still see "Get
    // Premium" prompts everywhere despite already having access.
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: me } = await supabase.from("users").select("is_premium").eq("auth_id", data.user.id).single();
      if (me) setIsPremium(!!me.is_premium);
    });
  }, []);

  useEffect(() => {
    let notifChannel: ReturnType<typeof supabase.channel> | null = null;
    let statusChannel: ReturnType<typeof supabase.channel> | null = null;
    let matchChannel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: me } = await supabase.from("users").select("id, is_admin").eq("auth_id", authData.user.id).single();
      if (!me) return;
      setIsAdmin(!!me.is_admin); // controls whether the Admin nav link even renders below

      refreshUnread();
      // Live badge updates the instant a like/match/message trigger fires a
      // new notification row — no need to refresh the page to see it.
      notifChannel = supabase
        .channel(`notifications-badge:${me.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${me.id}` }, () => refreshUnread())
        .subscribe();

      // Kick the person out the INSTANT an admin bans or suspends them —
      // without this, only a fresh login would ever catch it (see Auth.tsx),
      // meaning an already-open session could keep using the app freely.
      statusChannel = supabase
        .channel(`account-status:${me.id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users", filter: `id=eq.${me.id}` }, async (payload) => {
          const row = payload.new as { is_banned: boolean; is_suspended_until: string | null; deletion_requested_at: string | null };
          const suspendedNow = row.is_suspended_until && new Date(row.is_suspended_until) > new Date();
          if (row.deletion_requested_at) {
            await supabase.auth.signOut();
            window.alert("This account has been deleted.");
            onNavigate("landing");
          } else if (row.is_banned || suspendedNow) {
            await supabase.auth.signOut();
            window.alert(row.is_banned ? "Your account has been banned." : `Your account is suspended until ${new Date(row.is_suspended_until!).toLocaleString()}.`);
            onNavigate("landing");
          }
        })
        .subscribe();

      // Shows the "It's a Match!" popup for BOTH people, not just whoever
      // happened to complete the mutual like — relying on RLS (matches
      // SELECT policy) to only deliver rows this account can actually see,
      // so no extra filter is needed here.
      matchChannel = supabase
        .channel(`matches-popup:${me.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, async (payload) => {
          const row = payload.new as { id: string; user_a: string; user_b: string };
          const otherId = row.user_a === me.id ? row.user_b : row.user_a;
          try {
            const { data: other } = await supabase
              .from("users")
              .select("name, dept, year_level, program, bio, interests, photo_url")
              .eq("id", otherId)
              .single();
            if (other) {
              setMatchedStudent({
                id: 0,
                name: other.name, dept: other.dept, year: other.year_level,
                program: other.program, bio: other.bio, interests: other.interests,
                sharedInterests: [], photo: other.photo_url,
                online: false, views: 0,
              } as unknown as Student);
            }
          } catch (err) {
            console.error("Failed to load match popup info:", err);
          }
        })
        .subscribe();
    })();
    return () => {
      if (notifChannel) supabase.removeChannel(notifChannel);
      if (statusChannel) supabase.removeChannel(statusChannel);
      if (matchChannel) supabase.removeChannel(matchChannel);
    };
  }, []);

  // Also refresh right after leaving the Notifications page, since opening
  // a notification there marks it read and should drop the badge count.
  useEffect(() => { refreshUnread(); }, [view]);

  async function refreshUnread() {
    // RLS already restricts this to the caller's own rows.
    const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", false);
    setUnreadNotifs(count ?? 0);
  }

  function navigate(v: string) {
    if (v === "landing") { onNavigate("landing"); return; }
    setView(v as View);
  }

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden font-display">
      {/* Match Overlay */}
      {matchedStudent && (
        <MatchOverlay
          student={matchedStudent}
          myPhoto={myPhoto}
          onClose={() => setMatchedStudent(null)}
          onMessage={() => { setMatchedStudent(null); setView("messages"); }}
        />
      )}

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-100 flex-shrink-0 shadow-sm">
        <div className="p-5 pb-4 border-b border-slate-50">
          <Logo />
          <p className="text-xs text-slate-400 mt-1 ml-1">Meet. Match. Connect.</p>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto scrollbar-hide space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left relative ${
                view === item.id
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#1A1033]"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "notifications" && unreadNotifs > 0 && (
                <span className={`ml-auto text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${view === item.id ? "bg-white text-primary" : "bg-like text-white"}`}>
                  {unreadNotifs}
                </span>
              )}
            </button>
          ))}
          {isAdmin && (
          <button
            onClick={() => navigate("admin")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left ${view === "admin" ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <span className="text-base w-5 text-center">🛡️</span>
            Admin
          </button>
          )}
        </nav>

        <div className="p-3 border-t border-slate-50 space-y-1">
          <button
            onClick={() => navigate("settings")}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors text-left ${view === "settings" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            <span className="text-base w-5 text-center">⚙️</span> Settings
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); onNavigate("landing"); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-50 hover:text-like transition-colors text-left"
          >
            <span className="text-base w-5 text-center">🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="relative flex-1 max-w-xs">
            <input
              className="w-full bg-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Search students..."
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView("notifications")} className="relative w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-primary-light transition-colors">
              🔔
              {unreadNotifs > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-like text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotifs}</span>}
            </button>
            <button onClick={() => setView("profile")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={myPhoto || "https://placehold.co/100x100?text=%F0%9F%91%A4"} alt="Me" className="w-9 h-9 rounded-full object-cover border-2 border-primary/20" />
              <span className="text-sm font-semibold text-[#1A1033] hidden md:block">{myFirstName || "…"}</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-hide">
          {view === "discover" && <DiscoverView onMatch={setMatchedStudent} />}
          {view === "likes" && <LikesView isPremium={isPremium} onNavigate={navigate} />}
          {view === "matches" && <MatchesView onNavigate={navigate} />}
          {view === "messages" && <MessagesView />}
          {view === "feed" && <FeedView />}
          {view === "notifications" && <NotificationsView />}
          {view === "profile" && <ProfileView />}
          {view === "premium" && <PremiumView isPremium={isPremium} onPurchase={() => setIsPremium(true)} />}
          {view === "admin" && (isAdmin ? <AdminView /> : (
            <div className="text-center py-24">
              <div className="text-4xl mb-3">🔒</div>
              <p className="font-medium text-slate-400">You don't have access to this page.</p>
            </div>
          ))}
          {view === "settings" && <SettingsView onNavigate={navigate} />}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex bg-white border-t border-slate-100 fixed bottom-0 left-0 right-0 z-40">
          {[
            { id: "discover", icon: "🔍", label: "Discover" },
            { id: "likes", icon: "❤️", label: "Likes" },
            { id: "matches", icon: "🎉", label: "Matches" },
            { id: "feed", icon: "📰", label: "Feed" },
            { id: "profile", icon: "👤", label: "Profile" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-semibold transition-colors ${view === item.id ? "text-primary" : "text-slate-400"}`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
