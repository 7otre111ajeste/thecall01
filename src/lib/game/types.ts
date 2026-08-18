export type Speaker = "claire" | "unknown" | "system" | "player" | "narrator";

/** Localized string pair. */
export type Loc = { fr: string; en: string };

export function loc(value: Loc | string, lang: "fr" | "en"): string {
  return typeof value === "string" ? value : value[lang];
}

export type Message = {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: number; // in-game minutes since start
};

export type Choice = {
  id: string;
  label: Loc;
  nextScene: string;
  effects?: Partial<WorldState>;
  requiresFlag?: string;
  blockedByFlag?: string;
};

export type Scene = {
  id: string;
  title: Loc;
  beats: Array<{ speaker: Speaker; text: Loc; delayMs?: number }>;
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
  // Name the player gave to the character (asked naturally in-story).
  playerName?: string;
  // Whether the character already asked for the player's name.
  nameAsked?: boolean;
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
  playerName: undefined,
  nameAsked: false,
};

