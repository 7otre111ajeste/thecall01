import type { NarrativeMode } from "@/lib/storyline/stories";

import type { Message, WorldState } from "./types";

export type SaveSlot = {
  id: string; // unique id
  storyId: string;
  mode: NarrativeMode;
  sceneId: string;
  world: WorldState;
  messages: Message[];
  savedAt: number; // epoch ms
  name: string;
  auto?: boolean;
};

const KEY = "storyline.saves.v1";
const MAX_PER_STORY = 3; // manual saves cap (auto save is separate)

function readAll(): SaveSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SaveSlot[]) : [];
  } catch {
    return [];
  }
}

function writeAll(slots: SaveSlot[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(slots));
  window.dispatchEvent(new CustomEvent("storyline:saves-change"));
}

export function getManualSaves(storyId: string): SaveSlot[] {
  return readAll()
    .filter((s) => s.storyId === storyId && !s.auto)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export function getAutoSave(storyId: string): SaveSlot | null {
  return readAll().find((s) => s.storyId === storyId && s.auto) ?? null;
}

export function deleteSave(id: string) {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function clearAutoSave(storyId: string) {
  writeAll(readAll().filter((s) => !(s.storyId === storyId && s.auto)));
}

export function upsertAutoSave(
  data: Omit<SaveSlot, "id" | "savedAt" | "name" | "auto">,
) {
  const all = readAll().filter(
    (s) => !(s.storyId === data.storyId && s.auto),
  );
  all.push({
    ...data,
    id: `auto-${data.storyId}`,
    savedAt: Date.now(),
    name: "Auto",
    auto: true,
  });
  writeAll(all);
}

export function saveManual(
  data: Omit<SaveSlot, "id" | "savedAt" | "name" | "auto"> & { name?: string },
): { ok: true } | { ok: false; reason: "full" } {
  const all = readAll();
  const manual = all.filter((s) => s.storyId === data.storyId && !s.auto);
  if (manual.length >= MAX_PER_STORY) {
    return { ok: false, reason: "full" };
  }
  all.push({
    ...data,
    id: `${data.storyId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    savedAt: Date.now(),
    name: data.name ?? `Save ${manual.length + 1}`,
  });
  writeAll(all);
  return { ok: true };
}

export function overwriteManual(
  id: string,
  data: Omit<SaveSlot, "id" | "savedAt" | "name" | "auto"> & { name?: string },
) {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    ...data,
    name: data.name ?? all[idx].name,
    savedAt: Date.now(),
  };
  writeAll(all);
}


export const MAX_MANUAL_SAVES = MAX_PER_STORY;
