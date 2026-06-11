import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "storyline.theme";
const EVENT = "storyline:theme-change";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setLocal] = useState<Theme>(() => getTheme());
  useEffect(() => {
    document.documentElement.dataset.theme = getTheme();
    const onChange = () => {
      const next = getTheme();
      document.documentElement.dataset.theme = next;
      setLocal(next);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return [theme, (t) => setTheme(t)];
}
