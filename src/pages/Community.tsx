import { useState } from "react";
import AppShell from "../components/AppShell";
import { MapPin, MessageCircle, ChevronUp, Plus, X } from "lucide-react";

interface Post {
  id: string;
  content: string;
  location: string;
  upvotes: number;
  comments: number;
  time: string;
  tags: string[];
  upvoted?: boolean;
}

const INITIAL_POSTS: Post[] = [
  { id: "p1", content: "Found this amazing little cafe today! ☕ The vibes were immaculate and the ube latte is to die for. Definitely coming back.", location: "Taguig, Metro Manila", upvotes: 42, comments: 8, time: "2h ago", tags: ["Cafe", "Food"] },
  { id: "p2", content: "Siargao is calling and I must go 🌊 Anyone up for a trip next month? Looking for 2-3 travel buddies who are down for surfing and island hopping.", location: "Surigao del Norte", upvotes: 31, comments: 15, time: "4h ago", tags: ["Beach", "Surfing"] },
  { id: "p3", content: "Just got back from Batanes and I'm still not over it 😭 The rolling hills, the stone houses, the fresh seafood... 10/10 would recommend.", location: "Batanes", upvotes: 87, comments: 24, time: "1d ago", tags: ["Nature", "Heritage"] },
  { id: "p4", content: "Budget tip: If you're going to El Nido, book your island hopping tour locally instead of online — same tour, almost half the price! 🙌", location: "El Nido, Palawan", upvotes: 156, comments: 33, time: "2d ago", tags: ["Tips", "Budget"] },
  { id: "p5", content: "Hidden gem alert 🔥 Discovered a pristine waterfall in Rizal Province that only locals know about. 30 mins from QC! DM me for directions.", location: "Rizal Province", upvotes: 203, comments: 67, time: "3d ago", tags: ["Waterfalls", "Nature"] },
];

const TAG_COLORS: Record<string, string> = {
  Cafe: "bg-amber-50 text-amber-700", Food: "bg-orange-50 text-orange-700",
  Beach: "bg-sky-50 text-sky-700", Surfing: "bg-blue-50 text-blue-700",
  Nature: "bg-emerald-50 text-emerald-700", Heritage: "bg-purple-50 text-purple-700",
  Tips: "bg-rose-50 text-rose-700", Budget: "bg-lime-50 text-lime-700",
  Waterfalls: "bg-cyan-50 text-cyan-700",
};

export default function Community() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", location: "" });

  const toggleUpvote = (id: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, upvotes: p.upvoted ? p.upvotes - 1 : p.upvotes + 1, upvoted: !p.upvoted } : p
    ));
  };

  const submitPost = () => {
    if (!newPost.content.trim()) return;
    const post: Post = {
      id: `p_${Date.now()}`,
      content: newPost.content,
      location: newPost.location || "Philippines",
      upvotes: 0,
      comments: 0,
      time: "Just now",
      tags: [],
    };
    setPosts([post, ...posts]);
    setNewPost({ content: "", location: "" });
    setShowModal(false);
  };

  return (
    <AppShell>
      {/* Post modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Share with Community</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0">A</div>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="Share a travel tip, hidden gem, or travel story..."
                rows={4}
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none resize-none"
              />
            </div>
            <div className="relative mb-4">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={newPost.location}
                onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                placeholder="Add a location (optional)"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div className="flex gap-2 text-xs text-slate-500 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              🕵️ Posts are anonymous — your name won't be shown
            </div>
            <button onClick={submitPost} disabled={!newPost.content.trim()}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition">
              Post Anonymously
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Community</h1>
            <p className="text-slate-500 text-sm mt-1">Anonymous travel stories & tips</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition">
            <Plus className="h-4 w-4" /> Post
          </button>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 text-xs font-bold">A</div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Anonymous Traveler</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {post.location} · {post.time}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed mb-3">{post.content}</p>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-600"}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                <button onClick={() => toggleUpvote(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition ${post.upvoted ? "text-sky-600" : "text-slate-400 hover:text-sky-600"}`}>
                  <ChevronUp className={`h-4 w-4 ${post.upvoted ? "stroke-[2.5]" : ""}`} />
                  {post.upvotes}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments} {post.comments === 1 ? "reply" : "replies"}
                </button>
                <button className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition">Share</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          🕵️ All posts are anonymous to protect privacy
        </div>
      </div>
    </AppShell>
  );
}
