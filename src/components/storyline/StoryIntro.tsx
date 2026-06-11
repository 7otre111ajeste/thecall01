import { useState } from "react";

import { t, useLang } from "@/lib/i18n";
import { type NarrativeMode, type StoryModule } from "@/lib/storyline/stories";

import { LangToggle } from "./LangToggle";

export function StoryIntro({
  story,
  onStart,
  onBack,
}: {
  story: StoryModule;
  onStart: (mode: NarrativeMode) => void;
  onBack: () => void;
}) {
  const [lang] = useLang();
  const [showModes, setShowModes] = useState(false);
  const tagline = lang === "en" ? story.taglineEn : story.tagline;
  const synopsis = lang === "en" ? story.synopsisEn : story.synopsis;
  const locked = story.status === "locked";

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10 text-white"
      style={{
        background: `radial-gradient(ellipse at top, ${story.accent}33, #050505 60%), radial-gradient(ellipse at bottom, ${story.accent}11, transparent)`,
      }}
    >
      <div className="absolute right-5 top-5 z-10">
        <LangToggle />
      </div>
      <div className="w-full max-w-md text-center">
        <div
          className="mb-2 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse"
          style={{ color: story.accent }}
        >
          {tagline}
        </div>
        <h1 className="mb-6 text-6xl font-bold tracking-wider">{story.title}</h1>
        <p className="mb-10 text-base leading-relaxed text-white/70">{synopsis}</p>

        <p
          className="mb-8 font-mono text-sm uppercase tracking-[0.3em]"
          style={{ color: story.accent }}
        >
          {t("intro.ready", lang)}
        </p>

        {!showModes ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => !locked && onStart("realiste")}
              disabled={locked}
              className={`w-full rounded-md px-6 py-4 text-lg font-semibold uppercase tracking-widest text-white transition ${
                locked ? "cursor-not-allowed grayscale" : "hover:opacity-90"
              }`}
              style={{
                backgroundColor: locked ? "#1a1a1a" : story.accent,
                boxShadow: locked ? "none" : `0 0 30px ${story.accent}66`,
                opacity: locked ? 0.55 : 1,
                color: locked ? "rgba(255,255,255,0.4)" : "white",
              }}
            >
              {locked ? `🔒 ${t("menu.locked", lang)}` : t("intro.start", lang)}
            </button>
            {locked && (
              <p className="text-[11px] uppercase tracking-widest text-white/40">
                {t("intro.locked_sub", lang)}
              </p>
            )}
            <button
              onClick={() => !locked && setShowModes(true)}
              disabled={locked}
              className={`w-full rounded-md border px-6 py-3 text-sm uppercase tracking-widest ${
                locked ? "cursor-not-allowed opacity-40" : "hover:bg-white/5"
              }`}
              style={{ borderColor: `${story.accent}66`, color: story.accent }}
            >
              {t("intro.mode", lang)}
            </button>
            <button
              onClick={onBack}
              className="w-full rounded-md px-6 py-3 text-xs uppercase tracking-widest text-white/50 hover:text-white"
            >
              {t("intro.back", lang)}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
              {t("intro.choose_mode", lang)}
            </p>
            {story.modes.map((m) => (
              <button
                key={m}
                onClick={() => onStart(m)}
                className="rounded-md border px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-white/5"
                style={{ borderColor: `${story.accent}66` }}
              >
                {t(`mode.${m}`, lang)}
              </button>
            ))}
            <button
              onClick={() => setShowModes(false)}
              className="mt-2 text-xs uppercase tracking-widest text-white/40 hover:text-white"
            >
              {t("intro.cancel", lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
