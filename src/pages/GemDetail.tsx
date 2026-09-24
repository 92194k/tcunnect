import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { MapPin, Star, ArrowLeft, Heart, Share2, Calendar, Clock, Users, ChevronRight, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface Gem {
  id: string;
  name: string;
  location: string;
  category: string;
  emoji: string;
  images: string[];
  rating: number;
  review_count: number;
  budget_level: string;
  description: string;
  tip: string;
  best_time: string;
  is_featured: boolean;
}

export default function GemDetail() {
  const { gemId } = useParams<{ gemId: string }>();
  const navigate = useNavigate();
  const [gem, setGem] = useState<Gem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!gemId) return;
    fetchGem(gemId);
  }, [gemId]);

  async function fetchGem(id: string) {
    setLoading(true);
    setNotFound(false);

    if (!isSupabaseConfigured) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const { data, error } = await supabase
      .from("hidden_gems")
      .select("id, name, location, category, emoji, images, rating, review_count, budget_level, description, tip, best_time, is_featured")
      .eq("id", id)
      .eq("status", "approved")
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setGem(data as Gem);
    }
    setLoading(false);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: gem?.name ?? "Hidden Gem", text: gem?.description?.slice(0, 100), url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !gem) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Gem not found</h2>
          <p className="text-slate-500 text-sm mb-6">This gem doesn't exist or hasn't been approved yet.</p>
          <Link
            to="/hidden-gems"
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition"
          >
            Back to Hidden Gems
          </Link>
        </div>
      </AppShell>
    );
  }

  const images = gem.images?.length ? gem.images : [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Hero Image */}
        <div className="relative rounded-2xl overflow-hidden mb-4 h-72 lg:h-96 bg-slate-100">
          {images.length > 0 ? (
            <img
              src={images[activeImg]}
              alt={gem.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              {gem.emoji}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
            </button>
            <button
              onClick={handleShare}
              title={copied ? "Copied!" : "Share"}
              className="h-9 w-9 bg-white/90 rounded-full flex items-center justify-center shadow"
            >
              <Share2 className={`h-4 w-4 ${copied ? "text-sky-500" : "text-slate-500"}`} />
            </button>
          </div>

          {/* Category badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
              {gem.emoji} {gem.category}
            </span>
            {gem.is_featured && (
              <span className="bg-amber-400 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-full">
                ✨ Featured
              </span>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mb-5">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`h-16 w-20 rounded-lg overflow-hidden border-2 transition ${
                  activeImg === i ? "border-sky-500" : "border-transparent"
                }`}
              >
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
            {gem.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-current" />
                <span className="text-sm font-semibold text-slate-800">{gem.rating}</span>
                <span className="text-sm text-slate-400">({gem.review_count} reviews)</span>
              </div>
            )}
            <span className="text-sm text-slate-500 font-medium">{gem.budget_level}</span>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-sky-50 rounded-xl p-3 text-center">
            <Calendar className="h-4 w-4 text-sky-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Best Time</p>
            <p className="text-xs font-semibold text-slate-800">{gem.best_time || "—"}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Category</p>
            <p className="text-xs font-semibold text-slate-800">{gem.category}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <Users className="h-4 w-4 text-amber-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 mb-0.5">Budget</p>
            <p className="text-xs font-semibold text-slate-800">{gem.budget_level}</p>
          </div>
        </div>

        {/* Description */}
        {gem.description && (
          <div className="mb-5">
            <h2 className="font-bold text-slate-900 mb-2">About this place</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{gem.description}</p>
          </div>
        )}

        {/* Insider Tip */}
        {gem.tip && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-amber-700 mb-1">💡 Insider Tip</p>
            <p className="text-sm text-amber-800">{gem.tip}</p>
          </div>
        )}

        {/* Book CTA */}
        <Link
          to={`/booking/${gem.id}`}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-sky-200"
        >
          Book a Trip Here <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </AppShell>
  );
}
