export type NarrativeMode = "realiste" | "comedie" | "cinematique" | "chaos" | "comic";

export type StoryTheme = "thecall" | "business" | "survival";

export type StoryModule = {
  id: string;
  title: string;
  tagline: string;
  taglineEn: string;
  synopsis: string;
  synopsisEn: string;
  status: "active" | "locked";
  theme: StoryTheme;
  accent: string;
  modes: NarrativeMode[];
};

export const STORIES: StoryModule[] = [
  {
    id: "thecall",
    title: "THE CALL",
    tagline: "Thriller · Temps réel",
    taglineEn: "Thriller · Real time",
    synopsis:
      "Une femme vous appelle par erreur. Elle est kidnappée et votre numéro est son seul lien avec l'extérieur.",
    synopsisEn:
      "A woman calls you by mistake. She's been kidnapped, and your number is her only link to the outside world.",
    status: "active",
    theme: "thecall",
    accent: "#e0392b",
    modes: ["realiste", "cinematique", "comic"],
  },
  {
    id: "survival",
    title: "SURVIVAL CRASH",
    tagline: "Survie · Nature hostile",
    taglineEn: "Survival · Hostile wild",
    synopsis:
      "Le crash. La forêt. La nuit qui tombe. Quelqu'un, quelque part, capte votre signal.",
    synopsisEn:
      "The crash. The forest. Night falling. Someone, somewhere, picks up your signal.",
    status: "locked",
    theme: "survival",
    accent: "#2ecc71",
    modes: ["realiste", "cinematique"],
  },
  {
    id: "business",
    title: "BUSINESS EMPIRE",
    tagline: "Corporate · Pouvoir & trahison",
    taglineEn: "Corporate · Power & betrayal",
    synopsis:
      "Vous reprenez une multinationale au bord du gouffre. Chaque décision déplace des milliards.",
    synopsisEn:
      "You take over a multinational on the brink. Every decision moves billions.",
    status: "locked",
    theme: "business",
    accent: "#3b82f6",
    modes: ["realiste", "comedie", "cinematique"],
  },
];

export const NARRATIVE_MODE_LABELS: Record<NarrativeMode, string> = {
  realiste: "Réaliste",
  comedie: "Comédie",
  cinematique: "Cinématique",
  chaos: "Chaos",
  comic: "Comic",
};

export function getPlayCount(storyId: string): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(`storyline.plays.${storyId}`);
  return v ? parseInt(v, 10) || 0 : 0;
}

export function incrementPlayCount(storyId: string): number {
  if (typeof window === "undefined") return 0;
  const n = getPlayCount(storyId) + 1;
  window.localStorage.setItem(`storyline.plays.${storyId}`, String(n));
  return n;
}

export function seedPlayCounts() {
  if (typeof window === "undefined") return;
  const seeds: Record<string, number> = {
    thecall: 12847,
    survival: 0,
    business: 0,
  };
  for (const [id, base] of Object.entries(seeds)) {
    const key = `storyline.plays.${id}.seeded`;
    if (!window.localStorage.getItem(key)) {
      const current = getPlayCount(id);
      window.localStorage.setItem(`storyline.plays.${id}`, String(current + base));
      window.localStorage.setItem(key, "1");
    }
  }
}
