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
import { SCENES, START_SCENE } from "@/lib/game/scenes";
import {
  initialWorldState,
  type Message,
  type Speaker,
  type WorldState,
} from "@/lib/game/types";
import { t, useLang } from "@/lib/i18n";
import type { NarrativeMode } from "@/lib/storyline/stories";

import { LangToggle } from "./LangToggle";

const TIME_OPTIONS = [
  { label: "+1 min", minutes: 1 },
  { label: "+10 min", minutes: 10 },
  { label: "+1 h", minutes: 60 },
];

function formatGameTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
    initialSave?.world ?? initialWorldState,
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
  const [overwritePicker, setOverwritePicker] = useState<SaveSlot[] | null>(null);
  const enteredRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipNextBeatsRef = useRef<boolean>(!!initialSave);
  const callClaire = useServerFn(generateClaireReply);

  const scene = SCENES[sceneId];

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
        setMessages((m) => {
          // dedupe: avoid double-append from strict-mode remount
          if (m.some((x) => x.speaker === beat.speaker && x.text === beat.text)) {
            return m;
          }
          return [
            ...m,
            {
              id: uid(),
              speaker: beat.speaker,
              text: beat.text,
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

  const handleSaveGame = useCallback(() => {
    const existing = getManualSaves(storyId);
    if (existing.length >= MAX_MANUAL_SAVES) {
      setOverwritePicker(existing);
      return;
    }
    const res = saveManual({
      storyId,
      mode,
      sceneId,
      world,
      messages,
      name: `${scene.title} · ${formatGameTime(world.timeMinutes)}`,
    });
    if (res.ok) {
      setSaveToast(t("game.saved", lang));
      setTimeout(() => setSaveToast(null), 1800);
    }
  }, [storyId, mode, sceneId, world, messages, scene.title, lang]);

  const handleOverwrite = useCallback(
    (slotId: string) => {
      overwriteManual(slotId, {
        storyId,
        mode,
        sceneId,
        world,
        messages,
      });
      setOverwritePicker(null);
      setSaveToast(t("game.saved", lang));
      setTimeout(() => setSaveToast(null), 1800);
    },
    [storyId, mode, sceneId, world, messages, lang],
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
          text: choice.label,
          timestamp: world.timeMinutes,
        },
      ]);
      if (choice.effects) {
        setWorld((w) => ({ ...w, ...choice.effects }));
      }
      setTimeout(() => setSceneId(choice.nextScene), 400);
    },
    [scene, world.timeMinutes],
  );

  const handleAdvanceTime = useCallback((minutes: number) => {
    if (awaitingAi) return;
    let newTotal = 0;
    setWorld((w) => {
      newTotal = w.timeMinutes + minutes;
      return {
        ...w,
        timeMinutes: newTotal,
        dangerLevel: clamp(w.dangerLevel + Math.ceil(minutes / 3)),
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

    // Pick a contextual reaction
    const reactions = pickTimeReaction(minutes, newTotal, lang);
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
          sceneTitle: scene.title,
          dangerLevel: world.dangerLevel,
          ravisseursPresents: world.ravisseursPresents,
          claireLocation: world.claireLocation,
          mode,
          lang,
          history,
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
      setWorld((w) => ({
        ...w,
        claireConfiance: clamp(w.claireConfiance + (res.trustDelta ?? 0)),
        playerStress: clamp(w.playerStress + (res.stressDelta ?? 0)),
        dangerLevel: clamp(w.dangerLevel + (res.dangerDelta ?? 0)),
      }));

      if (res.outcome === "success" || res.outcome === "failure") {
        const narration = res.outcomeNarration?.trim();
        if (narration) {
          setMessages((m) => [
            ...m,
            { id: uid(), speaker: "narrator", text: narration, timestamp: world.timeMinutes },
          ]);
        }
        const endTag =
          res.outcome === "success"
            ? lang === "en" ? "— MISSION COMPLETE —" : "— MISSION ACCOMPLIE —"
            : lang === "en" ? "— MISSION FAILED —" : "— MISSION ÉCHOUÉE —";
        setMessages((m) => [
          ...m,
          { id: uid(), speaker: "system", text: endTag, timestamp: 0 },
        ]);
        setWorld((w) => ({
          ...w,
          missionStatus: res.outcome === "success" ? "complete" : "failed",
          claireLocation: res.outcome === "success" ? "rescued" : "lost",
          dangerLevel: res.outcome === "success" ? 10 : 100,
        }));
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
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="mr-2 rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
              title={t("game.back_title", lang)}
            >
              ←
            </button>
            <span
              className={`pulse-danger inline-block h-2 w-2 rounded-full ${
                world.dangerLevel >= 60 ? "bg-danger" : "bg-emerald-500"
              }`}
            />
            <span className="text-muted-foreground">CALL</span>
            <span className="font-semibold">{formatGameTime(world.timeMinutes)}</span>
            <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
              {mode}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Stat label={t("game.stress", lang)} value={world.playerStress} color="text-amber-400" />
            <Stat label={t("game.danger", lang)} value={world.dangerLevel} color={dangerColor} />
            <Stat label={t("game.bond", lang)} value={world.claireConfiance} color="text-claire" />
            <LangToggle />
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          {scene.title} ·{" "}
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
                {scene.choices.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleChoice(c.id)}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-left text-sm text-secondary-foreground transition hover:border-primary hover:bg-accent"
                  >
                    {c.label}
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
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTimeReaction(
  minutes: number,
  totalMinutes: number,
  lang: "fr" | "en",
): TimeReaction[] {
  // Hard fail past 120 in-game minutes
  if (totalMinutes >= 120) {
    return [
      {
        speaker: "narrator",
        text:
          lang === "en"
            ? "A muffled noise. Footsteps. The kidnappers found the phone."
            : "Un bruit étouffé. Des pas. Les ravisseurs ont trouvé le téléphone.",
        typingMs: 1200,
      },
      {
        speaker: "unknown",
        text:
          lang === "en"
            ? "...who is this? ...don't call back."
            : "...c'est qui ça ? ...rappelle plus.",
        typingMs: 1400,
        endsMission: true,
      },
    ];
  }

  // 60+ min : major scenario beat
  if (minutes >= 60) {
    return [
      {
        speaker: "narrator",
        text:
          lang === "en"
            ? "An engine starts in the distance. A door slams."
            : "Un moteur démarre au loin. Une portière claque.",
        typingMs: 1100,
      },
      {
        speaker: "claire",
        text: pick(
          lang === "en"
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
        ),
        typingMs: 1600,
      },
    ];
  }

  // 10+ min : Claire grows anxious
  if (minutes >= 10) {
    return [
      {
        speaker: "claire",
        text: pick(
          lang === "en"
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
        ),
        typingMs: 1300,
      },
    ];
  }

  // 1-9 min : small whisper
  return [
    {
      speaker: "claire",
      text: pick(
        lang === "en"
          ? ["...still here?", "(breathing)", "...please don't leave."]
          : ["...t'es là ?", "(respiration)", "...pars pas, s'il te plaît."],
      ),
      typingMs: 900,
    },
  ];
}

