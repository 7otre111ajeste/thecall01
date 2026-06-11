import { useEffect, useState } from "react";

import {
  clearAutoSave,
  deleteSave,
  getAutoSave,
  getManualSaves,
  type SaveSlot,
} from "@/lib/game/saves";
import { t, useLang } from "@/lib/i18n";
import { type NarrativeMode, type StoryModule } from "@/lib/storyline/stories";

import { LangToggle } from "./LangToggle";

type PendingDelete =
  | { kind: "manual"; save: SaveSlot }
  | { kind: "auto" }
  | null;

export function StoryIntro({
  story,
  onStart,
  onBack,
  onResume,
}: {
  story: StoryModule;
  onStart: (mode: NarrativeMode) => void;
  onBack: () => void;
  onResume: (save: SaveSlot) => void;
}) {
  const [lang] = useLang();
  const [showModes, setShowModes] = useState(false);
  const [auto, setAuto] = useState<SaveSlot | null>(null);
  const [manual, setManual] = useState<SaveSlot[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const refresh = () => {
    setAuto(getAutoSave(story.id));
    setManual(getManualSaves(story.id));
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "manual") {
      deleteSave(pendingDelete.save.id);
    } else {
      clearAutoSave(story.id);
    }
    setPendingDelete(null);
    refresh();
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("storyline:saves-change", onChange);
    return () => window.removeEventListener("storyline:saves-change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id]);

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
        <p className="mb-8 text-base leading-relaxed text-white/70">{synopsis}</p>

        {!locked && auto && (
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => onResume(auto)}
              className="flex-1 rounded-md border-2 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:opacity-90"
              style={{
                borderColor: story.accent,
                backgroundColor: `${story.accent}22`,
              }}
            >
              ▶ {t("intro.continue", lang)}
            </button>
            <button
              onClick={() => setPendingDelete({ kind: "auto" })}
              className="rounded-md border-2 px-3 text-sm uppercase tracking-widest text-white/70 hover:bg-white/10"
              style={{ borderColor: `${story.accent}55` }}
              title={t("intro.delete", lang)}
            >
              ✕
            </button>
          </div>
        )}

        <p
          className="mb-6 font-mono text-sm uppercase tracking-[0.3em]"
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
              {locked
                ? `🔒 ${t("menu.locked", lang)}`
                : auto
                  ? t("intro.new_game", lang)
                  : t("intro.start", lang)}
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

        {!locked && (
          <div className="mt-10 border-t border-white/10 pt-6 text-left">
            <p
              className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.3em]"
              style={{ color: story.accent }}
            >
              {t("intro.saves", lang)} ({manual.length}/3)
            </p>
            {manual.length === 0 ? (
              <p className="text-center text-xs italic text-white/40">
                {t("intro.no_saves", lang)}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {manual.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white/80">{s.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">
                        {s.mode} ·{" "}
                        {new Date(s.savedAt).toLocaleString(
                          lang === "en" ? "en-US" : "fr-FR",
                          { dateStyle: "short", timeStyle: "short" },
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => onResume(s)}
                      className="rounded border px-2 py-1 text-[10px] uppercase tracking-widest hover:bg-white/10"
                      style={{ borderColor: story.accent, color: story.accent }}
                    >
                      {t("intro.load", lang)}
                    </button>
                    <button
                      onClick={() =>
                        setPendingDelete({ kind: "manual", save: s })
                      }
                      className="rounded border border-white/20 px-2 py-1 text-[10px] uppercase tracking-widest text-white/60 hover:bg-white/10"
                      title={t("intro.delete", lang)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg border border-white/15 bg-[#0a0a0a] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-sm font-semibold text-white">
              {t("intro.confirm_delete_title", lang)}
            </p>
            <p className="mb-1 text-xs text-white/60">
              {pendingDelete.kind === "manual"
                ? pendingDelete.save.name
                : t("intro.continue", lang)}
            </p>
            <p className="mb-5 text-[11px] uppercase tracking-widest text-white/40">
              {t("intro.confirm_delete_desc", lang)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-widest text-white/70 hover:bg-white/5"
              >
                {t("intro.cancel_btn", lang)}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-red-500"
              >
                {t("intro.confirm", lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
