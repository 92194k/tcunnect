import { useState, useEffect, type ReactNode } from "react";
import Logo from "../components/Logo";
import FooterPagesNav from "../components/FooterPagesNav";

type Props = {
  page: "about" | "safety" | "contact";
  onNavigate: (v: string) => void;
};

export default function InfoPage({ page, onNavigate }: Props) {
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    function onScroll() {
      setAtTop(window.scrollY < 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const titles = { about: "About TCUnnect", safety: "Safety Tips", contact: "Contact Us" };

  return (
    <div className="min-h-screen bg-[#F8F7FC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E9E5F2]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-5 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate("landing")} className="text-sm font-semibold text-slate-500 hover:text-primary transition">
              ← Home
            </button>
            <button onClick={() => onNavigate("signup")} className="text-sm font-semibold text-primary hover:underline transition">
              Log In / Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-28">
        <FooterPagesNav current={page} onNavigate={onNavigate} />

        <div className="mb-7">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[#1A1033]">{titles[page]}</h1>
        </div>

        <div className="bg-white border border-[#E9E5F2] rounded-2xl shadow-sm">
          <div className="px-6 sm:px-9 py-7 sm:py-9">
            {page === "about" && <AboutContent />}
            {page === "safety" && <SafetyContent />}
            {page === "contact" && <ContactContent />}
          </div>
        </div>
      </main>

      {/* Pinned bottom nav — always reachable, same idea as the sticky header */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-t border-[#E9E5F2]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center gap-6">
          <button onClick={() => onNavigate("landing")} className="text-sm font-semibold text-slate-500 hover:text-primary transition">
            ← Back to Home
          </button>
          <button onClick={() => onNavigate("signup")} className="text-sm font-semibold text-primary hover:underline transition">
            Log In / Sign Up
          </button>
        </div>
      </div>

      {/* Scroll to top / bottom toggle */}
      <button
        onClick={() =>
          atTop
            ? window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
            : window.scrollTo({ top: 0, behavior: "smooth" })
        }
        aria-label={atTop ? "Scroll to bottom" : "Scroll to top"}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[#EC4899] text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300" style={{ transform: atTop ? "rotate(180deg)" : "rotate(0deg)" }}>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  );
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="py-5 border-b border-[#EEEAF4] last:border-0 last:pb-0 first:pt-0">
      {title && <h2 className="text-base sm:text-lg font-bold text-[#1A1033] mb-3">{title}</h2>}
      <div className="space-y-3 text-sm sm:text-[15px] leading-7 text-slate-600">{children}</div>
    </section>
  );
}

function AboutContent() {
  return (
    <article className="text-[#1A1033]">
      <p className="text-sm sm:text-[15px] leading-7 text-slate-600 mb-2">
        TCUnnect is a campus-based social discovery platform built exclusively for Taguig City University students —
        a place to discover people in your department (or outside it), express interest anonymously before revealing
        yourself, and connect for real once it's mutual.
      </p>

      <Section title="Why we built this">
        <p>
          College is full of people you'll never actually meet — different blocks, different years, different
          buildings. TCUnnect exists to close that gap: a smaller, campus-specific network where matches are more
          likely to actually mean something, because you already share the one thing that matters — you're both TCU.
        </p>
      </Section>

      <Section title="What makes it different">
        <p>
          No GPS, no location tracking — just your department, year, and interests. Every account is verified against
          a real school ID or COE, so you're not swiping through strangers off the wider internet. And the anonymous
          Campus Feed gives the community a place to talk that isn't tied to matching at all.
        </p>
      </Section>

      <Section title="Who's behind it">
        <p>
          TCUnnect is built and maintained by a small team of TCU students who wanted something better than group
          chats and mutual friends to actually meet people on campus.
        </p>
      </Section>
    </article>
  );
}

function SafetyContent() {
  return (
    <article className="text-[#1A1033]">
      <p className="text-sm sm:text-[15px] leading-7 text-slate-600 mb-2">
        Every TCUnnect account is verified, but that doesn't replace using your own good judgment. Here's how to stay
        safe while using the app and meeting people from it.
      </p>

      <Section title="Before you match">
        <p>Verification confirms someone is a real TCU student — it doesn't guarantee their intentions. Trust your instincts, and don't feel pressured to keep talking to someone who makes you uncomfortable.</p>
      </Section>

      <Section title="Protecting your information">
        <p>Avoid sharing your home address, class schedule, financial details, or other sensitive personal information with someone you've just matched with, no matter how the conversation is going.</p>
      </Section>

      <Section title="Meeting in person">
        <p>If you decide to meet someone from TCUnnect in real life:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Meet in a public place on campus first, ideally somewhere with other people around.</li>
          <li>Tell a friend where you're going and who you're meeting.</li>
          <li>Arrange your own way there and back — don't feel obligated to accept a ride from someone you just met.</li>
          <li>It's always okay to cancel or leave if something feels off.</li>
        </ul>
      </Section>

      <Section title="If something goes wrong">
        <p>
          Use Block immediately if someone makes you uncomfortable — it's silent, they won't be notified, and it
          stops all further contact. Use Report on any message, post, comment, or profile that violates our Terms;
          our team reviews every report.
        </p>
      </Section>

      <Section title="In an emergency">
        <p>
          If you're ever in immediate danger, contact local emergency services first — TCUnnect's reporting tools are
          for platform moderation, not emergency response.
        </p>
      </Section>
    </article>
  );
}

function ContactContent() {
  return (
    <article className="text-[#1A1033]">
      <p className="text-sm sm:text-[15px] leading-7 text-slate-600 mb-5">
        Questions, feedback, a safety concern, or something not working right? Reach out — we read everything that
        comes in.
      </p>

      <a
        href="mailto:alaokhemberly@gmail.com"
        className="inline-block font-semibold text-primary hover:underline text-lg"
      >
        alaokhemberly@gmail.com
      </a>

      <p className="text-sm text-slate-500 mt-6">
        For urgent safety concerns about another user, please also use the in-app Report feature on their profile,
        message, or post so our moderation team can act on it directly.
      </p>
    </article>
  );
}
