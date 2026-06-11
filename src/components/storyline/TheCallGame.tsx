import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { generateClaireReply } from "@/lib/api/dialogue.functions";
import { SCENES, START_SCENE } from "@/lib/game/scenes";
import {
  initialWorldState,
  type Message,
  type Speaker,
  type WorldState,
} from "@/lib/game/types";
import type { NarrativeMode } from "@/lib/storyline/stories";

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
}: {
  mode: NarrativeMode;
  onExit: () => void;
}) {
  const [world, setWorld] = useState<WorldState>(initialWorldState);
  const [sceneId, setSceneId] = useState<string>(START_SCENE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<Speaker | null>(null);
  const [beatsDone, setBeatsDone] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [awaitingAi, setAwaitingAi] = useState(false);
  const enteredRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callClaire = useServerFn(generateClaireReply);

  const scene = SCENES[sceneId];

  useEffect(() => {
    if (enteredRef.current === sceneId) return;
    enteredRef.current = sceneId;
    setBeatsDone(false);

    if (scene.onEnter) {
      setWorld((w) => ({ ...w, ...scene.onEnter }));
    }

    let cancelled = false;
    (async () => {
      for (const beat of scene.beats) {
        if (cancelled) return;
        const delay = beat.delayMs ?? 600;
        if (beat.speaker === "claire" || beat.speaker === "unknown") {
          setTyping(beat.speaker);
          await sleep(delay);
          if (cancelled) return;
          setTyping(null);
        } else {
          await sleep(delay);
          if (cancelled) return;
        }
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            speaker: beat.speaker,
            text: beat.text,
            timestamp: world.timeMinutes,
          },
        ]);
      }
      if (cancelled) return;
      setBeatsDone(true);
      if (scene.autoAdvance) {
        await sleep(scene.autoAdvance.delayMs);
        if (cancelled) return;
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
    setWorld((w) => ({
      ...w,
      timeMinutes: w.timeMinutes + minutes,
      dangerLevel: clamp(w.dangerLevel + Math.ceil(minutes / 3)),
      playerStress: clamp(w.playerStress + Math.ceil(minutes / 4)),
      claireConfiance: clamp(w.claireConfiance - Math.ceil(minutes / 8)),
    }));
    setMessages((m) => [
      ...m,
      {
        id: uid(),
        speaker: "system",
        text: `⏱ ${minutes} minute${minutes > 1 ? "s" : ""} se sont écoulées...`,
        timestamp: 0,
      },
    ]);
  }, []);

  const handleFreeText = useCallback(async () => {
    const text = freeText.trim();
    if (!text || awaitingAi) return;
    setFreeText("");
    setMessages((m) => [
      ...m,
      { id: uid(), speaker: "player", text, timestamp: world.timeMinutes },
    ]);
    setAwaitingAi(true);
    setTyping("claire");
    try {
      const res = await callClaire({
        data: {
          playerMessage: text,
          sceneTitle: scene.title,
          dangerLevel: world.dangerLevel,
          ravisseursPresents: world.ravisseursPresents,
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
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          speaker: "system",
          text: "⚠ Coupure réseau. Réessayez.",
          timestamp: 0,
        },
      ]);
    } finally {
      setTyping(null);
      setAwaitingAi(false);
    }
  }, [freeText, awaitingAi, callClaire, scene.title, world]);

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
              title="Retour au menu"
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
            <Stat label="STRESS" value={world.playerStress} color="text-amber-400" />
            <Stat label="DANGER" value={world.dangerLevel} color={dangerColor} />
            <Stat label="LIEN" value={world.claireConfiance} color="text-claire" />
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          {scene.title} ·{" "}
          {world.missionStatus === "active"
            ? "Mission en cours"
            : world.missionStatus === "failed"
              ? "Mission échouée"
              : "Mission terminée"}
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
          {world.missionStatus !== "active" || scene.choices.length === 0 ? (
            beatsDone && scene.choices.length === 0 ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setWorld(initialWorldState);
                    setMessages([]);
                    enteredRef.current = null;
                    setSceneId(START_SCENE);
                  }}
                  className="flex-1 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Recommencer
                </button>
                <button
                  onClick={onExit}
                  className="rounded-md border border-border px-4 py-3 text-sm hover:bg-accent"
                >
                  Menu
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">...</p>
            )
          ) : !beatsDone ? (
            <p className="text-center text-xs italic text-muted-foreground">
              Claire parle...
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
                    placeholder="Écrire à Claire..."
                    disabled={awaitingAi}
                    className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
                  />
                  <button
                    onClick={handleFreeText}
                    disabled={awaitingAi || !freeText.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                  >
                    Envoyer
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Avancer le temps
                </span>
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t.minutes}
                    onClick={() => handleAdvanceTime(t.minutes)}
                    className="rounded border border-border bg-secondary px-2 py-1 text-xs hover:border-primary"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
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
