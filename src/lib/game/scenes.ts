import type { Scene } from "./types";

// ACT 1 — L'APPEL. All scenes pre-written. AI never invents scenes.
export const SCENES: Record<string, Scene> = {
  scene_1_incoming: {
    id: "scene_1_incoming",
    title: "Appel inconnu",
    beats: [
      { speaker: "system", text: "📞 Appel entrant — Numéro inconnu" },
      { speaker: "system", text: "Vous décrochez." },
      {
        speaker: "claire",
        text: "Ne raccrochez pas ! S'il vous plaît !",
        delayMs: 800,
      },
      {
        speaker: "claire",
        text: "Je crois que je suis kidnappée... et je ne peux pas couper l'appel.",
        delayMs: 1200,
      },
    ],
    choices: [
      { id: "stay", label: "Rester en ligne", nextScene: "scene_2_identity" },
      {
        id: "doubt",
        label: "« C'est une blague ? »",
        nextScene: "scene_2_identity",
        effects: { claireConfiance: 25 },
      },
      {
        id: "hangup",
        label: "Raccrocher",
        nextScene: "scene_bad_hangup",
        effects: { missionStatus: "failed" },
      },
    ],
  },

  scene_2_identity: {
    id: "scene_2_identity",
    title: "Identité",
    onEnter: { playerStress: 40 },
    beats: [
      { speaker: "claire", text: "Je... je m'appelle Claire." },
      {
        speaker: "claire",
        text: "Je suis enfermée dans un sous-sol. Je ne sais pas où.",
        delayMs: 1500,
      },
      {
        speaker: "claire",
        text: "Il fait sombre. Il y a une odeur d'humidité.",
        delayMs: 1500,
      },
    ],
    choices: [
      {
        id: "calm",
        label: "« Respirez. Je suis là. »",
        nextScene: "scene_3_first_danger",
        effects: { claireConfiance: 55, playerStress: 35 },
      },
      {
        id: "question",
        label: "« Décrivez ce que vous voyez. »",
        nextScene: "scene_3_first_danger",
        effects: { claireConfiance: 50 },
      },
      {
        id: "police",
        label: "« J'appelle la police en parallèle. »",
        nextScene: "scene_3_first_danger",
        effects: { claireConfiance: 60, playerStress: 45 },
      },
    ],
    allowFreeText: true,
  },

  scene_3_first_danger: {
    id: "scene_3_first_danger",
    title: "Premier danger",
    onEnter: { dangerLevel: 45, ravisseursPresents: true },
    beats: [
      { speaker: "narrator", text: "Des pas lourds résonnent au-dessus d'elle." },
      { speaker: "claire", text: "Oh mon dieu... ils reviennent.", delayMs: 900 },
      { speaker: "claire", text: "Chuuut. Je dois me taire.", delayMs: 1000 },
    ],
    choices: [
      {
        id: "whisper",
        label: "Chuchoter : « Cachez-vous. »",
        nextScene: "scene_4_choice",
        effects: { claireConfiance: 65 },
      },
      {
        id: "listen",
        label: "Écouter en silence",
        nextScene: "scene_4_choice",
        effects: { playerStress: 55 },
      },
      {
        id: "record",
        label: "Activer l'enregistrement",
        nextScene: "scene_4_choice",
        effects: { playerStress: 50 },
      },
    ],
    allowAdvanceTime: true,
  },

  scene_4_choice: {
    id: "scene_4_choice",
    title: "Le choix",
    beats: [
      { speaker: "narrator", text: "Les pas s'éloignent. Pour l'instant." },
      { speaker: "claire", text: "Ils sont partis... je crois.", delayMs: 1100 },
      { speaker: "claire", text: "Qu'est-ce que je fais ?", delayMs: 800 },
    ],
    choices: [
      {
        id: "stay_line",
        label: "« Restez en ligne, ne bougez pas. »",
        nextScene: "scene_5_threat",
      },
      {
        id: "explore",
        label: "« Cherchez un indice : objet, son, odeur. »",
        nextScene: "scene_5_threat",
        effects: { claireConfiance: 70 },
      },
      {
        id: "calm_her",
        label: "La calmer doucement",
        nextScene: "scene_5_threat",
        effects: { claireConfiance: 75, playerStress: 40 },
      },
    ],
    allowFreeText: true,
    allowAdvanceTime: true,
  },

  scene_5_threat: {
    id: "scene_5_threat",
    title: "Menace externe",
    onEnter: { dangerLevel: 65 },
    beats: [
      { speaker: "system", text: "📩 Nouveau message — Expéditeur masqué" },
      {
        speaker: "unknown",
        text: "Vous n'êtes pas censé être dans cet appel.",
        delayMs: 1000,
      },
      {
        speaker: "unknown",
        text: "Raccrochez. Maintenant.",
        delayMs: 1200,
      },
    ],
    choices: [
      {
        id: "defy",
        label: "Ignorer et rester avec Claire",
        nextScene: "scene_6_escalation",
        effects: { playerStress: 70, claireConfiance: 85 },
      },
      {
        id: "reply",
        label: "Répondre : « Qui êtes-vous ? »",
        nextScene: "scene_6_escalation",
        effects: { dangerLevel: 75 },
      },
      {
        id: "trace",
        label: "Tenter de tracer le numéro",
        nextScene: "scene_6_escalation",
        effects: { playerStress: 60 },
      },
    ],
  },

  scene_6_escalation: {
    id: "scene_6_escalation",
    title: "Escalade",
    onEnter: { dangerLevel: 90, ravisseursPresents: true },
    beats: [
      { speaker: "claire", text: "Ils redescendent ! Ils m'ont entendue !" },
      { speaker: "claire", text: "S'il vous plaît, faites quelque chose !", delayMs: 900 },
      { speaker: "narrator", text: "Une porte claque. Des voix d'hommes. Très proches.", delayMs: 1100 },
    ],
    choices: [
      {
        id: "scream_plan",
        label: "« Faites tomber un objet pour les distraire. »",
        nextScene: "scene_7_end_act1",
      },
      {
        id: "silence",
        label: "« Ne dites plus un mot. Je guide. »",
        nextScene: "scene_7_end_act1",
        effects: { claireConfiance: 90 },
      },
      {
        id: "promise",
        label: "« Je vous sortirai de là. Je vous le jure. »",
        nextScene: "scene_7_end_act1",
        effects: { claireConfiance: 95, playerStress: 80 },
      },
    ],
    allowFreeText: true,
  },

  scene_7_end_act1: {
    id: "scene_7_end_act1",
    title: "Fin de l'Acte 1",
    beats: [
      { speaker: "narrator", text: "Le souffle de Claire devient à peine audible." },
      { speaker: "claire", text: "...ils sont juste derrière la porte.", delayMs: 1200 },
      { speaker: "system", text: "— FIN DE L'ACTE 1 —", delayMs: 1500 },
      { speaker: "system", text: "L'Acte 2 sera bientôt disponible.", delayMs: 800 },
    ],
    choices: [],
  },

  scene_bad_hangup: {
    id: "scene_bad_hangup",
    title: "Vous avez raccroché",
    onEnter: { missionStatus: "failed", claireLocation: "lost" },
    beats: [
      { speaker: "system", text: "📵 Appel terminé." },
      { speaker: "narrator", text: "Vous reposez le téléphone. Le silence s'installe.", delayMs: 1000 },
      { speaker: "narrator", text: "Quelque part, une femme vient de perdre son dernier espoir.", delayMs: 1500 },
      { speaker: "system", text: "— MISSION ÉCHOUÉE —", delayMs: 1500 },
    ],
    choices: [],
  },
};

export const START_SCENE = "scene_1_incoming";
