import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore, createNotification } from "../stores";
import { MapPin, MessageCircle, ChevronUp, Plus, X, Loader2, Image, Share2, Send, CornerDownRight, Flag, MoreHorizontal, Heart, MessageSquare, Crown } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  replies?: Comment[];
}

interface Post {
  id: string;
  user_id?: string | null;
  content: string;
  location: string;
  upvotes: number;
  comment_count: number;
  image_url?: string | null;
  created_at: string;
  upvoted?: boolean;
  author_name?: string | null;
  author_avatar?: string | null;
  reveal_identity?: boolean;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Report Post Modal ────────────────────────────────────────────────────────
const POST_REPORT_REASONS = [
  "Spam",
  "Harassment or bullying",
  "Inappropriate content",
  "Hate or abusive content",
  "Scam or misleading content",
  "Other",
];

function ReportPostModal({ postId, reporterId, onClose }: {
  postId: string; reporterId: string; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason || !isSupabaseConfigured) return;
    setSubmitting(true);
    setSubmitError(null);
    // reported_post_id added by migration 22 — omit if column doesn't exist yet
    const payload: Record<string, unknown> = {
      reported_by: reporterId,
      reported_item_type: "post",
      reported_item_id: postId,
      reason,
      status: "pending",
    };
    // try with reported_post_id; retry without if that column doesn't exist yet
    let { error: insertErr } = await supabase.from("reports").insert({ ...payload, reported_post_id: postId });
    if (insertErr && insertErr.message.includes("reported_post_id")) {
      const retry = await supabase.from("reports").insert(payload);
      insertErr = retry.error;
    }
    if (insertErr) {
      console.error("[Report Post] insert failed:", insertErr);
      setSubmitError(insertErr.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Flag className="h-4 w-4 text-rose-500" /> Report this post
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        {done ? (
          <div className="p-6 text-center">
            <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="font-semibold text-slate-900 mb-1">Report Submitted</p>
            <p className="text-xs text-slate-500 mb-4">Our moderation team will review this post.</p>
            <button onClick={onClose} className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm">Done</button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500">Why are you reporting this?</p>
            <div className="space-y-1.5">
              {POST_REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition ${
                    reason === r ? "border-rose-400 bg-rose-50 text-rose-700 font-medium" : "border-slate-200 text-slate-600 hover:border-rose-200"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            {submitError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700">
                <strong>Submit failed:</strong> {submitError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
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

// ─── Mystery Avatar keyframe (injected once) ──────────────────────────────────
const MYSTERY_STYLE = `
@keyframes tcMystery {
  0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  50%      { box-shadow: 0 0 0 6px rgba(99,102,241,0.25), 0 0 12px 2px rgba(139,92,246,0.18); }
}
.tc-mystery-pulse { animation: tcMystery 2.4s ease-in-out infinite; }
`;

// ─── Plus upgrade modal (anonymous poster) ────────────────────────────────────
function AnonymousPlusModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-center relative overflow-hidden">
          {/* Decorative rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-32 w-32 rounded-full border-2 border-white/10" />
            <div className="absolute h-48 w-48 rounded-full border border-white/5" />
          </div>
          <div className="relative h-16 w-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center tc-mystery-pulse">
            <span className="text-3xl font-black text-white select-none">?</span>
          </div>
          <h2 className="text-white font-bold text-lg relative">Posted Anonymously</h2>
          <p className="text-white/80 text-sm mt-1 relative">This traveler chose to stay private</p>
        </div>
        <div className="p-5">
          <p className="text-slate-700 text-sm text-center mb-4">
            Upgrade to <span className="font-bold text-indigo-600">TCUnnect Plus</span> to reveal <span className="font-semibold">your own identity</span> on your community posts — let fellow travelers know it was you.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-center mb-4">
            <p className="text-2xl font-bold text-indigo-700">₱30</p>
            <p className="text-xs text-indigo-600 font-medium">Lifetime · Founding Explorer</p>
          </div>
          <button
            onClick={() => { onClose(); navigate("/plans"); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition mb-2"
          >
            <Crown className="inline h-4 w-4 mr-1.5 -mt-0.5" />
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

// ─── Author Row ───────────────────────────────────────────────────────────────
function AuthorRow({ post, currentUserId, currentUserIsPremium }: {
  post: Post;
  currentUserId?: string;
  currentUserIsPremium?: boolean;
}) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isOwn = !!(currentUserId && post.user_id && currentUserId === post.user_id);
  const hasAuthor = !!(post.user_id && post.author_name);
  // Identity is revealed only when the POSTER explicitly chose to reveal it (Plus feature)
  // Own posts always show your own identity regardless of reveal choice
  const showRealIdentity = (!!post.reveal_identity && hasAuthor) || isOwn;
  const isAnonymous = !showRealIdentity;

  const initials = post.author_name
    ? post.author_name.trim().split(/\s+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  async function handleLike() {
    if (!currentUserId || !post.user_id || isOwn || liking) return;
    setLiking(true);
    if (isSupabaseConfigured) {
      await supabase.from("likes").upsert(
        { user_id: currentUserId, liked_user_id: post.user_id },
        { onConflict: "user_id,liked_user_id", ignoreDuplicates: true }
      );
    }
    setLiked(true);
    setLiking(false);
  }

  async function handleMessage() {
    if (!currentUserId || !post.user_id || isOwn) return;
    if (!isSupabaseConfigured) return;
    const ids = [currentUserId, post.user_id].sort();
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .contains("participant_ids", ids)
      .limit(1)
      .single();
    if (existing?.id) { navigate(`/chat/${existing.id}`); return; }
    const { data: created } = await supabase
      .from("conversations")
      .insert({ participant_ids: ids })
      .select("id")
      .single();
    if (created?.id) navigate(`/chat/${created.id}`);
  }

  function handleMysteryClick() {
    // Show the modal for everyone — for free users it's an upgrade pitch,
    // for Plus users it explains the poster chose to stay anonymous
    setShowUpgrade(true);
  }

  return (
    <>
      {/* Inject keyframe once */}
      <style>{MYSTERY_STYLE}</style>

      <div className="flex items-center gap-2 mb-3">
        {/* Avatar */}
        {isAnonymous ? (
          <button
            onClick={handleMysteryClick}
            title={currentUserIsPremium ? "Anonymous traveler" : "Unlock with Plus"}
            className="h-9 w-9 rounded-full shrink-0 bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-black tc-mystery-pulse focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            ?
          </button>
        ) : (
          <button
            onClick={() => !isOwn && post.user_id && navigate(`/profile/${post.user_id}`)}
            className={`h-9 w-9 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold ${!isOwn && post.user_id ? "cursor-pointer hover:ring-2 hover:ring-sky-400 transition" : "cursor-default"}`}
          >
            {post.author_avatar
              ? <img src={post.author_avatar} alt="" className="h-full w-full object-cover" />
              : initials}
          </button>
        )}

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          {isAnonymous ? (
            <button
              onClick={handleMysteryClick}
              className="flex items-center gap-1 group"
            >
              <p className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition truncate">
                TCUnnect Traveler
              </p>
              {!currentUserIsPremium && (
                <Crown className="h-3 w-3 text-amber-400 shrink-0" title="Upgrade to Plus to reveal your identity" />
              )}
            </button>
          ) : isOwn ? (
            <p className="text-xs font-semibold text-slate-700 truncate">{post.author_name}</p>
          ) : (
            <button
              onClick={() => post.user_id && navigate(`/profile/${post.user_id}`)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition truncate text-left"
            >
              {post.author_name}
            </button>
          )}
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            {post.location && (
              <><MapPin className="h-2.5 w-2.5" />{post.location} · </>
            )}
            {timeAgo(post.created_at)}
          </p>
        </div>

        {/* Message + Like — only if poster revealed identity, and not own post */}
        {!isOwn && showRealIdentity && currentUserId && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleMessage}
              title="Send a message"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-600 text-[11px] font-semibold transition"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Message</span>
            </button>
            <button
              onClick={handleLike}
              disabled={liked || liking}
              title={liked ? "Liked!" : "Like this traveler"}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                liked
                  ? "bg-rose-50 text-rose-500 cursor-default"
                  : "bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
            </button>
          </div>
        )}
      </div>

      {showUpgrade && <AnonymousPlusModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}

// ─── Post Card with Comments ───────────────────────────────────────────────
function PostCard({
  post,
  onUpvote,
}: {
  post: Post;
  onUpvote: (id: string) => void;
}) {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function loadComments() {
    if (!isSupabaseConfigured) return;
    setLoadingComments(true);
    const { data } = await supabase
      .from("comments")
      .select("id, post_id, parent_id, content, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    const all = (data ?? []) as Comment[];
    const tree = all
      .filter((c) => !c.parent_id)
      .map((c) => ({ ...c, replies: all.filter((r) => r.parent_id === c.id) }));
    setComments(tree);
    setLoadingComments(false);
  }

  function toggleComments() {
    if (!showComments) loadComments();
    setShowComments((v) => !v);
  }

  async function submitComment(parentId: string | null, text: string) {
    if (!text.trim() || !user || !isSupabaseConfigured) return;
    setSubmittingComment(true);

    await supabase.rpc("add_comment", {
      p_post_id: post.id,
      p_parent_id: parentId ?? null,
      p_content: text.trim(),
    });

    await loadComments();
    if (!parentId) setCommentCount((n) => n + 1);

    // Notify user of their own community activity (reply/comment)
    if (user) {
      const isReply = parentId !== null;
      await createNotification(user.id, {
        type: "community_reply",
        title: isReply ? "You replied to a comment 💬" : "You commented on a post 💬",
        body: text.trim().slice(0, 80) + (text.trim().length > 80 ? "…" : ""),
        linkTo: `/community#${post.id}`,
        referenceId: post.id,
      });
    }

    setCommentText("");
    setReplyText("");
    setReplyingTo(null);
    setSubmittingComment(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/community`;
    const text = post.content.slice(0, 120);
    if (navigator.share) {
      try {
        await navigator.share({ title: "TCUnnect Community", text, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div id={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5">
        {/* Author row */}
        <AuthorRow post={post} currentUserId={user?.id} currentUserIsPremium={user?.isPremium} />

        {/* Content */}
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{post.content}</p>

        {/* Attached image */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt=""
            className="w-full rounded-xl object-cover max-h-72 mb-3 border border-slate-100"
          />
        )}

        {/* Action bar */}
        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => onUpvote(post.id)}
            className={`flex items-center gap-1.5 text-xs font-medium transition ${
              post.upvoted ? "text-sky-600" : "text-slate-400 hover:text-sky-600"
            }`}
          >
            <ChevronUp className={`h-4 w-4 ${post.upvoted ? "stroke-[2.5]" : ""}`} />
            {post.upvotes}
          </button>

          <button
            onClick={toggleComments}
            className={`flex items-center gap-1.5 text-xs transition ${
              showComments ? "text-sky-600 font-medium" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            {commentCount} {commentCount === 1 ? "reply" : "replies"}
          </button>

          <button
            onClick={handleShare}
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
          >
            <Share2 className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Share"}
          </button>

          {/* ⋮ More menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <>
                  {/* click-outside overlay */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 bottom-8 z-20 bg-white border border-slate-100 rounded-xl shadow-lg py-1 min-w-[140px]">
                    <button
                      onClick={() => { setShowReport(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Flag className="h-3.5 w-3.5" /> Report Post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReport && user && (
        <ReportPostModal
          postId={post.id}
          reporterId={user.id}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Comments panel */}
      {showComments && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-4">
          {loadingComments && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
            </div>
          )}

          {!loadingComments && comments.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">
              No replies yet. Be the first!
            </p>
          )}

          {!loadingComments &&
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* Comment bubble */}
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-slate-600 text-[10px] font-bold shrink-0">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-xl px-3 py-2 border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-500 mb-0.5">
                        Anonymous
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 ml-2">
                      <span className="text-[10px] text-slate-400">
                        {timeAgo(comment.created_at)}
                      </span>
                      <button
                        onClick={() => {
                          setReplyingTo(comment.id);
                          setReplyText("");
                        }}
                        className="text-[10px] text-sky-500 hover:text-sky-600 font-medium"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nested replies — each one has its own Reply button */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-9 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id}>
                        <div className="flex gap-2">
                          <CornerDownRight className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-1" />
                          <div className="flex-1">
                            <div className="bg-white rounded-xl px-3 py-2 border border-slate-100">
                              <p className="text-[10px] font-semibold text-slate-500 mb-0.5">
                                Anonymous
                              </p>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {reply.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-2">
                              <span className="text-[10px] text-slate-400">
                                {timeAgo(reply.created_at)}
                              </span>
                              {/* Reply button on each nested reply */}
                              <button
                                onClick={() => {
                                  setReplyingTo(`${comment.id}::${reply.id}`);
                                  setReplyText("");
                                }}
                                className="text-[10px] text-sky-500 hover:text-sky-600 font-medium"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Inline reply input beneath this specific reply */}
                        {replyingTo === `${comment.id}::${reply.id}` && (
                          <div className="mt-2 ml-5 flex gap-2">
                            <textarea
                              autoFocus
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  submitComment(comment.id, replyText);
                                }
                              }}
                              placeholder="Write a reply..."
                              rows={2}
                              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none resize-none bg-white"
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => submitComment(comment.id, replyText)}
                                disabled={!replyText.trim() || submittingComment}
                                className="h-8 w-8 rounded-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white flex items-center justify-center transition"
                              >
                                {submittingComment ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline reply input for top-level comment */}
                {replyingTo === comment.id && (
                  <div className="ml-9 flex gap-2">
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          submitComment(comment.id, replyText);
                        }
                      }}
                      placeholder="Write a reply..."
                      rows={2}
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none resize-none bg-white"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => submitComment(comment.id, replyText)}
                        disabled={!replyText.trim() || submittingComment}
                        className="h-8 w-8 rounded-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white flex items-center justify-center transition"
                      >
                        {submittingComment ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(""); }}
                        className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* New top-level comment — shown when not replying to a specific top-level comment */}
          {(replyingTo === null || replyingTo.includes("::")) && (
            <div className="flex gap-2 pt-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  "A"
                )}
              </div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a reply..."
                rows={2}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none resize-none bg-white"
              />
              <button
                onClick={() => submitComment(null, commentText)}
                disabled={!commentText.trim() || submittingComment}
                className="h-8 w-8 rounded-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white flex items-center justify-center self-end transition"
              >
                {submittingComment ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function Community() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revealIdentity, setRevealIdentity] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Step 1 — fetch posts (no join, avoids PostgREST FK-resolution issues)
    const { data: rawPosts, error: postsErr } = await supabase
      .from("posts")
      .select("id, user_id, content, location, upvotes, comment_count, image_url, created_at, reveal_identity")
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsErr) {
      console.error("[Community] posts fetch error:", postsErr);
      setLoading(false);
      return;
    }

    const posts = rawPosts ?? [];

    // Step 2 — fetch profiles for each unique author in one query
    const authorIds = [...new Set(posts.map((p: any) => p.user_id).filter(Boolean))];
    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (authorIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);
      for (const pr of profileRows ?? []) {
        profileMap[pr.id] = { full_name: pr.full_name, avatar_url: pr.avatar_url };
      }
    }

    const mapped = posts.map((p: any) => ({
      ...p,
      author_name: profileMap[p.user_id]?.full_name ?? null,
      author_avatar: profileMap[p.user_id]?.avatar_url ?? null,
    })) as Post[];
    setPosts(mapped);
    setLoading(false);
  }

  const toggleUpvote = async (id: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, upvotes: p.upvoted ? p.upvotes - 1 : p.upvotes + 1, upvoted: !p.upvoted }
          : p
      )
    );
    if (!isSupabaseConfigured) return;
    try {
      await supabase.rpc("toggle_post_upvote", { p_post_id: id });
    } catch {
      // Rollback on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, upvotes: p.upvoted ? p.upvotes + 1 : p.upvotes - 1, upvoted: !p.upvoted }
            : p
        )
      );
    }
  };

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function closeModal() {
    setShowModal(false);
    setContent("");
    setLocation("");
    setRevealIdentity(false);
    clearImage();
  }

  const submitPost = async () => {
    if (!content.trim() || !user) return;
    if (isSupabaseConfigured) {
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("enable_community_posts")
        .eq("id", true)
        .single();
      if (settings && !settings.enable_community_posts) {
        alert("Community posts are currently disabled by the administrator.");
        return;
      }
    }
    setSubmitting(true);

    let imageUrl: string | null = null;

    // Upload photo if attached
    if (imageFile && isSupabaseConfigured) {
      const ext = imageFile.name.split(".").pop();
      const path = `posts/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("post-images")
        .upload(path, imageFile, { upsert: true, contentType: imageFile.type });
      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }

    if (!isSupabaseConfigured) {
      const post: Post = {
        id: `p_${Date.now()}`,
        content,
        location: location || "",
        upvotes: 0,
        comment_count: 0,
        image_url: imagePreview,
        created_at: new Date().toISOString(),
      };
      setPosts([post, ...posts]);
    } else {
      const shouldReveal = !!(user.isPremium && revealIdentity);
      const { data } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content, location: location || "", image_url: imageUrl, reveal_identity: shouldReveal })
        .select("id, user_id, content, location, upvotes, comment_count, image_url, created_at, reveal_identity")
        .single();

      if (data) setPosts([{
        ...(data as Post),
        author_name: user.fullName ?? null,
        author_avatar: user.profilePhoto ?? null,
      }, ...posts]);
    }

    closeModal();
    setSubmitting(false);
  };

  return (
    <AppShell>
      {/* ── Post modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Share with Community</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{user?.fullName?.[0] ?? "A"}</span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a travel tip, hidden gem, or story..."
                rows={4}
                autoFocus
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none resize-none"
              />
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mb-4 rounded-xl overflow-hidden border border-slate-100">
                <img src={imagePreview} alt="" className="w-full max-h-52 object-cover" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 h-7 w-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Location */}
            <div className="relative mb-3">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add a location (optional)"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            {/* Photo picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-sky-600 transition mb-4 px-1"
            >
              <Image className="h-4 w-4" />
              {imageFile ? "Change photo" : "Add a photo"}
            </button>

            {user?.isPremium ? (
              /* Plus users: reveal identity toggle */
              <button
                type="button"
                onClick={() => setRevealIdentity((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition mb-4 text-left ${
                  revealIdentity
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border-2 transition ${
                  revealIdentity ? "border-indigo-500 bg-indigo-500" : "border-slate-300 bg-white"
                }`}>
                  {revealIdentity && <span className="text-white text-[10px] font-black">✓</span>}
                </div>
                <div>
                  <p className="text-xs font-semibold">
                    {revealIdentity ? `Post as ${user.fullName}` : "Post anonymously"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {revealIdentity
                      ? "Other travelers will see your name and profile"
                      : "Your name won't be shown · TCUnnect Plus — toggle to reveal"}
                  </p>
                </div>
                <Crown className="h-4 w-4 text-amber-400 ml-auto shrink-0" />
              </button>
            ) : (
              <div className="flex gap-2 text-xs text-slate-500 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                🕵️ Posts are anonymous — your name won't be shown
              </div>
            )}

            <button
              onClick={submitPost}
              disabled={!content.trim() || submitting}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {user?.isPremium && revealIdentity ? `Post as ${user.fullName}` : "Post Anonymously"}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Community</h1>
            <p className="text-slate-500 text-sm mt-1">Anonymous travel stories & tips</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> Post
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="font-semibold text-slate-700 mb-1">No posts yet</h3>
            <p className="text-slate-400 text-sm mb-5">
              Be the first to share a travel story or tip!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition"
            >
              Share Something
            </button>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpvote={toggleUpvote} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-400">
          🕵️ Posts are anonymous by default · <span className="text-indigo-400 font-medium">Plus</span> members can choose to reveal their identity
        </div>
      </div>
    </AppShell>
  );
}
