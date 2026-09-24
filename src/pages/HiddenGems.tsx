import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { MapPin, Search, Filter, Star, Bookmark } from "lucide-react";

const CATEGORIES = ["All", "Beach", "Mountain", "Nature", "Heritage", "Cafe", "Waterfalls", "City", "Food"];

const GEMS = [
  { id: "g1", name: "Kayangan Lake", location: "Coron, Palawan", category: "Nature", emoji: "🌿", image: "https://images.unsplash.com/photo-1758782551890-0f47a570859c?auto=format&fit=crop&w=600&q=80", rating: 4.9, reviews: 312, budget: "₱₱", tip: "Go early morning to avoid crowds" },
  { id: "g2", name: "Balabac Islands", location: "Palawan", category: "Beach", emoji: "🏝", image: "https://images.unsplash.com/photo-1758782551916-1723a9cd00eb?auto=format&fit=crop&w=600&q=80", rating: 4.8, reviews: 187, budget: "₱₱₱", tip: "Bring your own supplies" },
  { id: "g3", name: "Kalanggaman Island", location: "Leyte", category: "Beach", emoji: "🏖", image: "https://images.unsplash.com/photo-1462557804967-1b4876a07c17?auto=format&fit=crop&w=600&q=80", rating: 4.7, reviews: 241, budget: "₱₱", tip: "Best at sunset" },
  { id: "g4", name: "Tinago Falls", location: "Iligan City, Lanao del Norte", category: "Waterfalls", emoji: "💦", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80", rating: 4.8, reviews: 156, budget: "₱", tip: "Wear water shoes for the trek" },
  { id: "g5", name: "Paoay Church", location: "Ilocos Norte", category: "Heritage", emoji: "🏛", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80", rating: 4.6, reviews: 203, budget: "₱", tip: "UNESCO World Heritage Site" },
  { id: "g6", name: "Batanes Rolling Hills", location: "Batan Island, Batanes", category: "Nature", emoji: "🌿", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80", rating: 4.9, reviews: 128, budget: "₱₱₱", tip: "Best from May to September" },
  { id: "nacpan", name: "Nacpan Beach", location: "El Nido, Palawan", category: "Beach", emoji: "🏖", image: "https://images.unsplash.com/photo-1602587921225-3cca658d31bb?auto=format&fit=crop&w=600&q=80", rating: 4.9, reviews: 389, budget: "₱₱", tip: "4km of pristine white sand" },
  { id: "g8", name: "Mt. Apo Summit", location: "Davao City, Davao del Sur", category: "Mountain", emoji: "🏔", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80", rating: 4.7, reviews: 94, budget: "₱₱", tip: "Highest peak in PH — hire a guide!" },
];

export default function HiddenGems() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const filtered = GEMS.filter((g) => {
    const matchesQuery = g.name.toLowerCase().includes(query.toLowerCase()) || g.location.toLowerCase().includes(query.toLowerCase());
    const matchesCat = activeCategory === "All" || g.category === activeCategory;
    return matchesQuery && matchesCat;
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSaved((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Hidden Gems</h1>
          <p className="text-slate-500 text-sm mt-1">Discover underrated destinations across the Philippines</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gems, cities, islands..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
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
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((gem) => (
            <Link key={gem.id} to={`/gems/${gem.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="relative h-44 overflow-hidden">
                <img src={gem.image} alt={gem.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <button onClick={(e) => toggleSave(gem.id, e)}
                  className="absolute top-3 right-3 h-8 w-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition">
                  <Bookmark className={`h-4 w-4 ${saved.has(gem.id) ? "fill-sky-600 text-sky-600" : "text-slate-500"}`} />
                </button>
                <span className="absolute top-3 left-3 bg-white/90 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full">
                  {gem.emoji} {gem.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{gem.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3" /> {gem.location}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                    <span className="text-xs font-medium text-slate-700">{gem.rating}</span>
                    <span className="text-xs text-slate-400">({gem.reviews})</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{gem.budget}</span>
                </div>
                <p className="text-xs text-sky-600 mt-2 italic">💡 {gem.tip}</p>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-slate-500 text-sm">No gems found for "{query}"</p>
          </div>
        )}

        {/* Submit CTA */}
        <div className="mt-10 bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">📍</div>
          <h3 className="font-bold text-slate-900 mb-1">Know a hidden gem?</h3>
          <p className="text-slate-500 text-sm mb-4">Share it with the TCUnnect community</p>
          <button className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition">
            Submit a Gem
          </button>
        </div>
      </div>
    </AppShell>
  );
}
