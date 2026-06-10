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
};

export type Scene = {
  id: string;
  title: string;
  // Sequence of messages pushed when entering this scene
  beats: Array<{ speaker: Speaker; text: string; delayMs?: number }>;
  // Player choices, or null if scene auto-advances
  choices: Choice[];
  // Optional auto-advance after beats (no choices)
  autoAdvance?: { nextScene: string; delayMs: number };
  // Free-text input allowed?
  allowFreeText?: boolean;
  // Apply on enter
  onEnter?: Partial<WorldState>;
  // Allow advancing time?
  allowAdvanceTime?: boolean;
};

export type WorldState = {
  claireLocation: "unknown" | "basement" | "moving" | "rescued" | "lost";
  dangerLevel: number; // 0-100
  ravisseursPresents: boolean;
  claireConfiance: number; // 0-100
  playerStress: number; // 0-100
  missionStatus: "active" | "failed" | "complete";
  timeMinutes: number; // in-game elapsed minutes
};

export const initialWorldState: WorldState = {
  claireLocation: "unknown",
  dangerLevel: 20,
  ravisseursPresents: false,
  claireConfiance: 40,
  playerStress: 30,
  missionStatus: "active",
  timeMinutes: 0,
};
