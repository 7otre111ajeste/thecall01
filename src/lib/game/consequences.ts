// Generic consequence engine — reusable across stories.
// FLAGS: narrative facts. HINTS: subtle threshold nudges. ENDINGS: variant picker.

import type { WorldState } from "./types";

// Canonical vocabulary the AI is allowed to emit. Story-agnostic.
export const KNOWN_FLAGS = [
  "police_alerted",
  "location_shared",
  "weapon_grabbed",
  "weapon_used",
  "captor_provoked",
  "captor_alerted",
  "claire_injured",
  "claire_hidden",
  "claire_escaped_room",
  "trust_broken",
  "call_compromised",
] as const;

export type StoryFlag = (typeof KNOWN_FLAGS)[number] | (string & {});

// Flags that permanently disable choice categories.
// We substring-match against choice.id so scenes don't need to know.
const LOCK_BY_FLAG: Record<string, string[]> = {
  trust_broken: ["calm", "comfort", "reassure"],
  call_compromised: ["whisper", "silent", "listen"],
  claire_injured: ["run", "fight", "attack"],
  weapon_used: ["negotiate", "talk_down", "plead"],
};

export function isChoiceLocked(choiceId: string, flags: string[]): boolean {
  const id = choiceId.toLowerCase();
  for (const flag of flags) {
    const ids = LOCK_BY_FLAG[flag];
    if (ids && ids.some((n) => id.includes(n))) return true;
  }
  return false;
}

// Threshold hints — fired once each via world.hintsShown.
type HintRule = {
  id: string;
  triggered: (w: WorldState) => boolean;
  fr: string;
  en: string;
};

const HINT_RULES: HintRule[] = [
  {
    id: "high_stress",
    triggered: (w) => w.playerStress >= 75,
    fr: "Vos mains tremblent sur le téléphone.",
    en: "Your hands tremble against the phone.",
  },
  {
    id: "claire_breaking",
    triggered: (w) => w.claireConfiance <= 20,
    fr: "Sa voix se fissure. Vous la perdez.",
    en: "Her voice cracks. You're losing her.",
  },
  {
    id: "high_danger",
    triggered: (w) => w.dangerLevel >= 80,
    fr: "Quelque chose va arriver. Bientôt.",
    en: "Something is about to happen. Soon.",
  },
  {
    id: "strong_bond",
    triggered: (w) => w.claireConfiance >= 85,
    fr: "Sa respiration ralentit. Elle vous fait confiance.",
    en: "Her breathing slows. She trusts you.",
  },
];

const FLAG_HINTS: Record<string, { fr: string; en: string }> = {
  police_alerted: {
    fr: "Au loin, une sirène monte dans la nuit.",
    en: "Far off, a siren rises into the night.",
  },
  weapon_grabbed: {
    fr: "Le poids du métal dans sa main. Plus de retour en arrière.",
    en: "The weight of metal in her hand. No going back.",
  },
  trust_broken: {
    fr: "Le silence d'après. Elle ne vous écoute plus comme avant.",
    en: "The silence after. She isn't listening the same way.",
  },
  call_compromised: {
    fr: "Ils savent pour le téléphone.",
    en: "They know about the phone.",
  },
  claire_injured: {
    fr: "Elle gémit. Un souffle court, humide.",
    en: "She moans. Short, wet breaths.",
  },
  location_shared: {
    fr: "Une adresse, un repère. Vous notez. Vite.",
    en: "An address. A landmark. You write it down. Fast.",
  },
};

export function pickHint(
  world: WorldState,
  newFlags: string[],
  lang: "fr" | "en",
): { id: string; text: string } | null {
  for (const f of newFlags) {
    const h = FLAG_HINTS[f];
    if (!h) continue;
    const id = `flag:${f}`;
    if (!world.hintsShown.includes(id)) return { id, text: h[lang] };
  }
  for (const rule of HINT_RULES) {
    if (world.hintsShown.includes(rule.id)) continue;
    if (rule.triggered(world)) return { id: rule.id, text: lang === "en" ? rule.en : rule.fr };
  }
  return null;
}

// Ending variants — pick by flags + world.
export type EndingVariant = {
  id: string;
  title: { fr: string; en: string };
  narration: { fr: string; en: string };
};

const SUCCESS_VARIANTS: EndingVariant[] = [
  {
    id: "rescue_police",
    title: { fr: "Sauvée par la police", en: "Rescued by police" },
    narration: {
      fr: "Les gyrophares percent la nuit. Les portes cèdent. Claire est vivante. Vous avez tenu bon.",
      en: "Blue lights tear the night open. Doors give way. Claire is alive. You held the line.",
    },
  },
  {
    id: "escape_self",
    title: { fr: "Évasion", en: "Self-rescue" },
    narration: {
      fr: "Elle court dans le noir, pieds nus, le téléphone serré contre l'oreille. Elle ne s'arrête pas avant les lumières de la route.",
      en: "She runs barefoot through the dark, phone clamped to her ear. She doesn't stop until the road lights.",
    },
  },
  {
    id: "armed_perfect_shot",
    title: { fr: "Le coup parfait", en: "Perfect shot" },
    narration: {
      fr: "Un seul tir. Le ravisseur s'effondre. Claire reste figée, l'arme fumante. Le silence dure une éternité avant qu'elle ne respire.",
      en: "One shot. The captor drops. Claire stays frozen, the gun smoking. The silence stretches forever before she breathes.",
    },
  },
];

const FAILURE_VARIANTS: EndingVariant[] = [
  {
    id: "weapon_backfire",
    title: { fr: "Le coup raté", en: "It misfired" },
    narration: {
      fr: "Elle tire. Mal. La détonation, des cris, des pas qui courent. Le téléphone tombe. La ligne grésille puis se coupe.",
      en: "She fires. Badly. The shot, screams, running feet. The phone falls. The line crackles, then dies.",
    },
  },
  {
    id: "self_harm",
    title: { fr: "Elle s'est blessée", en: "She hurt herself" },
    narration: {
      fr: "Un cri étouffé. Du métal sur le sol. Elle dit votre nom une fois — puis plus rien.",
      en: "A muffled cry. Metal on the floor. She says your name once — then nothing.",
    },
  },
  {
    id: "captors_found",
    title: { fr: "Découverte", en: "Discovered" },
    narration: {
      fr: "Les pas s'arrêtent juste au-dessus. La porte s'ouvre. Une voix d'homme, calme : « Donne-moi ce téléphone. »",
      en: "Footsteps stop right above. The door opens. A man's calm voice: \"Give me that phone.\"",
    },
  },
  {
    id: "trust_collapse",
    title: { fr: "Plus personne", en: "No one left" },
    narration: {
      fr: "Elle ne répond plus. Vous entendez sa respiration s'éloigner du combiné. Elle a cessé de vous croire bien avant la fin.",
      en: "She doesn't answer anymore. You hear her breathing drift away from the receiver. She stopped believing you long before the end.",
    },
  },
  {
    id: "hangup_alone",
    title: { fr: "La ligne coupe", en: "The line drops" },
    narration: {
      fr: "Un bruit sec. Le silence. Quelque part, Claire est seule. Vous ne saurez jamais comment ça finit.",
      en: "A sharp click. Silence. Somewhere, Claire is alone. You'll never know how it ends.",
    },
  },
];

export function pickEnding(
  world: WorldState,
  flags: string[],
  kind: "success" | "failure",
): EndingVariant {
  const has = (f: string) => flags.includes(f);

  if (kind === "success") {
    if (has("weapon_used")) return SUCCESS_VARIANTS[2];
    if (has("claire_escaped_room")) return SUCCESS_VARIANTS[1];
    if (has("police_alerted") || has("location_shared")) return SUCCESS_VARIANTS[0];
    return SUCCESS_VARIANTS[0];
  }
  if (has("weapon_used") && has("claire_injured")) return FAILURE_VARIANTS[1];
  if (has("weapon_used")) return FAILURE_VARIANTS[0];
  if (has("trust_broken") || world.claireConfiance <= 15) return FAILURE_VARIANTS[3];
  if (has("call_compromised") || has("captor_alerted")) return FAILURE_VARIANTS[2];
  if (has("claire_injured")) return FAILURE_VARIANTS[1];
  return FAILURE_VARIANTS[4];
}
