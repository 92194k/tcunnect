type PageKey = "about" | "safety" | "privacy" | "terms" | "contact";

const pages: { key: PageKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "safety", label: "Safety" },
  { key: "privacy", label: "Privacy" },
  { key: "terms", label: "Terms" },
  { key: "contact", label: "Contact" },
];

export default function FooterPagesNav({ current, onNavigate }: { current: PageKey; onNavigate: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {pages.map((p) => (
        <button
          key={p.key}
          onClick={() => onNavigate(p.key)}
          disabled={p.key === current}
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
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
