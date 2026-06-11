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

  if (story.status === "locked") {
    return (
      <div
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-white"
        style={{
          background: `radial-gradient(ellipse at center, ${story.accent}22, #050505 70%)`,
        }}
      >
        <div className="absolute right-5 top-5 z-10">
          <LangToggle />
        </div>
        <div className="max-w-md text-center">
          <div
            className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em]"
            style={{ color: story.accent }}
          >
            {tagline}
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-wider">{story.title}</h1>
          <p className="mb-8 text-sm leading-relaxed text-white/60">{synopsis}</p>
          <div
            className="mb-8 rounded-lg border p-6"
            style={{ borderColor: `${story.accent}44`, backgroundColor: `${story.accent}11` }}
          >
            <p className="text-sm" style={{ color: story.accent }}>
              🔒 {t("intro.locked_title", lang)}
            </p>
            <p className="mt-2 text-xs text-white/50">{t("intro.locked_sub", lang)}</p>
          </div>
          <button
            onClick={onBack}
            className="rounded-md border border-white/20 px-6 py-3 text-sm uppercase tracking-widest text-white/70 hover:bg-white/5"
          >
            {t("intro.back", lang)}
          </button>
        </div>
      </div>
    );
  }

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
              onClick={() => onStart("realiste")}
              className="w-full rounded-md px-6 py-4 text-lg font-semibold uppercase tracking-widest text-white transition hover:opacity-90"
              style={{
                backgroundColor: story.accent,
                boxShadow: `0 0 30px ${story.accent}66`,
              }}
            >
              {t("intro.start", lang)}
            </button>
            <button
              onClick={() => setShowModes(true)}
              className="w-full rounded-md border px-6 py-3 text-sm uppercase tracking-widest hover:bg-white/5"
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
