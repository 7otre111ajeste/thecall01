import type { Scene } from "./types";

// THE CALL — Full scripted campaign (Acts 1 → 5). AI never invents scenes.
export const SCENES: Record<string, Scene> = {
  // ============================================================
  // ACT 1 — L'APPEL
  // ============================================================
  scene_1_incoming: {
    id: "scene_1_incoming",
    title: "Acte 1 · Appel inconnu",
    beats: [
      { speaker: "system", text: "📞 Appel entrant — Numéro inconnu" },
      { speaker: "system", text: "Vous décrochez." },
      { speaker: "claire", text: "Ne raccrochez pas ! S'il vous plaît !", delayMs: 800 },
      { speaker: "claire", text: "Je crois que je suis kidnappée... et je ne peux pas couper l'appel.", delayMs: 1200 },
    ],
    choices: [
      { id: "stay", label: "Rester en ligne", nextScene: "scene_2_identity", effects: { claireConfiance: 50, playerStress: 35 } },
      { id: "doubt", label: "« C'est une blague ? »", nextScene: "scene_2_identity", effects: { claireConfiance: 25 } },
      { id: "hangup", label: "Raccrocher", nextScene: "scene_bad_hangup", effects: { missionStatus: "failed" } },
    ],
  },

  scene_2_identity: {
    id: "scene_2_identity",
    title: "Acte 1 · Identité",
    onEnter: { playerStress: 40 },
    beats: [
      { speaker: "claire", text: "Je... je m'appelle Claire." },
      { speaker: "claire", text: "Je suis enfermée dans un sous-sol. Je ne sais pas où.", delayMs: 1500 },
      { speaker: "claire", text: "Il fait sombre. Il y a une odeur d'humidité.", delayMs: 1500 },
    ],
    choices: [
      { id: "calm", label: "« Respirez. Je suis là. »", nextScene: "scene_3_first_danger", effects: { claireConfiance: 60, playerStress: 35 } },
      { id: "question", label: "« Décrivez ce que vous voyez. »", nextScene: "scene_3_first_danger", effects: { claireConfiance: 55 } },
      { id: "police", label: "« J'appelle la police en parallèle. »", nextScene: "scene_3_first_danger", effects: { claireConfiance: 65, playerStress: 50 } },
    ],
    allowFreeText: true,
  },

  scene_3_first_danger: {
    id: "scene_3_first_danger",
    title: "Acte 1 · Premier danger",
    onEnter: { dangerLevel: 45, ravisseursPresents: true, claireLocation: "basement" },
    beats: [
      { speaker: "narrator", text: "Des pas lourds résonnent au-dessus d'elle." },
      { speaker: "claire", text: "Oh mon dieu... ils reviennent.", delayMs: 900 },
      { speaker: "claire", text: "Chuuut. Je dois me taire.", delayMs: 1000 },
    ],
    choices: [
      { id: "whisper", label: "Chuchoter : « Cachez-vous. »", nextScene: "scene_4_choice", effects: { claireConfiance: 70 } },
      { id: "listen", label: "Écouter en silence", nextScene: "scene_4_choice", effects: { playerStress: 60 } },
      { id: "record", label: "Activer l'enregistrement", nextScene: "scene_4_choice", effects: { playerStress: 55 } },
    ],
    allowAdvanceTime: true,
  },

  scene_4_choice: {
    id: "scene_4_choice",
    title: "Acte 1 · Le choix",
    onEnter: { ravisseursPresents: false },
    beats: [
      { speaker: "narrator", text: "Les pas s'éloignent. Pour l'instant." },
      { speaker: "claire", text: "Ils sont partis... je crois.", delayMs: 1100 },
      { speaker: "claire", text: "Qu'est-ce que je fais ?", delayMs: 800 },
    ],
    choices: [
      { id: "stay_line", label: "« Restez en ligne, ne bougez pas. »", nextScene: "scene_5_threat" },
      { id: "explore", label: "« Cherchez un indice : objet, son, odeur. »", nextScene: "scene_5_threat", effects: { claireConfiance: 75 } },
      { id: "calm_her", label: "La calmer doucement", nextScene: "scene_5_threat", effects: { claireConfiance: 80, playerStress: 40 } },
    ],
    allowFreeText: true,
    allowAdvanceTime: true,
  },

  scene_5_threat: {
    id: "scene_5_threat",
    title: "Acte 1 · Menace externe",
    onEnter: { dangerLevel: 65 },
    beats: [
      { speaker: "system", text: "📩 Nouveau message — Expéditeur masqué" },
      { speaker: "unknown", text: "Vous n'êtes pas censé être dans cet appel.", delayMs: 1000 },
      { speaker: "unknown", text: "Raccrochez. Maintenant.", delayMs: 1200 },
    ],
    choices: [
      { id: "defy", label: "Ignorer et rester avec Claire", nextScene: "scene_6_escalation", effects: { playerStress: 75, claireConfiance: 85 } },
      { id: "reply", label: "Répondre : « Qui êtes-vous ? »", nextScene: "scene_6_escalation", effects: { dangerLevel: 80, playerStress: 70 } },
      { id: "trace", label: "Tenter de tracer le numéro", nextScene: "scene_6_escalation", effects: { playerStress: 65 } },
    ],
  },

  scene_6_escalation: {
    id: "scene_6_escalation",
    title: "Acte 1 · Escalade",
    onEnter: { dangerLevel: 90, ravisseursPresents: true },
    beats: [
      { speaker: "claire", text: "Ils redescendent ! Ils m'ont entendue !" },
      { speaker: "claire", text: "S'il vous plaît, faites quelque chose !", delayMs: 900 },
      { speaker: "narrator", text: "Une porte claque. Des voix d'hommes. Très proches.", delayMs: 1100 },
    ],
    choices: [
      { id: "scream_plan", label: "« Faites tomber un objet pour les distraire. »", nextScene: "scene_7_end_act1" },
      { id: "silence", label: "« Ne dites plus un mot. Je guide. »", nextScene: "scene_7_end_act1", effects: { claireConfiance: 90 } },
      { id: "promise", label: "« Je vous sortirai de là. Je vous le jure. »", nextScene: "scene_7_end_act1", effects: { claireConfiance: 95, playerStress: 85 } },
    ],
    allowFreeText: true,
  },

  scene_7_end_act1: {
    id: "scene_7_end_act1",
    title: "Acte 1 · Souffle suspendu",
    beats: [
      { speaker: "narrator", text: "Le souffle de Claire devient à peine audible." },
      { speaker: "claire", text: "...ils sont juste derrière la porte.", delayMs: 1200 },
      { speaker: "narrator", text: "Une éternité passe. Puis... le silence.", delayMs: 1500 },
      { speaker: "claire", text: "...ils sont repartis. Pour cette fois.", delayMs: 1500 },
      { speaker: "system", text: "— FIN DE L'ACTE 1 —", delayMs: 1200 },
    ],
    choices: [
      { id: "continue_act2", label: "▶ Continuer — Acte 2 : Indices", nextScene: "scene_8_clues", effects: { playerStress: 60 } },
    ],
  },

  // ============================================================
  // ACT 2 — INDICES (investigation depuis la cellule)
  // ============================================================
  scene_8_clues: {
    id: "scene_8_clues",
    title: "Acte 2 · Premiers indices",
    onEnter: { dangerLevel: 55, ravisseursPresents: false, timeMinutes: 0 },
    beats: [
      { speaker: "narrator", text: "Vingt minutes plus tard. La maison est silencieuse." },
      { speaker: "claire", text: "Je vais essayer de regarder autour de moi.", delayMs: 1000 },
      { speaker: "claire", text: "Il y a... une vieille chaudière. Des outils rouillés. Et un calendrier au mur — 2007.", delayMs: 1800 },
    ],
    choices: [
      { id: "ask_window", label: "« Y a-t-il une fenêtre ? Du jour ? »", nextScene: "scene_9_window", effects: { claireConfiance: 80 } },
      { id: "ask_sound", label: "« Quels sons entendez-vous dehors ? »", nextScene: "scene_9_sounds", effects: { claireConfiance: 78 } },
      { id: "ask_smell", label: "« L'odeur — mer, forêt, ville ? »", nextScene: "scene_9_smell", effects: { claireConfiance: 75 } },
    ],
    allowFreeText: true,
    allowAdvanceTime: true,
  },

  scene_9_window: {
    id: "scene_9_window",
    title: "Acte 2 · Le soupirail",
    beats: [
      { speaker: "claire", text: "Il y a un soupirail tout en haut. Bouché par des planches.", delayMs: 1200 },
      { speaker: "claire", text: "Mais... un fin rai de lumière passe. Orange. C'est le soir.", delayMs: 1500 },
      { speaker: "narrator", text: "Indice : Lieu rural, fin de journée.", delayMs: 800 },
    ],
    choices: [
      { id: "to_act2_mid", label: "Continuer l'enquête", nextScene: "scene_10_phone_battery" },
    ],
  },

  scene_9_sounds: {
    id: "scene_9_sounds",
    title: "Acte 2 · Sons lointains",
    beats: [
      { speaker: "claire", text: "J'entends... un train. Au loin. Et des corbeaux. Beaucoup de corbeaux.", delayMs: 1500 },
      { speaker: "claire", text: "Pas de voitures. C'est pas la ville.", delayMs: 1000 },
      { speaker: "narrator", text: "Indice : Voie ferrée + zone isolée.", delayMs: 800 },
    ],
    choices: [{ id: "to_act2_mid", label: "Continuer l'enquête", nextScene: "scene_10_phone_battery" }],
  },

  scene_9_smell: {
    id: "scene_9_smell",
    title: "Acte 2 · Odeurs",
    beats: [
      { speaker: "claire", text: "Ça sent l'humidité... et le fioul. Comme une vieille ferme.", delayMs: 1400 },
      { speaker: "claire", text: "Et... quelque chose de sucré. Des pommes pourries peut-être.", delayMs: 1300 },
      { speaker: "narrator", text: "Indice : Exploitation agricole, verger abandonné.", delayMs: 800 },
    ],
    choices: [{ id: "to_act2_mid", label: "Continuer l'enquête", nextScene: "scene_10_phone_battery" }],
  },

  scene_10_phone_battery: {
    id: "scene_10_phone_battery",
    title: "Acte 2 · Batterie faible",
    onEnter: { playerStress: 65 },
    beats: [
      { speaker: "system", text: "🔋 Batterie de Claire : 17%" },
      { speaker: "claire", text: "Mon téléphone... il va bientôt s'éteindre.", delayMs: 1000 },
      { speaker: "claire", text: "Qu'est-ce que je fais ?", delayMs: 800 },
    ],
    choices: [
      { id: "conserve", label: "« Mettez en mode avion sauf pour moi. »", nextScene: "scene_11_voices", effects: { claireConfiance: 85 } },
      { id: "send_loc", label: "« Envoyez votre position GPS d'abord. »", nextScene: "scene_11_voices", effects: { claireConfiance: 90, playerStress: 60 } },
      { id: "keep", label: "« Gardez la ligne, peu importe. »", nextScene: "scene_11_voices", effects: { claireConfiance: 88, playerStress: 75 } },
    ],
    allowFreeText: true,
  },

  scene_11_voices: {
    id: "scene_11_voices",
    title: "Acte 2 · Les ravisseurs parlent",
    onEnter: { dangerLevel: 70, ravisseursPresents: true },
    beats: [
      { speaker: "narrator", text: "Des voix étouffées filtrent à travers le plafond." },
      { speaker: "claire", text: "Ils parlent de... 'la livraison'. Et d'un nom : Marek.", delayMs: 1500 },
      { speaker: "claire", text: "Ils disent qu'elle doit partir avant l'aube.", delayMs: 1200 },
    ],
    choices: [
      { id: "remember", label: "« Retenez ce nom. Marek. »", nextScene: "scene_12_end_act2", effects: { claireConfiance: 85 } },
      { id: "ask_more", label: "« Essayez d'écouter plus, sans bouger. »", nextScene: "scene_12_end_act2", effects: { playerStress: 80 } },
    ],
    allowFreeText: true,
  },

  scene_12_end_act2: {
    id: "scene_12_end_act2",
    title: "Acte 2 · Compte à rebours",
    onEnter: { dangerLevel: 75 },
    beats: [
      { speaker: "narrator", text: "Vous notez tout : verger, train, Marek, aube." },
      { speaker: "claire", text: "Je crois que vous êtes ma seule chance.", delayMs: 1300 },
      { speaker: "system", text: "— FIN DE L'ACTE 2 —", delayMs: 1200 },
    ],
    choices: [{ id: "continue_act3", label: "▶ Continuer — Acte 3 : Confrontation", nextScene: "scene_13_police" }],
  },

  // ============================================================
  // ACT 3 — CONFRONTATION (mobiliser les secours, jouer avec les ravisseurs)
  // ============================================================
  scene_13_police: {
    id: "scene_13_police",
    title: "Acte 3 · Appel aux secours",
    onEnter: { timeMinutes: 0, ravisseursPresents: false },
    beats: [
      { speaker: "system", text: "Vous contactez les autorités sur une seconde ligne." },
      { speaker: "unknown", text: "Police, je vous écoute. Décrivez votre urgence.", delayMs: 1000 },
    ],
    choices: [
      { id: "all_clues", label: "Tout dire : Marek, verger, train, aube", nextScene: "scene_14_doubt", effects: { claireConfiance: 92, playerStress: 60 } },
      { id: "partial", label: "Donner seulement la zone géographique", nextScene: "scene_14_doubt", effects: { claireConfiance: 80, playerStress: 65 } },
      { id: "lie_lowkey", label: "Mentir : prétendre être un proche", nextScene: "scene_14_doubt", effects: { playerStress: 80 } },
    ],
    allowFreeText: true,
  },

  scene_14_doubt: {
    id: "scene_14_doubt",
    title: "Acte 3 · Doute",
    beats: [
      { speaker: "unknown", text: "Nous envoyons une patrouille. Mais... la zone est vaste.", delayMs: 1300 },
      { speaker: "unknown", text: "Restez en ligne avec elle. Ne lui dites rien d'explicite.", delayMs: 1400 },
      { speaker: "claire", text: "Vous êtes encore là ? J'ai entendu un déclic.", delayMs: 1200 },
    ],
    choices: [
      { id: "reassure", label: "« Tout va bien. Je suis là. »", nextScene: "scene_15_kidnapper_call", effects: { claireConfiance: 88, playerStress: 65 } },
      { id: "code", label: "Lui parler en code pour la guider", nextScene: "scene_15_kidnapper_call", effects: { claireConfiance: 92, playerStress: 75 } },
    ],
    allowFreeText: true,
  },

  scene_15_kidnapper_call: {
    id: "scene_15_kidnapper_call",
    title: "Acte 3 · L'autre voix",
    onEnter: { dangerLevel: 85, ravisseursPresents: true },
    beats: [
      { speaker: "system", text: "📞 Appel entrant — Numéro masqué" },
      { speaker: "unknown", text: "On sait que vous parlez à la police.", delayMs: 1000 },
      { speaker: "unknown", text: "Encore un mot et on accélère le calendrier.", delayMs: 1300 },
    ],
    choices: [
      { id: "negotiate", label: "Négocier : gagner du temps", nextScene: "scene_16_end_act3", effects: { claireConfiance: 85, playerStress: 85 } },
      { id: "bluff", label: "Bluffer : « On est déjà devant chez vous. »", nextScene: "scene_16_end_act3", effects: { dangerLevel: 95, playerStress: 90 } },
      { id: "silent_def", label: "Ne rien dire. Raccrocher.", nextScene: "scene_16_end_act3", effects: { playerStress: 80 } },
    ],
    allowFreeText: true,
  },

  scene_16_end_act3: {
    id: "scene_16_end_act3",
    title: "Acte 3 · Compte à rebours serré",
    onEnter: { dangerLevel: 90 },
    beats: [
      { speaker: "claire", text: "J'ai entendu une voiture démarrer. Ils préparent quelque chose.", delayMs: 1300 },
      { speaker: "narrator", text: "Le temps presse. La patrouille est encore loin.", delayMs: 1100 },
      { speaker: "system", text: "— FIN DE L'ACTE 3 —", delayMs: 1200 },
    ],
    choices: [{ id: "continue_act4", label: "▶ Continuer — Acte 4 : Évasion", nextScene: "scene_17_escape" }],
  },

  // ============================================================
  // ACT 4 — ÉVASION (guider Claire physiquement)
  // ============================================================
  scene_17_escape: {
    id: "scene_17_escape",
    title: "Acte 4 · Tenter l'évasion",
    onEnter: { timeMinutes: 0, ravisseursPresents: false, dangerLevel: 70 },
    beats: [
      { speaker: "claire", text: "La porte du sous-sol... ils l'ont laissée entrouverte.", delayMs: 1200 },
      { speaker: "claire", text: "Je peux essayer. Mais j'ai peur. Dites-moi quoi faire.", delayMs: 1300 },
    ],
    choices: [
      { id: "go_now", label: "« Allez-y. Maintenant. Doucement. »", nextScene: "scene_18_stairs", effects: { claireConfiance: 90, playerStress: 80 } },
      { id: "wait_check", label: "« Attendez. Écoutez d'abord 30 secondes. »", nextScene: "scene_18_stairs", effects: { claireConfiance: 85, playerStress: 70 } },
      { id: "weapon", label: "« Prenez un outil. Pour vous défendre. »", nextScene: "scene_18_stairs", effects: { claireConfiance: 88, playerStress: 75 } },
    ],
    allowFreeText: true,
    allowAdvanceTime: true,
  },

  scene_18_stairs: {
    id: "scene_18_stairs",
    title: "Acte 4 · L'escalier",
    onEnter: { dangerLevel: 85, claireLocation: "moving" },
    beats: [
      { speaker: "narrator", text: "Vous l'entendez monter, marche après marche." },
      { speaker: "claire", text: "Une marche craque sous mon pied... oh mon dieu.", delayMs: 1400 },
      { speaker: "claire", text: "Personne. Je continue.", delayMs: 1000 },
    ],
    choices: [
      { id: "guide_left", label: "« Tournez à gauche, vers la lumière. »", nextScene: "scene_19_corridor", effects: { claireConfiance: 92 } },
      { id: "guide_right", label: "« À droite, vers la sortie probable. »", nextScene: "scene_19_corridor", effects: { claireConfiance: 90 } },
      { id: "stop", label: "« Stop. Cachez-vous. »", nextScene: "scene_19_corridor", effects: { playerStress: 85 } },
    ],
    allowFreeText: true,
  },

  scene_19_corridor: {
    id: "scene_19_corridor",
    title: "Acte 4 · Le couloir",
    onEnter: { dangerLevel: 92, ravisseursPresents: true },
    beats: [
      { speaker: "claire", text: "Je vois la porte d'entrée. À cinq mètres.", delayMs: 1200 },
      { speaker: "claire", text: "Et... il y a un homme. De dos. Il fume sur le perron.", delayMs: 1500 },
    ],
    choices: [
      { id: "distract", label: "« Cassez quelque chose à l'étage pour le faire monter. »", nextScene: "scene_20_end_act4", effects: { claireConfiance: 94, playerStress: 88 } },
      { id: "rush", label: "« Courez. Tout de suite. »", nextScene: "scene_20_end_act4", effects: { dangerLevel: 98, playerStress: 95 } },
      { id: "backdoor", label: "« Cherchez une porte arrière. »", nextScene: "scene_20_end_act4", effects: { claireConfiance: 92, playerStress: 80 } },
    ],
    allowFreeText: true,
  },

  scene_20_end_act4: {
    id: "scene_20_end_act4",
    title: "Acte 4 · Premier souffle",
    beats: [
      { speaker: "narrator", text: "Vous entendez sa respiration s'accélérer..." },
      { speaker: "claire", text: "Je suis dehors. JE SUIS DEHORS.", delayMs: 1400 },
      { speaker: "claire", text: "Mais ils vont s'en rendre compte. Bientôt.", delayMs: 1100 },
      { speaker: "system", text: "— FIN DE L'ACTE 4 —", delayMs: 1200 },
    ],
    choices: [{ id: "continue_act5", label: "▶ Continuer — Acte 5 : Délivrance", nextScene: "scene_21_run" }],
  },

  // ============================================================
  // ACT 5 — DÉLIVRANCE (course-poursuite finale)
  // ============================================================
  scene_21_run: {
    id: "scene_21_run",
    title: "Acte 5 · La course",
    onEnter: { timeMinutes: 0, dangerLevel: 88, claireLocation: "moving" },
    beats: [
      { speaker: "claire", text: "Je cours dans le verger. Les branches me griffent le visage.", delayMs: 1300 },
      { speaker: "claire", text: "Où je vais ? Dites-moi où aller !", delayMs: 1000 },
    ],
    choices: [
      { id: "to_train", label: "« Le bruit du train — courez vers les rails. »", nextScene: "scene_22_chase", effects: { claireConfiance: 95 } },
      { id: "to_road", label: "« Cherchez une route. Une voiture. »", nextScene: "scene_22_chase", effects: { claireConfiance: 90 } },
      { id: "hide", label: "« Cachez-vous. Ne bougez plus. »", nextScene: "scene_22_chase", effects: { playerStress: 90 } },
    ],
    allowFreeText: true,
  },

  scene_22_chase: {
    id: "scene_22_chase",
    title: "Acte 5 · Phares",
    onEnter: { dangerLevel: 96, ravisseursPresents: true },
    beats: [
      { speaker: "narrator", text: "Des phares balaient les arbres. Ils sont en chasse." },
      { speaker: "claire", text: "Ils me cherchent. Avec des lampes torches.", delayMs: 1300 },
      { speaker: "system", text: "🚓 SMS Police : 'Patrouille à 3 km. Tenez bon.'", delayMs: 1200 },
    ],
    choices: [
      { id: "signal", label: "« Allumez votre flash. Visez le ciel. »", nextScene: "scene_23_final", effects: { claireConfiance: 95, playerStress: 90 } },
      { id: "silent_run", label: "« Plus un bruit. Rampez. »", nextScene: "scene_23_final", effects: { claireConfiance: 93, playerStress: 85 } },
      { id: "scream_help", label: "« Criez. Tout ce que vous avez. »", nextScene: "scene_23_final", effects: { dangerLevel: 99, claireConfiance: 90 } },
    ],
    allowFreeText: true,
  },

  scene_23_final: {
    id: "scene_23_final",
    title: "Acte 5 · Sirènes",
    onEnter: { dangerLevel: 75 },
    beats: [
      { speaker: "narrator", text: "Au loin, des sirènes. Qui se rapprochent." },
      { speaker: "claire", text: "Je les entends. Je les entends !", delayMs: 1200 },
      { speaker: "narrator", text: "Un homme hurle son nom dans la nuit. Des pas s'approchent dans la boue.", delayMs: 1400 },
    ],
    choices: [
      { id: "hold_on", label: "« Tenez bon. Encore quelques secondes. »", nextScene: "scene_24_rescue", effects: { claireConfiance: 100, playerStress: 95 } },
      { id: "fight", label: "« S'il vous touche : frappez. Visez la gorge. »", nextScene: "scene_24_rescue", effects: { claireConfiance: 97, playerStress: 92 } },
    ],
    allowFreeText: true,
  },

  scene_24_rescue: {
    id: "scene_24_rescue",
    title: "Acte 5 · Délivrance",
    onEnter: { dangerLevel: 20, ravisseursPresents: false, claireLocation: "rescued", missionStatus: "complete" },
    beats: [
      { speaker: "system", text: "🚓 Police sur les lieux." },
      { speaker: "narrator", text: "Un faisceau de phare la frappe. Un cri. 'POLICE, À TERRE !'", delayMs: 1500 },
      { speaker: "claire", text: "Ils... ils m'ont eue. Ils m'ont eue.", delayMs: 1400 },
      { speaker: "claire", text: "Vous êtes encore là ?", delayMs: 1200 },
      { speaker: "claire", text: "Merci. Merci d'avoir décroché.", delayMs: 1500 },
      { speaker: "system", text: "— MISSION ACCOMPLIE —", delayMs: 1500 },
      { speaker: "system", text: "Claire est sauve. Grâce à vous.", delayMs: 1000 },
    ],
    choices: [],
  },

  // ============================================================
  // ÉCHEC
  // ============================================================
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
