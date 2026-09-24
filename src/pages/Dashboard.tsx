import { useState, useEffect } from "react";

const CATEGORY_EMOJIS: Record<string, string> = {
  Beach: "🏖", Mountain: "🏔", Nature: "🌿", Heritage: "🏛",
  Cafe: "☕", Waterfalls: "💦", City: "🌆", Food: "🍜",
};
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { ArrowRight, MapPin, Sparkles, Users, Star, TrendingUp, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface FeaturedGem {
  id: string;
  name: string;
  location: string;
  images: string[];
  category: string;
  budget_level: string;
  description: string;

}

interface TravelerCard {
  id: string;
  full_name: string;
  age?: number;
  location: string;
  travel_interests: string[];
  profile_photo: string;
}

interface PostCard {
  id: string;
  content: string;
  location: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
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


export default function Dashboard() {
  const { user } = useAuthStore();
  const [featuredGem, setFeaturedGem] = useState<FeaturedGem | null>(null);
  const [popularGems, setPopularGems] = useState<FeaturedGem[]>([]);
  const [travelers, setTravelers] = useState<TravelerCard[]>([]);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      if (!isSupabaseConfigured) { setLoading(false); return; }

      // Fetch all in parallel
      const [gemsRes, travelersRes, postsRes] = await Promise.all([
        supabase
          .from("hidden_gems")
          .select("id, name, location, category, images, budget_level, description")
          .eq("status", "approved")
          .order("is_featured", { ascending: false })
          .order("rating", { ascending: false })
          .limit(6),
        supabase
          .from("profiles")
          .select("id, full_name, age, location, travel_interests, profile_photo")
          .neq("id", user?.id ?? "")
          .not("travel_interests", "eq", "{}")
          .limit(3),
        supabase
          .from("posts")
          .select("id, content, location, upvotes, comment_count, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
      ]);

      const gems = (gemsRes.data ?? []) as FeaturedGem[];
      setFeaturedGem(gems[0] ?? null);
      setPopularGems(gems.slice(1, 4));

      setTravelers((travelersRes.data ?? []) as TravelerCard[]);
      setPosts((postsRes.data ?? []) as PostCard[]);

      setLoading(false);
    }
    loadDashboard();
  }, []);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-10">
        {/* ── Hero greeting ── */}
        <section className="bg-gradient-to-r from-sky-600 to-sky-500 rounded-2xl p-6 lg:p-8 text-white shadow-lg shadow-sky-200">
          <p className="text-sky-100 text-sm font-medium mb-1">{greeting},</p>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">{user?.fullName} 👋</h1>
          <p className="text-sky-200 text-sm mb-5">Where will you go next?</p>
          <Link to="/hidden-gems"
            className="inline-flex items-center gap-2 bg-white text-sky-700 font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-sky-50 transition shadow-sm">
            Explore Hidden Gems <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Featured Gem ── */}
            {featuredGem && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-900">Featured Gem</h2>
                  </div>
                  <Link to="/featured" className="text-sm text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <Link to={`/gems/${featuredGem.id}`} className="block relative rounded-2xl overflow-hidden group">
                  <img src={featuredGem.images?.[0] ?? ""} alt={featuredGem.name}
                    className="w-full h-56 lg:h-72 object-cover group-hover:scale-[1.02] transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className="absolute top-4 left-4 bg-amber-400 text-amber-950 text-xs font-extrabold tracking-wide px-3 py-1.5 rounded-full">
                    ✨ FEATURED BY TCUNNECT
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-xl font-bold">{featuredGem.name}</h3>
                    <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
                      <MapPin className="h-3.5 w-3.5 text-rose-400" /> {featuredGem.location}
                    </p>
                    {featuredGem.description && (
                      <p className="text-white/70 text-sm mt-2 line-clamp-2">{featuredGem.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{CATEGORY_EMOJIS[featuredGem.category] ?? "📍"} {featuredGem.category}</span>
                      <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{featuredGem.budget_level}</span>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* ── Recommended Travelers ── */}
            {travelers.length > 0 && <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-500" />
                  <h2 className="text-lg font-bold text-slate-900">Recommended Travelers</h2>
                </div>
                <Link to="/discover-people" className="text-sm text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
                  Discover more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {travelers.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-3">
                      {t.profile_photo
                        ? <img src={t.profile_photo} alt={t.full_name} className="h-12 w-12 rounded-full object-cover" />
                        : <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-lg">{t.full_name?.[0] ?? "?"}</div>
                      }
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{t.full_name}{t.age ? `, ${t.age}` : ""}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {t.location || "Philippines"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(t.travel_interests ?? []).map((i) => (
                        <span key={i} className="bg-sky-50 text-sky-700 text-[10px] font-medium px-2 py-0.5 rounded-full">{i}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>}

            {/* ── Popular Gems ── */}
            {popularGems.length > 0 && <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-bold text-slate-900">Popular Hidden Gems</h2>
                </div>
                <Link to="/hidden-gems" className="text-sm text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
                  Explore all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {popularGems.map((gem) => (
                  <Link key={gem.id} to={`/gems/${gem.id}`}
                    className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition">
                    <div className="h-40 overflow-hidden">
                      <img src={gem.images?.[0] ?? ""} alt={gem.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{gem.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{gem.location}</p>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{CATEGORY_EMOJIS[gem.category] ?? "📍"} {gem.category}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>}

            {/* ── Community Posts ── */}
            {posts.length > 0 && <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-slate-900">Community</h2>
                </div>
                <Link to="/community" className="text-sm text-sky-600 font-medium hover:text-sky-700 flex items-center gap-1">
                  See all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">A</div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Anonymous Traveler</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          {post.location && <><MapPin className="h-2.5 w-2.5" /> {post.location} · </>}
                          {timeAgo(post.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>▲ {post.upvotes}</span>
                      <span>💬 {post.comment_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>}
          </>
        )}
      </div>
    </AppShell>
  );
}
