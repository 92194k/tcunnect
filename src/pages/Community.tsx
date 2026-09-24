import { useState, useEffect, useRef } from "react";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { MapPin, MessageCircle, ChevronUp, Plus, X, Loader2, Image, Share2, Send, CornerDownRight } from "lucide-react";
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
  content: string;
  location: string;
  upvotes: number;
  comment_count: number;
  image_url?: string | null;
  created_at: string;
  upvoted?: boolean;
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
        <div className="flex items-center gap-2 mb-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
            A
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">Anonymous Traveler</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              {post.location && (
                <>
                  <MapPin className="h-2.5 w-2.5" />
                  {post.location} ·{" "}
                </>
              )}
              {timeAgo(post.created_at)}
            </p>
          </div>
        </div>

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
        </div>
      </div>

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

                {/* Nested replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-9 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
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
                          <span className="text-[10px] text-slate-400 ml-2">
                            {timeAgo(reply.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline reply input */}
                {replyingTo === comment.id && (
                  <div className="ml-9 flex gap-2">
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
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
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* New top-level comment */}
          {replyingTo === null && (
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

    const { data } = await supabase
      .from("posts")
      .select("id, content, location, upvotes, comment_count, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    setPosts((data as Post[]) ?? []);
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
    clearImage();
  }

  const submitPost = async () => {
    if (!content.trim() || !user) return;
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
      const { data } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content, location: location || "", image_url: imageUrl })
        .select("id, content, location, upvotes, comment_count, image_url, created_at")
        .single();

      if (data) setPosts([data as Post, ...posts]);
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

            <div className="flex gap-2 text-xs text-slate-500 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              🕵️ Posts are anonymous — your name won't be shown
            </div>

            <button
              onClick={submitPost}
              disabled={!content.trim() || submitting}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post Anonymously
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
              Post Anonymously
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
          🕵️ All posts are anonymous to protect privacy
        </div>
      </div>
    </AppShell>
  );
}
