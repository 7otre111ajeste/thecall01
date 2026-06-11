import { useEffect, useState } from "react";

import { t, useLang } from "@/lib/i18n";
import {
  getPlayCount,
  seedPlayCounts,
  STORIES,
  type StoryModule,
} from "@/lib/storyline/stories";
import { useTheme } from "@/lib/theme";

import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";

export function HomeMenu({ onSelect }: { onSelect: (story: StoryModule) => void }) {
  const [lang] = useLang();
  const [theme] = useTheme();
  const isDark = theme === "dark";
  const [, setTick] = useState(0);

  useEffect(() => {
    seedPlayCounts();
    setTick((t) => t + 1);
    const i = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      className={`relative min-h-screen px-6 py-10 transition-colors ${
        isDark ? "bg-black text-white" : "bg-[#f6f6f4] text-black"
      }`}
    >
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>

      <header className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-[0.25em]">MY STORYLINE</h1>
        <p
          className={`mt-2 font-mono text-[8px] uppercase tracking-[0.4em] ${
            isDark ? "text-white/25" : "text-black/40"
          }`}
        >
          {t("menu.tagline", lang)}
        </p>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {STORIES.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            lang={lang}
            isDark={isDark}
            onSelect={() => onSelect(s)}
          />
        ))}
      </div>

      <p
        className={`mx-auto mt-12 max-w-2xl text-center font-mono text-[10px] uppercase tracking-widest ${
          isDark ? "text-white/30" : "text-black/40"
        }`}
      >
        {t("menu.footer", lang)}
      </p>
    </div>
  );
}

function StoryCard({
  story,
  lang,
  isDark,
  onSelect,
}: {
  story: StoryModule;
  lang: "fr" | "en";
  isDark: boolean;
  onSelect: () => void;
}) {
  const locked = story.status === "locked";
  const plays = getPlayCount(story.id);
  const tagline = lang === "en" ? story.taglineEn : story.tagline;
  const synopsis = lang === "en" ? story.synopsisEn : story.synopsis;

  const cardCls = isDark
    ? "border-white/10 hover:border-white/25"
    : "border-black/10 hover:border-black/25";
  const plays_cls = isDark ? "text-white/35" : "text-black/45";
  const synopsis_cls = isDark ? "text-white/55" : "text-black/65";
  const border_t_cls = isDark ? "border-white/5" : "border-black/5";
  const arrow_cls = isDark
    ? "text-white/30 group-hover:text-white/60"
    : "text-black/30 group-hover:text-black/60";

  const baseBg = isDark ? "#0a0a0a" : "#ffffff";
  const accentAlpha = isDark ? "2e" : "26"; // ~18% / 15%
  const cardBg = `linear-gradient(180deg, ${story.accent}${accentAlpha} 0%, ${baseBg} 85%)`;

  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-lg border px-5 py-4 text-left transition-all hover:-translate-y-px ${cardCls} ${
        locked ? "opacity-80" : ""
      }`}
      style={{ background: cardBg }}
    >

      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[4px]"
        style={{ background: story.accent, opacity: locked ? 0.35 : 1 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
        style={{ background: story.accent, filter: "blur(40px)" }}
      />

      <div className="flex items-baseline justify-between gap-3">
        <div
          className="font-mono text-[9px] uppercase tracking-[0.35em]"
          style={{ color: story.accent }}
        >
          {tagline}
        </div>
        <span className={`font-mono text-[9px] uppercase tracking-widest ${plays_cls}`}>
          {plays.toLocaleString(lang === "en" ? "en-US" : "fr-FR")} {t("menu.plays", lang)}
        </span>
      </div>

      <h3 className="mt-1.5 text-lg font-semibold tracking-[0.15em]">{story.title}</h3>
      <p className={`mt-1.5 line-clamp-2 text-[13px] leading-snug ${synopsis_cls}`}>
        {synopsis}
      </p>

      <div className={`mt-3 flex items-center justify-between border-t pt-2.5 ${border_t_cls}`}>
        {locked ? (
          <span className={`font-mono text-[9px] uppercase tracking-widest ${plays_cls}`}>
            🔒 {t("menu.locked", lang)}
          </span>
        ) : (
          <span
            className="font-mono text-[9px] uppercase tracking-widest"
            style={{ color: story.accent }}
          >
            ▶ {t("menu.available", lang)}
          </span>
        )}
        <span className={`font-mono text-[10px] transition ${arrow_cls}`}>→</span>
      </div>
    </button>
  );
}
