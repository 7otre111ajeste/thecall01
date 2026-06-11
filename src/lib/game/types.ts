export type Speaker = "claire" | "unknown" | "system" | "player" | "narrator";

export type Message = {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: number; // in-game minutes since start
};

export type Choice = {
  id: string;
  label: string;
  nextScene: string;
  effects?: Partial<WorldState>;
  requiresFlag?: string;
  blockedByFlag?: string;
};

export type Scene = {
  id: string;
  title: string;
  beats: Array<{ speaker: Speaker; text: string; delayMs?: number }>;
  choices: Choice[];
  autoAdvance?: { nextScene: string; delayMs: number };
  allowFreeText?: boolean;
  onEnter?: Partial<WorldState>;
  allowAdvanceTime?: boolean;
};

export type WorldState = {
  claireLocation: "unknown" | "basement" | "moving" | "rescued" | "lost";
  dangerLevel: number;
  ravisseursPresents: boolean;
  claireConfiance: number;
  playerStress: number;
  missionStatus: "active" | "failed" | "complete";
  timeMinutes: number;
  // Narrative facts accumulated through play. Drives branch locking,
  // subtle hints, and ending variant selection.
  flags: string[];
  // Hint IDs already shown (avoid repeating the same nudge).
  hintsShown: string[];
};

export const initialWorldState: WorldState = {
  claireLocation: "unknown",
  dangerLevel: 20,
  ravisseursPresents: false,
  claireConfiance: 40,
  playerStress: 30,
  missionStatus: "active",
  timeMinutes: 0,
  flags: [],
  hintsShown: [],
};
