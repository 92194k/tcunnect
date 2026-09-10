type LogoProps = {
  size?: "sm" | "md" | "lg";
  white?: boolean;
};

export default function Logo({ size = "md", white = false }: LogoProps) {
  const dims = { sm: 22, md: 28, lg: 40 };
  const textSizes = { sm: "text-base", md: "text-xl", lg: "text-3xl" };
  const s = dims[size];

  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="16" r="9" fill="url(#lg1)" />
        <circle cx="22" cy="16" r="9" fill="url(#lg2)" opacity="0.88" />
        <path
          d="M16 9.5c2.5 2 3.5 4.5 0 6.5-3.5 2-2.5 4.5 0 6.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <defs>
          <linearGradient id="lg1" x1="1" y1="7" x2="19" y2="25">
            <stop stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#6C3AE8" />
          </linearGradient>
          <linearGradient id="lg2" x1="13" y1="7" x2="31" y2="25">
            <stop stopColor="#6C3AE8" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={`font-display font-bold ${textSizes[size]} ${white ? "text-white" : "text-[#1A1033]"} tracking-tight`}
      >
        TCU<span style={{ color: white ? "#C4B5FD" : "#6C3AE8" }}>nnect</span>
      </span>
    </div>
  );
}
