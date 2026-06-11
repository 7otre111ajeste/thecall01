import { useEffect, useState } from "react";

export type Lang = "fr" | "en";

const STORAGE_KEY = "storyline.lang";
const EVENT = "storyline:lang-change";

export function getLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "en" ? "en" : "fr";
}

export function setLang(lang: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLocal] = useState<Lang>(() => getLang());
  useEffect(() => {
    const onChange = () => setLocal(getLang());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return [lang, (l) => setLang(l)];
}

type Dict = Record<string, { fr: string; en: string }>;

export const STRINGS: Dict = {
  "menu.tagline": { fr: "Choisissez votre histoire", en: "Choose your story" },
  "menu.footer": {
    fr: "Plus d'histoires bientôt · STORYLINE v0.1",
    en: "More stories coming soon · STORYLINE v0.1",
  },
  "menu.available": { fr: "Disponible", en: "Available" },
  "menu.locked": { fr: "Bientôt", en: "Soon" },
  "menu.plays": { fr: "parties", en: "plays" },

  "intro.ready": { fr: "Êtes-vous prêt à répondre ?", en: "Are you ready to answer?" },
  "intro.start": { fr: "Commencer", en: "Start" },
  "intro.mode": { fr: "Mode narratif", en: "Narrative mode" },
  "intro.back": { fr: "← Retour", en: "← Back" },
  "intro.choose_mode": { fr: "Choisir un ton narratif", en: "Pick a narrative tone" },
  "intro.cancel": { fr: "← Annuler", en: "← Cancel" },
  "intro.locked_title": {
    fr: "Cette histoire n'est pas encore disponible.",
    en: "This story is not available yet.",
  },
  "intro.locked_sub": {
    fr: "Notre équipe finalise l'écriture des actes. Restez à l'écoute.",
    en: "Our team is finishing the writing. Stay tuned.",
  },

  "mode.realiste": { fr: "Réaliste", en: "Realistic" },
  "mode.comedie": { fr: "Comédie", en: "Comedy" },
  "mode.cinematique": { fr: "Cinématique", en: "Cinematic" },
  "mode.chaos": { fr: "Chaos", en: "Chaos" },
  "mode.comic": { fr: "Comic", en: "Comic" },

  "game.stress": { fr: "STRESS", en: "STRESS" },
  "game.danger": { fr: "DANGER", en: "DANGER" },
  "game.bond": { fr: "LIEN", en: "BOND" },
  "game.mission_active": { fr: "Mission en cours", en: "Mission in progress" },
  "game.mission_failed": { fr: "Mission échouée", en: "Mission failed" },
  "game.mission_done": { fr: "Mission terminée", en: "Mission complete" },
  "game.restart": { fr: "Recommencer", en: "Restart" },
  "game.menu": { fr: "Menu", en: "Menu" },
  "game.back_to_intro": { fr: "Recommencer", en: "Restart" },
  "game.claire_speaks": { fr: "Claire parle...", en: "Claire is speaking..." },
  "game.write_to_claire": { fr: "Écrire à Claire...", en: "Write to Claire..." },
  "game.send": { fr: "Envoyer", en: "Send" },
  "game.advance_time": { fr: "Avancer le temps", en: "Advance time" },
  "game.back_title": { fr: "Retour au menu", en: "Back to menu" },
  "game.network_error": { fr: "⚠ Coupure réseau. Réessayez.", en: "⚠ Network error. Try again." },
  "game.time_elapsed_one": { fr: "minute écoulée...", en: "minute elapsed..." },
  "game.time_elapsed_many": { fr: "minutes écoulées...", en: "minutes elapsed..." },
};

export function t(key: keyof typeof STRINGS | string, lang: Lang): string {
  const entry = STRINGS[key as string];
  if (!entry) return key as string;
  return entry[lang];
}
