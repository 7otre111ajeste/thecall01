import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";

export function LangToggle({ className = "" }: { className?: string }) {
  const [lang, setLang] = useLang();
  const [theme] = useTheme();
  const isDark = theme === "dark";
  const activeCls = isDark ? "bg-white/90 text-black" : "bg-black/90 text-white";
  const inactiveCls = isDark
    ? "text-white/50 hover:text-white"
    : "text-black/50 hover:text-black";
  const wrapperCls = isDark
    ? "border-white/15 bg-black/40"
    : "border-black/15 bg-white/70";
  return (
    <div
      className={`pointer-events-auto inline-flex items-center gap-px overflow-hidden rounded-full border px-px font-mono text-[10px] uppercase tracking-widest backdrop-blur ${wrapperCls} ${className}`}
    >
      <button
        onClick={() => setLang("fr")}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "fr" ? activeCls : inactiveCls
        }`}
        aria-label="Français"
      >
        FR
      </button>
      <button
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "en" ? activeCls : inactiveCls
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
