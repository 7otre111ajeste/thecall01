import { useLang } from "@/lib/i18n";

export function LangToggle({ className = "" }: { className?: string }) {
  const [lang, setLang] = useLang();
  return (
    <div
      className={`pointer-events-auto inline-flex items-center gap-px overflow-hidden rounded-full border border-white/15 bg-black/40 px-px font-mono text-[10px] uppercase tracking-widest backdrop-blur ${className}`}
    >
      <button
        onClick={() => setLang("fr")}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "fr" ? "bg-white/90 text-black" : "text-white/50 hover:text-white"
        }`}
        aria-label="Français"
      >
        FR
      </button>
      <button
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "en" ? "bg-white/90 text-black" : "text-white/50 hover:text-white"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
