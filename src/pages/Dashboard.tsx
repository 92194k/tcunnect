import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuthStore } from "../stores";
import { ArrowRight, MapPin, Sparkles, Users, Star, TrendingUp } from "lucide-react";

const FEATURED_GEM = {
  id: "nacpan",
  name: "Nacpan Beach",
  location: "El Nido, Palawan",
  image: "https://images.unsplash.com/photo-1602587921225-3cca658d31bb?auto=format&fit=crop&w=1400&q=85",
  category: "Beach",
  budgetLevel: "₱₱",
  description: "White sand, clear water, and a quieter escape from the usual tourist spots.",
};

const RECOMMENDED_TRAVELERS = [
  { id: "t1", name: "Maria", age: 21, city: "Quezon City", interests: ["Beach", "Food", "Nature"], image: "https://images.unsplash.com/photo-1675705444858-97005ce93298?auto=format&fit=crop&w=300&q=80" },
  { id: "t2", name: "Sam", age: 24, city: "Cebu City", interests: ["Mountain", "Waterfalls"], image: "https://images.unsplash.com/photo-1605741455532-384a402cf959?auto=format&fit=crop&w=300&q=80" },
  { id: "t3", name: "Ana", age: 23, city: "Davao City", interests: ["Heritage", "Food"], image: "https://images.unsplash.com/photo-1650666908250-b0dcbf54e08b?auto=format&fit=crop&w=300&q=80" },
];

const POPULAR_GEMS = [
  { id: "g1", name: "Kayangan Lake", location: "Coron, Palawan", category: "Nature", emoji: "🌿", image: "https://images.unsplash.com/photo-1758782551890-0f47a570859c?auto=format&fit=crop&w=600&q=80" },
  { id: "g2", name: "Balabac Islands", location: "Palawan", category: "Beach", emoji: "🏝", image: "https://images.unsplash.com/photo-1758782551916-1723a9cd00eb?auto=format&fit=crop&w=600&q=80" },
  { id: "g3", name: "Kalanggaman", location: "Leyte", category: "Beach", emoji: "🏖", image: "https://images.unsplash.com/photo-1462557804967-1b4876a07c17?auto=format&fit=crop&w=600&q=80" },
];

const COMMUNITY_POSTS = [
  { id: "p1", content: "Found this amazing little cafe today! ☕ The vibes were immaculate.", location: "Taguig", upvotes: 42, comments: 8, time: "2h ago" },
  { id: "p2", content: "Siargao is calling and I must go 🌊 Anyone up for a trip next month?", location: "Surigao del Norte", upvotes: 31, comments: 15, time: "4h ago" },
];

export default function Dashboard() {
  const { user } = useAuthStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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

        {/* ── Featured Gem ── */}
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

          <Link to={`/gems/${FEATURED_GEM.id}`} className="block relative rounded-2xl overflow-hidden group">
            <img src={FEATURED_GEM.image} alt={FEATURED_GEM.name}
              className="w-full h-56 lg:h-72 object-cover group-hover:scale-[1.02] transition duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <span className="absolute top-4 left-4 bg-amber-400 text-amber-950 text-xs font-extrabold tracking-wide px-3 py-1.5 rounded-full">
              ✨ FEATURED BY TCUNNECT
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <h3 className="text-xl font-bold">{FEATURED_GEM.name}</h3>
              <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
                <MapPin className="h-3.5 w-3.5 text-rose-400" /> {FEATURED_GEM.location}
              </p>
              <p className="text-white/70 text-sm mt-2 line-clamp-2">{FEATURED_GEM.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">🏖 {FEATURED_GEM.category}</span>
                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{FEATURED_GEM.budgetLevel}</span>
              </div>
            </div>
          </Link>
        </section>

        {/* ── Recommended Travelers ── */}
        <section>
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
            {RECOMMENDED_TRAVELERS.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <img src={t.image} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}, {t.age}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {t.city}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.interests.map((i) => (
                    <span key={i} className="bg-sky-50 text-sky-700 text-[10px] font-medium px-2 py-0.5 rounded-full">{i}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Popular Gems ── */}
        <section>
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
            {POPULAR_GEMS.map((gem) => (
              <Link key={gem.id} to={`/gems/${gem.id}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="h-40 overflow-hidden">
                  <img src={gem.image} alt={gem.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{gem.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{gem.location}</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{gem.emoji} {gem.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Community Posts ── */}
        <section>
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
            {COMMUNITY_POSTS.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">A</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Anonymous Traveler</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" /> {post.location} · {post.time}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-700">{post.content}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span>▲ {post.upvotes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
