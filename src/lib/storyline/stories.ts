export type NarrativeMode = "realiste" | "comedie" | "cinematique" | "chaos";

export type StoryTheme = "thecall" | "business" | "survival";

export type StoryModule = {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  status: "active" | "locked";
  theme: StoryTheme;
  accent: string; // CSS color for card glow
  modes: NarrativeMode[];
};

export const STORIES: StoryModule[] = [
  {
    id: "thecall",
    title: "THE CALL",
    tagline: "Thriller · Temps réel",
    synopsis:
      "Une femme vous appelle par erreur. Elle est kidnappée et votre numéro est son seul lien avec l'extérieur.",
    status: "active",
    theme: "thecall",
    accent: "#e0392b",
    modes: ["realiste", "cinematique"],
  },
  {
    id: "survival",
    title: "SURVIVAL CRASH",
    tagline: "Survie · Nature hostile",
    synopsis:
      "Le crash. La forêt. La nuit qui tombe. Quelqu'un, quelque part, capte votre signal.",
    status: "locked",
    theme: "survival",
    accent: "#2ecc71",
    modes: ["realiste", "cinematique"],
  },
  {
    id: "business",
    title: "BUSINESS EMPIRE",
    tagline: "Corporate · Pouvoir & trahison",
    synopsis:
      "Vous reprenez une multinationale au bord du gouffre. Chaque décision déplace des milliards.",
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

// Seed nice-looking play counts for ambiance
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
