import { useEffect, useState } from "react";

import { t, useLang } from "@/lib/i18n";
import {
  getPlayCount,
  seedPlayCounts,
  STORIES,
  type StoryModule,
} from "@/lib/storyline/stories";

import { LangToggle } from "./LangToggle";

export function HomeMenu({ onSelect }: { onSelect: (story: StoryModule) => void }) {
  const [lang] = useLang();
  const [, setTick] = useState(0);

  useEffect(() => {
    seedPlayCounts();
    setTick((t) => t + 1);
    const i = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative min-h-screen bg-black px-6 py-10 text-white">
      <div className="absolute right-5 top-5 z-10">
        <LangToggle />
      </div>

      <header className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-2xl font-bold tracking-[0.25em]">MY STORYLINE</h1>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.4em] text-white/25">
          {t("menu.tagline", lang)}
        </p>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {STORIES.map((s) => (
          <StoryCard key={s.id} story={s} lang={lang} onSelect={() => onSelect(s)} />
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-2xl text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
        {t("menu.footer", lang)}
      </p>
    </div>
  );
}

function StoryCard({
  story,
  lang,
  onSelect,
}: {
  story: StoryModule;
  lang: "fr" | "en";
  onSelect: () => void;
}) {
  const locked = story.status === "locked";
  const plays = getPlayCount(story.id);
  const tagline = lang === "en" ? story.taglineEn : story.tagline;
  const synopsis = lang === "en" ? story.synopsisEn : story.synopsis;

  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a] px-5 py-4 text-left transition-all hover:-translate-y-px hover:border-white/25 hover:bg-[#101010] ${
        locked ? "opacity-80" : ""
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[2px]"
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
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">
          {plays.toLocaleString(lang === "en" ? "en-US" : "fr-FR")} {t("menu.plays", lang)}
        </span>
      </div>

      <h3 className="mt-1.5 text-lg font-semibold tracking-[0.15em]">{story.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/55">{synopsis}</p>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
        {locked ? (
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">
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
        <span className="font-mono text-[10px] text-white/30 transition group-hover:text-white/60">
          →
        </span>
      </div>
    </button>
  );
}
