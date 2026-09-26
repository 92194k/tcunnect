import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  textSize?: string;
}

const GRADIENTS = [
  "from-sky-400 to-sky-600",
  "from-rose-400 to-rose-500",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-500",
  "from-pink-400 to-pink-600",
  "from-teal-400 to-teal-600",
  "from-indigo-400 to-indigo-600",
];

function colorFor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * Avatar — shows a real photo when available, falls back to coloured initials.
 * Pass the same className you'd put on an <img> (sizing + rounded-*); the
 * component wraps everything in a div so both states inherit those styles.
 */
export default function Avatar({ src, name, className = "", textSize = "text-sm" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorFor(name)} ${className}`}>
      {/* Initials layer — always rendered, hidden when image is showing */}
      <span
        className={`absolute inset-0 flex items-center justify-center text-white font-bold select-none ${textSize} ${showImg ? "opacity-0" : "opacity-100"}`}
        aria-hidden={showImg}
      >
        {initials(name)}
      </span>
      {/* Photo layer — on error, sets failed=true → initials become visible */}
      {showImg && (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
