import { useEffect, useState } from "react";

import {
  getPlayCount,
  seedPlayCounts,
  STORIES,
  type StoryModule,
} from "@/lib/storyline/stories";

export function HomeMenu({ onSelect }: { onSelect: (story: StoryModule) => void }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    seedPlayCounts();
    setTick((t) => t + 1);
    const i = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-[0.3em]">STORYLINE</h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40">
          Choose your story
        </p>
      </header>

      <div className="mx-auto grid max-w-3xl gap-5">
        {STORIES.map((s) => (
          <StoryCard key={s.id} story={s} onSelect={() => onSelect(s)} />
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-3xl text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
        Plus d'histoires bientôt · STORYLINE v0.1
      </p>
    </div>
  );
}

function StoryCard({ story, onSelect }: { story: StoryModule; onSelect: () => void }) {
  const locked = story.status === "locked";
  const plays = getPlayCount(story.id);

  return (
    <button
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br p-6 text-left transition-all hover:border-white/30 ${
        locked ? "opacity-50 grayscale" : "hover:scale-[1.01]"
      }`}
      style={{
        backgroundImage: `radial-gradient(ellipse at top left, ${story.accent}22, transparent 60%), linear-gradient(135deg, #0a0a0a, #161616)`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div
            className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: story.accent }}
          >
            {story.tagline}
          </div>
          <h3 className="text-2xl font-bold tracking-wider">{story.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-white/60 line-clamp-2">
            {story.synopsis}
          </p>
        </div>
        <div
          className="h-14 w-14 shrink-0 rounded-full border border-white/10"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${story.accent}, transparent 70%)`,
            boxShadow: locked ? "none" : `0 0 30px ${story.accent}55`,
          }}
        />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        {locked ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            🔒 Bientôt disponible
          </span>
        ) : (
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: story.accent }}
          >
            ▶ Disponible
          </span>
        )}
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          {plays.toLocaleString("fr-FR")} parties
        </span>
      </div>
    </button>
  );
}
