export const DISCLAIMER_VERSION = 1;
const key = (id: string) => `storyline.disclaimer.accepted.${id}`;

export function hasAccepted(storyId: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key(storyId)) === String(DISCLAIMER_VERSION);
}

export function accept(storyId: string) {
  window.localStorage.setItem(key(storyId), String(DISCLAIMER_VERSION));
}
