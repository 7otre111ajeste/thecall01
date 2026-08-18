import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { generateClaireReply } from "@/lib/api/dialogue.functions";
import {
  clearAutoSave,
  getManualSaves,
  MAX_MANUAL_SAVES,
  overwriteManual,
  type SaveSlot,
  saveManual,
  upsertAutoSave,
} from "@/lib/game/saves";
import {
  isChoiceLocked,
  pickEnding,
  pickHint,
} from "@/lib/game/consequences";
import { SCENES, START_SCENE } from "@/lib/game/scenes";
import {
  initialWorldState,
  loc,
  type Message,
  type Speaker,
  type WorldState,
} from "@/lib/game/types";

import { t, useLang } from "@/lib/i18n";
import type { NarrativeMode } from "@/lib/storyline/stories";

import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";

const TIME_OPTIONS = [
  { label: "+1 min", minutes: 1 },
  { label: "+10 min", minutes: 10 },
  { label: "+15 min", minutes: 15 },
];

function formatGameTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatChrono(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function TheCallGame({
  mode,
  onExit,
  onBackToIntro,
  storyId,
  initialSave,
}: {
  mode: NarrativeMode;
  onExit: () => void;
  onBackToIntro: () => void;
  storyId: string;
  initialSave?: SaveSlot | null;
}) {
  const [lang] = useLang();
  const [world, setWorld] = useState<WorldState>(
    initialSave?.world
      ? { ...initialWorldState, ...initialSave.world }
      : initialWorldState,
  );
  const [sceneId, setSceneId] = useState<string>(
    initialSave?.sceneId ?? START_SCENE,
  );
  const [messages, setMessages] = useState<Message[]>(
    initialSave?.messages ?? [],
  );
  const [typing, setTyping] = useState<Speaker | null>(null);
  const [beatsDone, setBeatsDone] = useState(!!initialSave);
  const [freeText, setFreeText] = useState("");
  const [awaitingAi, setAwaitingAi] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [overwritePicker, setOverwritePicker] = useState<{ saves: SaveSlot[]; name: string } | null>(null);
  const [namePrompt, setNamePrompt] = useState<string | null>(null);
  const [exitPrompt, setExitPrompt] = useState<null | "exit" | "back">(null);
  const [chronoSeconds, setChronoSeconds] = useState(0);

  useEffect(() => {
    if (world.missionStatus !== "active") return;
    const id = setInterval(() => setChronoSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [world.missionStatus]);
  const pendingExitRef = useRef<null | "exit" | "back">(null);
  const enteredRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipNextBeatsRef = useRef<boolean>(!!initialSave);
  const advancePressesRef = useRef<number[]>([]);
  const usedReactionsRef = useRef<Set<string>>(new Set());
  const callClaire = useServerFn(generateClaireReply);
  const langRef = useRef(lang);
  langRef.current = lang;

  const scene = SCENES[sceneId];
  const sceneTitle = loc(scene.title, lang);


  useEffect(() => {
    setBeatsDone(skipNextBeatsRef.current);

    if (scene.onEnter && !skipNextBeatsRef.current) {
      setWorld((w) => ({ ...w, ...scene.onEnter }));
    }

    if (skipNextBeatsRef.current) {
      skipNextBeatsRef.current = false;
      return;
    }


    let cancelled = false;
    const runId = Math.random();
    enteredRef.current = sceneId + ":" + runId;
    const myToken = enteredRef.current;

    (async () => {
      for (const beat of scene.beats) {
        if (cancelled || enteredRef.current !== myToken) return;
        const delay = beat.delayMs ?? 600;
        if (beat.speaker === "claire" || beat.speaker === "unknown") {
          setTyping(beat.speaker);
          await sleep(delay);
          if (cancelled || enteredRef.current !== myToken) return;
          setTyping(null);
        } else {
          await sleep(delay);
          if (cancelled || enteredRef.current !== myToken) return;
        }
        const beatText = loc(beat.text, langRef.current);
        setMessages((m) => {
          // dedupe: avoid double-append from strict-mode remount
          if (m.some((x) => x.speaker === beat.speaker && x.text === beatText)) {
            return m;
          }
          return [
            ...m,
            {
              id: uid(),
              speaker: beat.speaker,
              text: beatText,
              timestamp: world.timeMinutes,
            },
          ];
        });

      }
      if (cancelled || enteredRef.current !== myToken) return;
      setBeatsDone(true);
      if (scene.autoAdvance) {
        await sleep(scene.autoAdvance.delayMs);
        if (cancelled || enteredRef.current !== myToken) return;
        setSceneId(scene.autoAdvance.nextScene);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Autosave on every meaningful state change (debounced)
  useEffect(() => {
    if (!beatsDone) return;
    const handle = setTimeout(() => {
      if (world.missionStatus === "active") {
        upsertAutoSave({ storyId, mode, sceneId, world, messages });
      } else {
        clearAutoSave(storyId);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [world, sceneId, messages, mode, storyId, beatsDone]);

  const defaultSaveName = useCallback(
    () => `${sceneTitle} · ${formatChrono(chronoSeconds)}`,
    [sceneTitle, chronoSeconds],
  );


  const runPendingExit = useCallback(() => {
    const target = pendingExitRef.current;
    pendingExitRef.current = null;
    if (target === "exit") onExit();
    else if (target === "back") onBackToIntro();
  }, [onExit, onBackToIntro]);

  const handleSaveGame = useCallback(() => {
    setNamePrompt(defaultSaveName());
  }, [defaultSaveName]);

  const handleConfirmName = useCallback(() => {
    const name = (namePrompt ?? "").trim() || defaultSaveName();
    const existing = getManualSaves(storyId);
    if (existing.length >= MAX_MANUAL_SAVES) {
      setOverwritePicker({ saves: existing, name });
      setNamePrompt(null);
      return;
    }
    saveManual({ storyId, mode, sceneId, world, messages, name });
    setNamePrompt(null);
    setSaveToast(t("game.saved", lang));
    setTimeout(() => setSaveToast(null), 1800);
    if (pendingExitRef.current) runPendingExit();
  }, [namePrompt, defaultSaveName, storyId, mode, sceneId, world, messages, lang, runPendingExit]);

  const handleOverwrite = useCallback(
    (slotId: string) => {
      const name = overwritePicker?.name ?? defaultSaveName();
      overwriteManual(slotId, { storyId, mode, sceneId, world, messages, name });
      setOverwritePicker(null);
      setSaveToast(t("game.saved", lang));
      setTimeout(() => setSaveToast(null), 1800);
      if (pendingExitRef.current) runPendingExit();
    },
    [overwritePicker, defaultSaveName, storyId, mode, sceneId, world, messages, lang, runPendingExit],
  );

  const cancelNamePrompt = useCallback(() => {
    setNamePrompt(null);
    pendingExitRef.current = null;
  }, []);

  const cancelOverwrite = useCallback(() => {
    setOverwritePicker(null);
    pendingExitRef.current = null;
  }, []);



  const requestExit = useCallback(
    (target: "exit" | "back") => {
      if (world.missionStatus !== "active" || messages.length === 0) {
        if (target === "exit") onExit();
        else onBackToIntro();
        return;
      }
      setExitPrompt(target);
    },
    [world.missionStatus, messages.length, onExit, onBackToIntro],
  );

  const confirmExit = useCallback(
    (save: boolean) => {
      const target = exitPrompt;
      setExitPrompt(null);
      if (save) {
        pendingExitRef.current = target;
        setNamePrompt(defaultSaveName());
        return;
      }
      if (target === "exit") onExit();
      else if (target === "back") onBackToIntro();
    },
    [exitPrompt, defaultSaveName, onExit, onBackToIntro],
  );


  const handleChoice = useCallback(
    (choiceId: string) => {
      const choice = scene.choices.find((c) => c.id === choiceId);
      if (!choice) return;
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          speaker: "player",
          text: loc(choice.label, lang),
          timestamp: world.timeMinutes,
        },
      ]);
      if (choice.effects) {
        setWorld((w) => ({ ...w, ...choice.effects }));
      }
      setTimeout(() => setSceneId(choice.nextScene), 400);
    },
    [scene, world.timeMinutes, lang],
  );


  const handleAdvanceTime = useCallback((minutes: number) => {
    if (awaitingAi) return;
    setChronoSeconds((s) => s + minutes * 60);

    // Track spam: count presses within last 12s of real time
    const now = Date.now();
    advancePressesRef.current = [
      ...advancePressesRef.current.filter((ts) => now - ts < 12000),
      now,
    ];
    const spamCount = advancePressesRef.current.length;

    let newTotal = 0;
    let newDanger = 0;
    setWorld((w) => {
      newTotal = w.timeMinutes + minutes;
      newDanger = clamp(w.dangerLevel + Math.ceil(minutes / 3) + (spamCount >= 3 ? 8 : 0));
      return {
        ...w,
        timeMinutes: newTotal,
        dangerLevel: newDanger,
        playerStress: clamp(w.playerStress + Math.ceil(minutes / 4)),
        claireConfiance: clamp(w.claireConfiance - Math.ceil(minutes / 8)),
      };
    });
    setMessages((m) => [
      ...m,
      {
        id: uid(),
        speaker: "system",
        text: `⏱ ${minutes} ${minutes > 1 ? t("game.time_elapsed_many", lang) : t("game.time_elapsed_one", lang)}`,
        timestamp: 0,
      },
    ]);

    const reactions = pickTimeReaction(minutes, newTotal, lang, {
      spamCount,
      used: usedReactionsRef.current,
      dangerLevel: newDanger,
    });
    if (reactions.length === 0) return;

    setAwaitingAi(true);
    let delay = 600;
    reactions.forEach((r, idx) => {
      const isLast = idx === reactions.length - 1;
      setTimeout(() => {
        if (r.speaker === "claire" || r.speaker === "unknown") {
          setTyping(r.speaker);
        }
      }, delay);
      delay += r.typingMs ?? 800;
      setTimeout(() => {
        setTyping(null);
        setMessages((m) => [
          ...m,
          { id: uid(), speaker: r.speaker, text: r.text, timestamp: 0 },
        ]);
        if (r.endsMission) {
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              speaker: "system",
              text:
                lang === "en" ? "— MISSION FAILED —" : "— MISSION ÉCHOUÉE —",
              timestamp: 0,
            },
          ]);
          setWorld((w) => ({
            ...w,
            missionStatus: "failed",
            claireLocation: "lost",
            dangerLevel: 100,
          }));
        }
        if (r.endsMissionSuccess) {
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              speaker: "system",
              text:
                lang === "en" ? "— MISSION COMPLETE —" : "— MISSION RÉUSSIE —",
              timestamp: 0,
            },
          ]);
          setWorld((w) => ({
            ...w,
            missionStatus: "complete",
            dangerLevel: 0,
          }));
        }
        if (isLast) setAwaitingAi(false);
      }, delay);
      delay += 400;
    });
  }, [lang, awaitingAi]);


  const handleFreeText = useCallback(async () => {
    const text = freeText.trim();
    if (!text || awaitingAi) return;
    setFreeText("");
    const playerMsg: Message = {
      id: uid(),
      speaker: "player",
      text,
      timestamp: world.timeMinutes,
    };
    setMessages((m) => [...m, playerMsg]);
    setAwaitingAi(true);
    setTyping("claire");
    try {
      const history = [...messages, playerMsg]
        .filter((m) => m.speaker !== "system")
        .slice(-20)
        .map((m) => ({ speaker: m.speaker, text: m.text }));

      const res = await callClaire({
        data: {
          playerMessage: text,
          sceneTitle,
          dangerLevel: world.dangerLevel,
          ravisseursPresents: world.ravisseursPresents,
          claireLocation: world.claireLocation,
          mode,
          lang,
          history,
          flags: world.flags,
          playerName: world.playerName ?? "",
          nameAsked: !!world.nameAsked,
          exchanges: messages.filter((m) => m.speaker === "player").length + 1,
        },
      });
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          speaker: "claire",
          text: res.reply,
          timestamp: world.timeMinutes,
        },
      ]);

      const flagsAdded = res.flagsAdded ?? [];

      // Compute next world (stats + flags) directly — keep setWorld pure (no setTimeout inside).
      const mergedFlags = Array.from(new Set([...world.flags, ...flagsAdded]));
      const nextWorld: WorldState = {
        ...world,
        flags: mergedFlags,
        playerName: res.playerName || world.playerName,
        nameAsked: world.nameAsked || res.askedName,
        claireConfiance: clamp(world.claireConfiance + (res.trustDelta ?? 0)),
        playerStress: clamp(world.playerStress + (res.stressDelta ?? 0)),
        dangerLevel: clamp(world.dangerLevel + (res.dangerDelta ?? 0)),
      };


      // Subtle hint (one at a time).
      const hint = pickHint(nextWorld, flagsAdded, lang);
      if (hint) {
        nextWorld.hintsShown = [...world.hintsShown, hint.id];
      }

      // Outcome resolution — pick a flavored variant.
      if (res.outcome === "success" || res.outcome === "failure") {
        const variant = pickEnding(nextWorld, mergedFlags, res.outcome);
        const narration = (res.outcomeNarration?.trim()) || variant.narration[lang];
        const endTag =
          res.outcome === "success"
            ? lang === "en" ? `— MISSION COMPLETE · ${variant.title.en} —` : `— MISSION ACCOMPLIE · ${variant.title.fr} —`
            : lang === "en" ? `— MISSION FAILED · ${variant.title.en} —` : `— MISSION ÉCHOUÉE · ${variant.title.fr} —`;
        nextWorld.missionStatus = res.outcome === "success" ? "complete" : "failed";
        nextWorld.claireLocation = res.outcome === "success" ? "rescued" : "lost";
        nextWorld.dangerLevel = res.outcome === "success" ? 10 : 100;
        setTimeout(() => {
          setMessages((m) => {
            if (m.some((x) => x.speaker === "system" && x.text === endTag)) return m;
            return [
              ...m,
              { id: uid(), speaker: "narrator", text: narration, timestamp: nextWorld.timeMinutes },
              { id: uid(), speaker: "system", text: endTag, timestamp: 0 },
            ];
          });
        }, 400);
      }

      setWorld(nextWorld);

      if (hint) {
        setTimeout(() => {
          setMessages((m) => {
            if (m.some((x) => x.speaker === "narrator" && x.text === hint.text)) return m;
            return [
              ...m,
              { id: uid(), speaker: "narrator", text: hint.text, timestamp: nextWorld.timeMinutes },
            ];
          });
        }, 250);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          speaker: "system",
          text: t("game.network_error", lang),
          timestamp: 0,
        },
      ]);
    } finally {
      setTyping(null);
      setAwaitingAi(false);
    }
  }, [freeText, awaitingAi, callClaire, scene.title, world, mode, lang, messages]);

  const dangerColor = useMemo(() => {
    if (world.dangerLevel >= 75) return "text-danger";
    if (world.dangerLevel >= 40) return "text-amber-400";
    return "text-emerald-400";
  }, [world.dangerLevel]);

  return (
    <div className="storyline-themed flex h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col gap-y-2 px-4 py-2 text-xs font-mono sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              onClick={() => requestExit("exit")}
              className="mr-1 shrink-0 rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
              title={t("game.back_title", lang)}
            >
              ←
            </button>
            <span
              className={`pulse-danger inline-block h-2 w-2 shrink-0 rounded-full ${
                world.dangerLevel >= 60 ? "bg-danger" : "bg-emerald-500"
              }`}
            />
            <span className="text-muted-foreground">CALL</span>
            <span className="font-semibold tabular-nums">{formatChrono(chronoSeconds)}</span>
            <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
              {mode}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stat label={t("game.stress", lang)} value={world.playerStress} color="text-amber-400" />
            <Stat label={t("game.danger", lang)} value={world.dangerLevel} color={dangerColor} />
            <Stat label={t("game.bond", lang)} value={world.claireConfiance} color="text-claire" />
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          {sceneTitle} ·{" "}
          {world.missionStatus === "active"
            ? t("game.mission_active", lang)
            : world.missionStatus === "failed"
              ? t("game.mission_failed", lang)
              : t("game.mission_done", lang)}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
      >
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        {typing && <TypingBubble speaker={typing} />}
      </div>

      <footer className="border-t border-border bg-card/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          {world.missionStatus !== "active" ? (
            <div className="flex flex-col gap-2">
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
                {world.missionStatus === "failed"
                  ? t("game.mission_failed", lang)
                  : t("game.mission_done", lang)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onBackToIntro}
                  className="flex-1 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  {t("game.back_to_intro", lang)}
                </button>
                <button
                  onClick={onExit}
                  className="rounded-md border border-border px-4 py-3 text-sm hover:bg-accent"
                >
                  {t("game.menu", lang)}
                </button>
              </div>
            </div>
          ) : scene.choices.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">...</p>
          ) : !beatsDone ? (
            <p className="text-center text-xs italic text-muted-foreground">
              {t("game.claire_speaks", lang)}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-2">
                {scene.choices
                  .filter((c) => {
                    if (c.requiresFlag && !world.flags.includes(c.requiresFlag)) return false;
                    if (c.blockedByFlag && world.flags.includes(c.blockedByFlag)) return false;
                    if (isChoiceLocked(c.id, world.flags)) return false;
                    return true;
                  })
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleChoice(c.id)}
                      className="rounded-md border border-border bg-secondary px-3 py-2 text-left text-sm text-secondary-foreground transition hover:border-primary hover:bg-accent"
                    >
                      {loc(c.label, lang)}
                    </button>
                  ))}
              </div>

              {scene.allowFreeText && (
                <div className="flex gap-2">
                  <input
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFreeText();
                    }}
                    placeholder={t("game.write_to_claire", lang)}
                    disabled={awaitingAi}
                    className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
                  />
                  <button
                    onClick={handleFreeText}
                    disabled={awaitingAi || !freeText.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                  >
                    {t("game.send", lang)}
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("game.advance_time", lang)}
                </span>
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.minutes}
                    onClick={() => handleAdvanceTime(opt.minutes)}
                    className="rounded border border-border bg-secondary px-2 py-1 text-xs hover:border-primary"
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={handleSaveGame}
                  className="ml-auto rounded border border-primary/60 bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
                >
                  💾 {t("game.save", lang)}
                </button>
              </div>
              {saveToast && (
                <p className="text-center text-[11px] text-muted-foreground">
                  {saveToast}
                </p>
              )}
            </div>
          )}
        </div>
      </footer>

      {overwritePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={cancelOverwrite}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-center text-sm font-semibold text-foreground">
              {t("game.overwrite_title", lang)}
            </p>
            <div className="flex flex-col gap-2">
              {overwritePicker.saves.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleOverwrite(s.id)}
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-left text-xs text-secondary-foreground hover:border-primary hover:bg-accent"
                >
                  <div className="truncate font-semibold">{s.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.mode} ·{" "}
                    {new Date(s.savedAt).toLocaleString(
                      lang === "en" ? "en-US" : "fr-FR",
                      { dateStyle: "short", timeStyle: "short" },
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={cancelOverwrite}
              className="mt-4 w-full rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:bg-accent"
            >
              {t("intro.cancel_btn", lang)}
            </button>
          </div>
        </div>
      )}

      {exitPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setExitPrompt(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-center text-sm font-semibold text-foreground">
              {t("game.exit_title", lang)}
            </p>
            <p className="mb-4 text-center text-xs text-muted-foreground">
              {t("game.exit_desc", lang)}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => confirmExit(true)}
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                💾 {t("game.exit_save_quit", lang)}
              </button>
              <button
                onClick={() => confirmExit(false)}
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-accent"
              >
                {t("game.exit_quit", lang)}
              </button>
              <button
                onClick={() => setExitPrompt(null)}
                className="mt-1 rounded-md px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:bg-accent"
              >
                {t("intro.cancel_btn", lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {namePrompt !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={cancelNamePrompt}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-center text-sm font-semibold text-foreground">
              {t("game.name_save_title", lang)}
            </p>
            <p className="mb-3 text-center text-xs text-muted-foreground">
              {t("game.name_save_desc", lang)}
            </p>
            <input
              autoFocus
              value={namePrompt}
              onChange={(e) => setNamePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmName();
              }}
              maxLength={60}
              className="mb-4 w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={cancelNamePrompt}
                className="flex-1 rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:bg-accent"
              >
                {t("intro.cancel_btn", lang)}
              </button>
              <button
                onClick={handleConfirmName}
                className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:opacity-90"
              >
                💾 {t("game.save_btn", lang)}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="border-t border-border bg-card/90 py-1 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("menu.footer", lang)}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  const { speaker, text } = message;

  if (speaker === "system") {
    return (
      <div className="msg-enter mx-auto my-1 max-w-md text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {text}
      </div>
    );
  }
  if (speaker === "narrator") {
    return (
      <div className="msg-enter mx-auto my-1 max-w-md text-center text-xs italic text-muted-foreground">
        {text}
      </div>
    );
  }
  if (speaker === "player") {
    return (
      <div className="msg-enter flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          {text}
        </div>
      </div>
    );
  }
  if (speaker === "unknown") {
    return (
      <div className="msg-enter flex justify-start">
        <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-unknown/40 bg-unknown/10 px-4 py-2 text-sm text-unknown">
          <div className="mb-1 text-[10px] uppercase tracking-widest opacity-70">
            ??? · masqué
          </div>
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="msg-enter flex justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-card px-4 py-2 text-sm text-claire shadow">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          Claire
        </div>
        {text}
      </div>
    </div>
  );
}

function TypingBubble({ speaker }: { speaker: Speaker }) {
  const isClaire = speaker === "claire";
  return (
    <div className="flex justify-start">
      <div
        className={`flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3 ${
          isClaire ? "bg-card" : "border border-unknown/40 bg-unknown/10"
        }`}
      >
        <span className="typing-dot" style={{ animationDelay: "0ms" }} />
        <span className="typing-dot" style={{ animationDelay: "150ms" }} />
        <span className="typing-dot" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

type TimeReaction = {
  speaker: Speaker;
  text: string;
  typingMs?: number;
  endsMission?: boolean;
  endsMissionSuccess?: boolean;
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickFresh(arr: string[], used: Set<string>): string {
  const fresh = arr.filter((s) => !used.has(s));
  const chosen = fresh.length > 0 ? pick(fresh) : pick(arr);
  used.add(chosen);
  return chosen;
}

function pickTimeReaction(
  minutes: number,
  totalMinutes: number,
  lang: "fr" | "en",
  ctx: { spamCount: number; used: Set<string>; dangerLevel: number },
): TimeReaction[] {
  const { spamCount, used, dangerLevel } = ctx;
  const en = lang === "en";

  // SPAM: 4+ rapid presses → kidnappers detect the call → mission fails
  if (spamCount >= 4) {
    return [
      {
        speaker: "narrator",
        text: en
          ? "Rustling. Someone grabs the phone from her hands."
          : "Un bruissement. Quelqu'un lui arrache le téléphone des mains.",
        typingMs: 1100,
      },
      {
        speaker: "unknown",
        text: en
          ? "Stop calling. Now you've got a problem."
          : "Arrête de rappeler. Maintenant t'as un problème.",
        typingMs: 1300,
        endsMission: true,
      },
    ];
  }

  // SPAM: 3 rapid presses → kidnapper notices, warning shot
  if (spamCount === 3) {
    return [
      {
        speaker: "narrator",
        text: en
          ? "A floorboard creaks. Someone is listening."
          : "Une latte de plancher craque. Quelqu'un écoute.",
        typingMs: 1000,
      },
      {
        speaker: "claire",
        text: pickFresh(
          en
            ? [
                "Shh — I think they heard. Don't make me talk.",
                "Someone's coming. Wait. Just wait.",
              ]
            : [
                "Chut — je crois qu'ils ont entendu. Me fais pas parler.",
                "Quelqu'un arrive. Attends. Attends juste.",
              ],
          used,
        ),
        typingMs: 1200,
      },
    ];
  }

  // ENDING based on total elapsed time (>= 90 in-game min)
  if (totalMinutes >= 90) {
    if (dangerLevel >= 70) {
      return [
        {
          speaker: "narrator",
          text: en
            ? "A muffled noise. Footsteps. The kidnappers found the phone."
            : "Un bruit étouffé. Des pas. Les ravisseurs ont trouvé le téléphone.",
          typingMs: 1200,
        },
        {
          speaker: "unknown",
          text: en
            ? "...who is this? ...don't call back."
            : "...c'est qui ça ? ...rappelle plus.",
          typingMs: 1400,
          endsMission: true,
        },
      ];
    }
    return [
      {
        speaker: "narrator",
        text: en
          ? "Sirens in the distance. Tires on gravel. Voices shouting orders."
          : "Des sirènes au loin. Des pneus sur le gravier. Des voix qui crient des ordres.",
        typingMs: 1300,
      },
      {
        speaker: "claire",
        text: en
          ? "They're here. Oh god — they're here. Thank you. Thank you."
          : "Ils sont là. Mon dieu — ils sont là. Merci. Merci.",
        typingMs: 1500,
        endsMissionSuccess: true,
      },
    ];
  }

  // 45+ in-game min : major scenario beat
  if (totalMinutes >= 45) {
    return [
      {
        speaker: "narrator",
        text: pickFresh(
          en
            ? [
                "An engine starts in the distance. A door slams.",
                "A radio crackles in another room.",
                "Heavy steps pace overhead.",
              ]
            : [
                "Un moteur démarre au loin. Une portière claque.",
                "Une radio grésille dans une autre pièce.",
                "Des pas lourds font les cent pas au-dessus.",
              ],
          used,
        ),
        typingMs: 1100,
      },
      {
        speaker: "claire",
        text: pickFresh(
          en
            ? [
                "They came back. They tied me to something. I can't move.",
                "I think we moved. I don't recognize anything anymore.",
                "I hear voices. Closer. Closer. Are you still there?",
              ]
            : [
                "Ils sont revenus. Ils m'ont attachée à quelque chose. Je peux plus bouger.",
                "Je crois qu'on a bougé. Je reconnais plus rien.",
                "J'entends des voix. Plus proches. Plus proches. T'es encore là ?",
              ],
          used,
        ),
        typingMs: 1600,
      },
    ];
  }

  // 15+ in-game min : Claire grows anxious
  if (totalMinutes >= 15) {
    return [
      {
        speaker: "claire",
        text: pickFresh(
          en
            ? [
                "Hello? Are you still there?",
                "Please don't hang up. Say something.",
                "I'm scared. The silence is worse than them.",
                "Why aren't you answering? Please.",
              ]
            : [
                "Allô ? T'es toujours là ?",
                "Raccroche pas. Dis quelque chose.",
                "J'ai peur. Le silence c'est pire qu'eux.",
                "Pourquoi tu réponds pas ? S'il te plaît.",
              ],
          used,
        ),
        typingMs: 1300,
      },
    ];
  }

  // early : small whisper
  return [
    {
      speaker: "claire",
      text: pickFresh(
        en
          ? ["...still here?", "(breathing)", "...please don't leave."]
          : ["...t'es là ?", "(respiration)", "...pars pas, s'il te plaît."],
        used,
      ),
      typingMs: 900,
    },
  ];
}

