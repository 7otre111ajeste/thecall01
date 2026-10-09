import { useEffect, useState } from "react";

const KEY = "storyline.playtime";
const EVENT = "storyline:playtime-change";
export const FREE_DAILY_SECONDS = 180;
/** Seconds granted after each ad in a pack (1st ad, 2nd ad, 3rd ad). */
export const AD_STEP_SECONDS = [180, 240, 240];
export const AD_DURATION_MS = 1500;

export type Playtime = { day: string; freeLeft: number; bonus: number; keep: boolean };

let launched = false;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getPlaytime(): Playtime {
  const fresh: Playtime = { day: today(), freeLeft: FREE_DAILY_SECONDS, bonus: 0, keep: false };
  if (typeof window === "undefined") return fresh;
  let s: Playtime = fresh;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) s = { ...fresh, ...JSON.parse(raw) };
  } catch {
    s = fresh;
  }
  let dirty = false;
  if (s.day !== today()) {
    s = { ...s, day: today(), freeLeft: FREE_DAILY_SECONDS };
    dirty = true;
  }
  if (!launched) {
    launched = true;
    if (!s.keep && s.bonus > 0) {
      s = { ...s, bonus: 0 };
      dirty = true;
    }
  }
  if (dirty) write(s, false);
  return s;
}

function write(s: Playtime, notify = true) {
  if (s.bonus <= 0) s = { ...s, bonus: 0, keep: false };
  window.localStorage.setItem(KEY, JSON.stringify(s));
  if (notify) window.dispatchEvent(new CustomEvent(EVENT));
}

export function totalLeft(s: Playtime) {
  return s.freeLeft + s.bonus;
}

/** Consume seconds: free time first, then bonus. */
export function consume(sec: number) {
  const s = getPlaytime();
  const fromFree = Math.min(s.freeLeft, sec);
  const fromBonus = Math.min(s.bonus, sec - fromFree);
  write({ ...s, freeLeft: s.freeLeft - fromFree, bonus: s.bonus - fromBonus });
}

export function addBonus(sec: number) {
  const s = getPlaytime();
  write({ ...s, bonus: s.bonus + sec });
}

export function setKeep() {
  const s = getPlaytime();
  if (s.bonus > 0) write({ ...s, keep: true });
}

/** Simulated rewarded ad on web. Always succeeds. */
export function watchAd(): Promise<boolean> {
  return new Promise((r) => setTimeout(() => r(true), AD_DURATION_MS));
}

export function usePlaytime(): Playtime {
  const [s, set] = useState<Playtime>({ day: "", freeLeft: FREE_DAILY_SECONDS, bonus: 0, keep: false });
  useEffect(() => {
    set(getPlaytime());
    const on = () => set(getPlaytime());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return s;
}

export function formatLeft(sec: number) {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}
