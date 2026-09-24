import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function ScrollArrow() {
  const [atBottom, setAtBottom] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(total > 200);
      setAtBottom(scrolled >= total - 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const handleClick = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
      className="fixed bottom-24 right-5 z-50 lg:bottom-8 lg:right-8
        h-11 w-11 rounded-full
        bg-sky-600 hover:bg-sky-500 active:scale-95
        text-white shadow-lg shadow-sky-700/30
        flex items-center justify-center
        transition-all duration-200"
    >
      {atBottom
        ? <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
        : <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
      }
    </button>
  );
}
