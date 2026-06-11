import { useState } from "react";

import {
  NARRATIVE_MODE_LABELS,
  type NarrativeMode,
  type StoryModule,
} from "@/lib/storyline/stories";

export function StoryIntro({
  story,
  onStart,
  onBack,
}: {
  story: StoryModule;
  onStart: (mode: NarrativeMode) => void;
  onBack: () => void;
}) {
  const [showModes, setShowModes] = useState(false);

  if (story.status === "locked") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 text-white"
        style={{
          background: `radial-gradient(ellipse at center, ${story.accent}22, #050505 70%)`,
        }}
      >
        <div className="max-w-md text-center">
          <div
            className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em]"
            style={{ color: story.accent }}
          >
            {story.tagline}
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-wider">{story.title}</h1>
          <p className="mb-8 text-sm leading-relaxed text-white/60">{story.synopsis}</p>
          <div
            className="mb-8 rounded-lg border p-6"
            style={{ borderColor: `${story.accent}44`, backgroundColor: `${story.accent}11` }}
          >
            <p className="text-sm" style={{ color: story.accent }}>
              🔒 Cette histoire n'est pas encore disponible.
            </p>
            <p className="mt-2 text-xs text-white/50">
              Notre équipe finalise l'écriture des actes. Restez à l'écoute.
            </p>
          </div>
          <button
            onClick={onBack}
            className="rounded-md border border-white/20 px-6 py-3 text-sm uppercase tracking-widest text-white/70 hover:bg-white/5"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-white"
      style={{
        background: `radial-gradient(ellipse at top, ${story.accent}33, #050505 60%), radial-gradient(ellipse at bottom, ${story.accent}11, transparent)`,
      }}
    >
      <div className="w-full max-w-md text-center">
        <div
          className="mb-2 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse"
          style={{ color: story.accent }}
        >
          {story.tagline}
        </div>
        <h1 className="mb-6 text-6xl font-bold tracking-wider">{story.title}</h1>
        <p className="mb-10 text-base leading-relaxed text-white/70">{story.synopsis}</p>

        <p
          className="mb-8 font-mono text-sm uppercase tracking-[0.3em]"
          style={{ color: story.accent }}
        >
          ÊTES-VOUS PRÊT À RÉPONDRE ?
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
              Commencer
            </button>
            <button
              onClick={() => setShowModes(true)}
              className="w-full rounded-md border px-6 py-3 text-sm uppercase tracking-widest hover:bg-white/5"
              style={{ borderColor: `${story.accent}66`, color: story.accent }}
            >
              Mode narratif
            </button>
            <button
              onClick={onBack}
              className="w-full rounded-md px-6 py-3 text-xs uppercase tracking-widest text-white/50 hover:text-white"
            >
              ← Retour
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
              Choisir un ton narratif
            </p>
            {story.modes.map((m) => (
              <button
                key={m}
                onClick={() => onStart(m)}
                className="rounded-md border px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-white/5"
                style={{ borderColor: `${story.accent}66` }}
              >
                {NARRATIVE_MODE_LABELS[m]}
              </button>
            ))}
            <button
              onClick={() => setShowModes(false)}
              className="mt-2 text-xs uppercase tracking-widest text-white/40 hover:text-white"
            >
              ← Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
