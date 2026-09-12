type PageKey = "about" | "safety" | "privacy" | "terms" | "contact";

const pages: { key: PageKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "safety", label: "Safety" },
  { key: "privacy", label: "Privacy" },
  { key: "terms", label: "Terms" },
  { key: "contact", label: "Contact" },
];

export default function FooterPagesNav({
  current,
  onNavigate,
  compact,
}: {
  current: PageKey;
  onNavigate: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "justify-center" : "mb-6"}`}>
      {pages.map((p) => (
        <button
          key={p.key}
          onClick={() => onNavigate(p.key)}
          disabled={p.key === current}
          className={`font-semibold rounded-full transition-all text-xs px-4 py-1.5 ${
            p.key === current
              ? "bg-primary text-white cursor-default shadow-sm"
              : "bg-white border border-[#E9E5F2] text-slate-500 hover:text-primary hover:border-primary/40"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
