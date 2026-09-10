type PageKey = "about" | "safety" | "privacy" | "terms" | "contact";

const pages: { key: PageKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "safety", label: "Safety" },
  { key: "privacy", label: "Privacy" },
  { key: "terms", label: "Terms" },
  { key: "contact", label: "Contact" },
];

export default function FooterPagesNav({ current, onNavigate, compact }: { current: PageKey; onNavigate: (v: string) => void; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "justify-center" : "mb-6"}`}>
      {pages.map((p) => (
        <button
          key={p.key}
          onClick={() => onNavigate(p.key)}
          disabled={p.key === current}
          className={`font-semibold rounded-xl transition-colors ${compact ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"} ${
            p.key === current
              ? "bg-primary text-white cursor-default"
              : "bg-white border border-[#E9E5F2] text-slate-500 hover:text-primary hover:border-primary/30"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
