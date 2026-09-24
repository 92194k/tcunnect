import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { MapPin, Star, ArrowLeft, Heart, Share2, Calendar, Clock, Users, ChevronRight } from "lucide-react";

const GEMS: Record<string, {
  id: string; name: string; location: string; category: string; emoji: string;
  image: string; images: string[]; rating: number; reviews: number; budget: string;
  description: string; tip: string; bestTime: string; duration: string; groupSize: string;
  highlights: string[]; author: { name: string; photo: string };
}> = {
  "g1": {
    id: "g1", name: "Kayangan Lake", location: "Coron, Palawan", category: "Nature", emoji: "🌿",
    image: "https://images.unsplash.com/photo-1758782551890-0f47a570859c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1758782551890-0f47a570859c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
    ],
    rating: 4.9, reviews: 312, budget: "₱₱",
    description: "Often called the cleanest lake in Asia, Kayangan Lake sits on Coron Island surrounded by dramatic limestone cliffs. The jade-green water is a paradise for snorkelers and divers — visibility can stretch to over 10 meters.",
    tip: "Go early morning (before 8am) to beat the tour groups and enjoy the misty lake almost to yourself.",
    bestTime: "Nov – May", duration: "Half day", groupSize: "2–10 people",
    highlights: ["Crystal-clear jade water", "Limestone cliffs viewdeck", "Snorkeling spot", "UNESCO-protected area"],
    author: { name: "Ana R.", photo: "https://images.unsplash.com/photo-1650666908250-b0dcbf54e08b?auto=format&fit=crop&w=100&q=80" },
  },
  "nacpan": {
    id: "nacpan", name: "Nacpan Beach", location: "El Nido, Palawan", category: "Beach", emoji: "🏖",
    image: "https://images.unsplash.com/photo-1602587921225-3cca658d31bb?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1602587921225-3cca658d31bb?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1462557804967-1b4876a07c17?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1758782551916-1723a9cd00eb?auto=format&fit=crop&w=600&q=80",
    ],
    rating: 4.9, reviews: 389, budget: "₱₱",
    description: "A sweeping 4km stretch of white sand backed by swaying coconut palms, Nacpan Beach is one of El Nido's best-kept secrets. The calm turquoise water and relatively uncrowded shores make it a perfect all-day escape.",
    tip: "Rent a habal-habal (motorcycle) from El Nido town for ~₱300 round trip. Bring cash — no ATMs nearby.",
    bestTime: "Dec – Apr", duration: "Full day", groupSize: "Any",
    highlights: ["4km white sand shoreline", "Uncrowded & peaceful", "Clear turquoise water", "Sunset views"],
    author: { name: "Maria L.", photo: "https://images.unsplash.com/photo-1675705444858-97005ce93298?auto=format&fit=crop&w=100&q=80" },
  },
  "g2": {
    id: "g2", name: "Balabac Islands", location: "Palawan", category: "Beach", emoji: "🏝",
    image: "https://images.unsplash.com/photo-1758782551916-1723a9cd00eb?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1758782551916-1723a9cd00eb?auto=format&fit=crop&w=600&q=80", "https://images.unsplash.com/photo-1602587921225-3cca658d31bb?auto=format&fit=crop&w=600&q=80"],
    rating: 4.8, reviews: 187, budget: "₱₱₱",
    description: "Balabac is a remote island municipality at the southernmost tip of Palawan. Known for pristine beaches that rival the Maldives, it offers a raw, untouched escape for serious adventurers.",
    tip: "Join a multi-day island hopping tour from Puerto Princesa. Bring your own food supplies.",
    bestTime: "Mar – May", duration: "2–3 days", groupSize: "4–8 people",
    highlights: ["Maldives-like sandbars", "Wild sea turtles", "Clear blue lagoons", "Remote & unspoiled"],
    author: { name: "Jake M.", photo: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=100&q=80" },
  },
};

// Fallback gem for unknown IDs
const FALLBACK = GEMS["g1"];

export default function GemDetail() {
  const { gemId } = useParams<{ gemId: string }>();
  const navigate = useNavigate();
  const gem = (gemId && GEMS[gemId]) ? GEMS[gemId] : FALLBACK;
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero Image */}
        <div className="relative rounded-2xl overflow-hidden mb-4 h-72 lg:h-96">
          <img src={gem.images[activeImg] ?? gem.image} alt={gem.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setLiked(!liked)} className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
            </button>
            <button className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Share2 className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <div className="absolute bottom-4 left-4">
            <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">{gem.emoji} {gem.category}</span>
          </div>
        </div>

        {/* Thumbnails */}
        {gem.images.length > 1 && (
          <div className="flex gap-2 mb-5">
            {gem.images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-20 rounded-lg overflow-hidden border-2 transition ${activeImg === i ? "border-sky-500" : "border-transparent"}`}>
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{gem.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="flex items-center gap-1 text-slate-500 text-sm">
              <MapPin className="h-4 w-4 text-rose-400" /> {gem.location}
            </p>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span className="text-sm font-semibold text-slate-800">{gem.rating}</span>
              <span className="text-sm text-slate-400">({gem.reviews} reviews)</span>
            </div>
            <span className="text-sm text-slate-500 font-medium">{gem.budget}</span>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-sky-50 rounded-xl p-3 text-center">
            <Calendar className="h-4 w-4 text-sky-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Best Time</p>
            <p className="text-xs font-semibold text-slate-800">{gem.bestTime}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Duration</p>
            <p className="text-xs font-semibold text-slate-800">{gem.duration}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <Users className="h-4 w-4 text-amber-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Group</p>
            <p className="text-xs font-semibold text-slate-800">{gem.groupSize}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <h2 className="font-bold text-slate-900 mb-2">About this place</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{gem.description}</p>
        </div>

        {/* Highlights */}
        <div className="mb-5">
          <h2 className="font-bold text-slate-900 mb-3">Highlights</h2>
          <div className="grid grid-cols-2 gap-2">
            {gem.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="h-5 w-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs">✓</span>
                {h}
              </div>
            ))}
          </div>
        </div>

        {/* Travel Tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-amber-700 mb-1">💡 Local Tip</p>
          <p className="text-sm text-amber-800">{gem.tip}</p>
        </div>

        {/* Submitted by */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-slate-50 rounded-xl">
          <img src={gem.author.photo} alt={gem.author.name} className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="text-xs text-slate-500">Submitted by</p>
            <p className="text-sm font-semibold text-slate-800">{gem.author.name}</p>
          </div>
        </div>

        {/* Book CTA */}
        <Link to={`/booking/${gem.id}`}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-sky-200">
          Book a Trip Here <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </AppShell>
  );
}

