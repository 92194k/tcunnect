import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { MapPin, Star, Sparkles, ArrowRight } from "lucide-react";

const FEATURED_CATEGORIES = [
  {
    title: "Editor's Picks",
    subtitle: "Hand-curated by the TCUnnect team",
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    gems: [
      { id: "nacpan", name: "Nacpan Beach", location: "El Nido, Palawan", image: "https://images.unsplash.com/photo-1602587921225-3cca658d31bb?auto=format&fit=crop&w=600&q=80", rating: 4.9, tag: "Beach" },
      { id: "g1", name: "Kayangan Lake", location: "Coron, Palawan", image: "https://images.unsplash.com/photo-1758782551890-0f47a570859c?auto=format&fit=crop&w=600&q=80", rating: 4.9, tag: "Nature" },
      { id: "g6", name: "Batanes Rolling Hills", location: "Batan Island, Batanes", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80", rating: 4.9, tag: "Nature" },
    ],
  },
  {
    title: "Beach Escapes",
    subtitle: "The Philippines' most breathtaking shores",
    icon: <span className="text-xl">🏖</span>,
    gems: [
      { id: "g3", name: "Kalanggaman Island", location: "Leyte", image: "https://images.unsplash.com/photo-1462557804967-1b4876a07c17?auto=format&fit=crop&w=600&q=80", rating: 4.7, tag: "Beach" },
      { id: "g2", name: "Balabac Islands", location: "Palawan", image: "https://images.unsplash.com/photo-1758782551916-1723a9cd00eb?auto=format&fit=crop&w=600&q=80", rating: 4.8, tag: "Beach" },
    ],
  },
  {
    title: "Mountain & Nature",
    subtitle: "Trek, explore, and reconnect with nature",
    icon: <span className="text-xl">🏔</span>,
    gems: [
      { id: "g8", name: "Mt. Apo Summit", location: "Davao City", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80", rating: 4.7, tag: "Mountain" },
      { id: "g4", name: "Tinago Falls", location: "Iligan City", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80", rating: 4.8, tag: "Waterfalls" },
    ],
  },
  {
    title: "Heritage & Culture",
    subtitle: "Discover the Philippines' rich history",
    icon: <span className="text-xl">🏛</span>,
    gems: [
      { id: "g5", name: "Paoay Church", location: "Ilocos Norte", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80", rating: 4.6, tag: "Heritage" },
    ],
  },
];

export default function Featured() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Featured Gems</h1>
          <p className="text-slate-500 text-sm mt-1">Curated highlights from across the Philippines</p>
        </div>

        {/* Hero banner */}
        <div className="relative rounded-2xl overflow-hidden h-56 lg:h-72">
          <img
            src="https://images.unsplash.com/photo-1602587921225-3cca658d31bb?auto=format&fit=crop&w=1400&q=80"
            alt="Featured"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1.5 rounded-full">
              ✨ FEATURED BY TCUNNECT
            </span>
          </div>
          <div className="absolute bottom-5 left-5 text-white">
            <h2 className="text-2xl font-bold">Nacpan Beach</h2>
            <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 text-rose-400" /> El Nido, Palawan
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span className="text-sm font-semibold">4.9</span>
              <span className="text-white/60 text-xs">(389 reviews)</span>
            </div>
          </div>
          <Link to="/gems/nacpan"
            className="absolute bottom-5 right-5 bg-white text-slate-900 text-xs font-semibold px-4 py-2 rounded-full hover:bg-sky-50 transition flex items-center gap-1">
            Explore <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Category sections */}
        {FEATURED_CATEGORIES.map((cat) => (
          <section key={cat.title}>
            <div className="flex items-center gap-2 mb-4">
              {cat.icon}
              <div>
                <h2 className="text-lg font-bold text-slate-900">{cat.title}</h2>
                <p className="text-xs text-slate-500">{cat.subtitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.gems.map((gem) => (
                <Link key={gem.id} to={`/gems/${gem.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition">
                  <div className="relative h-44 overflow-hidden">
                    <img src={gem.image} alt={gem.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-3 left-3 bg-white/90 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {gem.tag}
                    </span>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div className="text-white">
                        <p className="font-bold text-sm">{gem.name}</p>
                        <p className="text-white/80 text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {gem.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 bg-black/30 rounded-full px-2 py-1">
                        <Star className="h-3 w-3 text-amber-400 fill-current" />
                        <span className="text-white text-xs font-semibold">{gem.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
