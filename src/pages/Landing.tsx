import Logo from "../components/Logo";
import { STUDENTS } from "../data";

type Props = { onNavigate: (v: string) => void };

const features = [
  { icon: "🔍", title: "Discover Students", desc: "Browse profiles from every department and find people who share your interests." },
  { icon: "💜", title: "Anonymous Likes", desc: "Like someone without revealing yourself. Stay private until it's mutual." },
  { icon: "🎉", title: "Mutual Matches", desc: "When you both like each other, you both get revealed and can start chatting." },
  { icon: "💬", title: "Private Messaging", desc: "Chat only after a mutual match — keeping conversations meaningful and safe." },
  { icon: "📰", title: "Anonymous Campus Feed", desc: "Post thoughts, questions, and memes anonymously. No judgment, pure campus vibes." },
  { icon: "⭐", title: "Premium Visibility", desc: "See who liked and viewed you. Get a premium badge and unlimited access." },
];

const samplePosts = [
  { dept: "CICT", text: "Anyone else surviving finals week? 😭", upvotes: 47 },
  { dept: null, text: "Looking for people to join our study group!", upvotes: 31 },
  { dept: null, text: "Who else is always at the library? 🦉", upvotes: 89 },
];

function MiniProfileCard({ student, style }: { student: typeof STUDENTS[0]; style?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden w-44 ${style ?? ""}`}>
      <img src={student.photo} alt={student.name} className="w-full h-36 object-cover" />
      <div className="p-3">
        <p className="font-display font-bold text-sm text-[#1A1033] truncate">{student.name}</p>
        <p className="text-xs text-slate-500">{student.dept} · {student.year.replace(" Year", "Y")}</p>
        <div className="flex gap-1 mt-2">
          {student.interests.slice(0, 2).map((i) => (
            <span key={i} className="text-[10px] bg-[#EDE9FF] text-primary px-1.5 py-0.5 rounded-full">{i}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-white font-display overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#community" className="hover:text-primary transition-colors">Community</a>
            <a href="#premium" className="hover:text-primary transition-colors">Premium</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("login")} className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors px-4 py-2">
              Log In
            </button>
            <button onClick={() => onNavigate("signup")} className="text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F0EBFF] via-white to-[#FFE8F0] pt-20 pb-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-primary opacity-5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-pink-400 opacity-5 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="slide-up">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Exclusively for TCU Students
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#1A1033] leading-tight mb-6">
              Meet people.<br />
              <span className="text-primary">Find your circle.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-md">
              Discover fellow TCU students, connect through shared interests, and join an anonymous campus community.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => onNavigate("signup")} className="bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95">
                Get Started — Free
              </button>
              <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="bg-white text-[#1A1033] font-bold px-8 py-4 rounded-2xl border-2 border-slate-200 hover:border-primary hover:text-primary transition-all">
                Explore TCUnnect
              </button>
            </div>
            <p className="mt-6 text-sm text-slate-400">No GPS. No location tracking. Just campus connections.</p>
          </div>

          {/* Hero profile cards */}
          <div className="relative h-80 lg:h-96 flex items-center justify-center">
            <div className="absolute left-0 top-8 float" style={{ animationDelay: "0s" }}>
              <MiniProfileCard student={STUDENTS[0]} />
            </div>
            <div className="absolute left-32 top-0 float z-10" style={{ animationDelay: "0.5s" }}>
              <MiniProfileCard student={STUDENTS[1]} />
            </div>
            <div className="absolute right-0 top-12 float" style={{ animationDelay: "1s" }}>
              <MiniProfileCard student={STUDENTS[3]} />
            </div>
            {/* Match badge */}
            <div className="absolute left-36 bottom-0 bg-match text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-20 sparkle">
              🎉 It's a Match!
            </div>
            {/* Like heart */}
            <div className="absolute right-10 top-4 bg-like text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg sparkle" style={{ animationDelay: "0.8s" }}>
              ❤️
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="max-w-6xl mx-auto px-6 mt-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
            {[["500+", "TCU Students"], ["85%", "Match Rate"], ["₱30", "Lifetime Premium"]].map(([val, label]) => (
              <div key={label} className="py-5 text-center">
                <p className="text-2xl font-extrabold text-primary">{val}</p>
                <p className="text-sm text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl font-extrabold text-[#1A1033]">Three steps to connect</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "👤", title: "Create your profile", desc: "Add your department, year level, interests, photo, and optional bio." },
              { step: "02", icon: "🔍", title: "Discover people", desc: "Browse students and find people with shared interests across TCU." },
              { step: "03", icon: "🎉", title: "Match & connect", desc: "Like anonymously. If they like you back, you both get revealed and can chat." },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="bg-[#F8F7FF] rounded-3xl p-8 h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                  <span className="text-4xl font-extrabold text-primary opacity-15 absolute top-6 right-8">{item.step}</span>
                  <div className="text-4xl mb-5">{item.icon}</div>
                  <h3 className="text-xl font-bold text-[#1A1033] mb-3">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#F8F7FF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-extrabold text-[#1A1033]">Everything you need to connect</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all group cursor-default">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="font-bold text-lg text-[#1A1033] mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Campus Feed</p>
            <h2 className="text-4xl font-extrabold text-[#1A1033] mb-5">Say it anonymously.</h2>
            <p className="text-slate-500 leading-relaxed mb-8">
              Share thoughts, ask questions, vent about finals — all without revealing your identity. Real campus energy, zero judgment.
            </p>
            <button onClick={() => onNavigate("signup")} className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">
              Join the Community →
            </button>
          </div>
          <div className="space-y-4">
            {samplePosts.map((post, i) => (
              <div key={i} className="bg-[#F8F7FF] rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">🎭</div>
                  <div>
                    <p className="font-semibold text-sm text-[#1A1033]">Anonymous</p>
                    {post.dept && <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">{post.dept}</span>}
                  </div>
                </div>
                <p className="text-[#1A1033] text-sm mb-3">"{post.text}"</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>👍 {post.upvotes}</span>
                  <span>💬 Reply</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium */}
      <section id="premium" className="py-24 bg-gradient-to-br from-[#1A1033] to-[#2D1B69]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-premium/20 text-premium text-sm font-bold px-4 py-2 rounded-full mb-8">
            ⭐ TCUnnect Premium
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">See who's interested in you.</h2>
          <p className="text-3xl font-bold text-premium mb-2">₱30 Lifetime</p>
          <p className="text-slate-400 mb-12">Pay once. No monthly subscription.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-3xl mx-auto mb-12">
            {[
              "See everyone who liked you",
              "See everyone who viewed you",
              "Unlimited access",
              "Instant notifications",
              "Premium profile badge",
            ].map((b) => (
              <div key={b} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">✓</div>
                <p className="text-white text-xs font-medium">{b}</p>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate("signup")} className="bg-premium text-[#1A1033] font-extrabold px-10 py-4 rounded-2xl hover:opacity-90 transition-opacity text-lg">
            Get Premium — ₱30
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F0A1E] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo white />
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              {["About", "Safety", "Privacy", "Terms", "Contact"].map((l) => (
                <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
              ))}
            </div>
            <p className="text-sm text-slate-600">© 2026 TCUnnect</p>
          </div>
          <p className="text-center text-xs text-slate-700 mt-8">
            Meet. Match. Connect. — Exclusively for Taguig City University Students
          </p>
        </div>
      </footer>
    </div>
  );
}
