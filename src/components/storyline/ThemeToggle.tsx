import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Mode clair" : "Mode sombre"}
      className={`pointer-events-auto inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border backdrop-blur transition ${
        isDark
          ? "border-white/15 bg-black/40 text-white/70 hover:text-white"
          : "border-black/15 bg-white/70 text-black/70 hover:text-black"
      } ${className}`}
    >
      {isDark ? <Sun size={13} /> : <Moon size={13} />}
    </button>
  );
}
