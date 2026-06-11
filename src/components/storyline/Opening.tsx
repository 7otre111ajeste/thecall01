import { useEffect } from "react";

export function Opening({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="storyline-logo">
          <h1 className="text-5xl font-bold tracking-[0.35em] text-white sm:text-7xl">
            STORYLINE
          </h1>
          <div className="mx-auto mt-4 h-px w-0 bg-white storyline-line" />
          <p className="storyline-tag mt-6 font-mono text-[10px] uppercase tracking-[0.5em] text-white/40">
            Interactive Narrative Platform
          </p>
        </div>
      </div>
      <button
        onClick={onDone}
        className="absolute bottom-8 right-8 font-mono text-[10px] uppercase tracking-widest text-white/30 hover:text-white/70"
      >
        Passer →
      </button>
    </div>
  );
}
