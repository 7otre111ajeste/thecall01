import type { Loc, Scene } from "./types";

const L = (fr: string, en: string): Loc => ({ fr, en });

// THE CALL — Full scripted campaign (Acts 1 → 5). AI never invents scenes.
export const SCENES: Record<string, Scene> = {
  // ============================================================
  // ACT 1 — L'APPEL
  // ============================================================
  scene_1_incoming: {
    id: "scene_1_incoming",
    title: L("Acte 1 · Appel inconnu", "Act 1 · Unknown call"),
    beats: [
      { speaker: "system", text: L("📞 Appel entrant — Numéro inconnu", "📞 Incoming call — Unknown number") },
      { speaker: "system", text: L("Vous décrochez.", "You pick up.") },
      { speaker: "claire", text: L("Ne raccrochez pas ! S'il vous plaît !", "Don't hang up! Please!"), delayMs: 800 },
      { speaker: "claire", text: L("Je crois que je suis kidnappée... et je ne peux pas couper l'appel.", "I think I've been kidnapped... and I can't end this call."), delayMs: 1200 },
    ],
    choices: [
      { id: "stay", label: L("Rester en ligne", "Stay on the line"), nextScene: "scene_2_identity", effects: { claireConfiance: 50, playerStress: 35 } },
      { id: "doubt", label: L("« C'est une blague ? »", "\"Is this a joke?\""), nextScene: "scene_2_identity", effects: { claireConfiance: 25 } },
      { id: "hangup", label: L("Raccrocher", "Hang up"), nextScene: "scene_bad_hangup", effects: { missionStatus: "failed" } },
    ],
  },

  scene_2_identity: {
    id: "scene_2_identity",
    title: L("Acte 1 · Identité", "Act 1 · Identity"),
    onEnter: { playerStress: 40 },
    beats: [
      { speaker: "claire", text: L("Je... je m'appelle Claire.", "I... my name is Claire.") },
      { speaker: "claire", text: L("Je suis enfermée dans un sous-sol. Je ne sais pas où.", "I'm locked in a basement. I don't know where."), delayMs: 1500 },
      { speaker: "claire", text: L("Il fait sombre. Il y a une odeur d'humidité.", "It's dark. It smells damp."), delayMs: 1500 },
    ],
    choices: [
      { id: "calm", label: L("« Respirez. Je suis là. »", "\"Breathe. I'm here.\""), nextScene: "scene_3_first_danger", effects: { claireConfiance: 60, playerStress: 35 } },
      { id: "question", label: L("« Décrivez ce que vous voyez. »", "\"Describe what you see.\""), nextScene: "scene_3_first_danger", effects: { claireConfiance: 55 } },
      { id: "police", label: L("« J'appelle la police en parallèle. »", "\"I'm calling the police on another line.\""), nextScene: "scene_3_first_danger", effects: { claireConfiance: 65, playerStress: 50 } },
    ],
    allowFreeText: true,
  },

  scene_3_first_danger: {
    id: "scene_3_first_danger",
    title: L("Acte 1 · Premier danger", "Act 1 · First danger"),
    onEnter: { dangerLevel: 45, ravisseursPresents: true, claireLocation: "basement" },
    beats: [
      { speaker: "narrator", text: L("Des pas lourds résonnent au-dessus d'elle.", "Heavy footsteps echo above her.") },
      { speaker: "claire", text: L("Oh mon dieu... ils reviennent.", "Oh god... they're coming back."), delayMs: 900 },
      { speaker: "claire", text: L("Chuuut. Je dois me taire.", "Shhh. I have to stay quiet."), delayMs: 1000 },
    ],
    choices: [
      { id: "whisper", label: L("Chuchoter : « Cachez-vous. »", "Whisper: \"Hide.\""), nextScene: "scene_4_choice", effects: { claireConfiance: 70 } },
      { id: "listen", label: L("Écouter en silence", "Listen in silence"), nextScene: "scene_4_choice", effects: { playerStress: 60 } },
      { id: "record", label: L("Activer l'enregistrement", "Start recording"), nextScene: "scene_4_choice", effects: { playerStress: 55 } },
    ],
    allowAdvanceTime: true,
  },

  scene_4_choice: {
    id: "scene_4_choice",
    title: L("Acte 1 · Le choix", "Act 1 · The choice"),
    onEnter: { ravisseursPresents: false },
    beats: [
      { speaker: "narrator", text: L("Les pas s'éloignent. Pour l'instant.", "The footsteps move away. For now.") },
      { speaker: "claire", text: L("Ils sont partis... je crois.", "They're gone... I think."), delayMs: 1100 },
      { speaker: "claire", text: L("Qu'est-ce que je fais ?", "What do I do?"), delayMs: 800 },
    ],
    choices: [
      { id: "stay_line", label: L("« Restez en ligne, ne bougez pas. »", "\"Stay on the line, don't move.\""), nextScene: "scene_5_threat" },
      { id: "explore", label: L("« Cherchez un indice : objet, son, odeur. »", "\"Look for a clue: object, sound, smell.\""), nextScene: "scene_5_threat", effects: { claireConfiance: 75 } },
      { id: "calm_her", label: L("La calmer doucement", "Gently calm her down"), nextScene: "scene_5_threat", effects: { claireConfiance: 80, playerStress: 40 } },
    ],
    allowFreeText: true,
    allowAdvanceTime: true,
  },

  scene_5_threat: {
    id: "scene_5_threat",
    title: L("Acte 1 · Menace externe", "Act 1 · Outside threat"),
    onEnter: { dangerLevel: 65 },
    beats: [
      { speaker: "system", text: L("📩 Nouveau message — Expéditeur masqué", "📩 New message — Hidden sender") },
      { speaker: "unknown", text: L("Vous n'êtes pas censé être dans cet appel.", "You're not supposed to be on this call."), delayMs: 1000 },
      { speaker: "unknown", text: L("Raccrochez. Maintenant.", "Hang up. Now."), delayMs: 1200 },
    ],
    choices: [
      { id: "defy", label: L("Ignorer et rester avec Claire", "Ignore it and stay with Claire"), nextScene: "scene_6_escalation", effects: { playerStress: 75, claireConfiance: 85 } },
      { id: "reply", label: L("Répondre : « Qui êtes-vous ? »", "Reply: \"Who are you?\""), nextScene: "scene_6_escalation", effects: { dangerLevel: 80, playerStress: 70 } },
      { id: "trace", label: L("Tenter de tracer le numéro", "Try to trace the number"), nextScene: "scene_6_escalation", effects: { playerStress: 65 } },
    ],
  },

  scene_6_escalation: {
    id: "scene_6_escalation",
    title: L("Acte 1 · Escalade", "Act 1 · Escalation"),
    onEnter: { dangerLevel: 90, ravisseursPresents: true },
    beats: [
      { speaker: "claire", text: L("Ils redescendent ! Ils m'ont entendue !", "They're coming back down! They heard me!") },
      { speaker: "claire", text: L("S'il vous plaît, faites quelque chose !", "Please, do something!"), delayMs: 900 },
      { speaker: "narrator", text: L("Une porte claque. Des voix d'hommes. Très proches.", "A door slams. Men's voices. Very close."), delayMs: 1100 },
    ],
    choices: [
      { id: "scream_plan", label: L("« Faites tomber un objet pour les distraire. »", "\"Knock something over to distract them.\""), nextScene: "scene_7_end_act1" },
      { id: "silence", label: L("« Ne dites plus un mot. Je guide. »", "\"Not another word. I'll guide you.\""), nextScene: "scene_7_end_act1", effects: { claireConfiance: 90 } },
      { id: "promise", label: L("« Je vous sortirai de là. Je vous le jure. »", "\"I will get you out. I swear it.\""), nextScene: "scene_7_end_act1", effects: { claireConfiance: 95, playerStress: 85 } },
    ],
    allowFreeText: true,
  },

  scene_7_end_act1: {
    id: "scene_7_end_act1",
    title: L("Acte 1 · Souffle suspendu", "Act 1 · Held breath"),
    beats: [
      { speaker: "narrator", text: L("Le souffle de Claire devient à peine audible.", "Claire's breathing becomes barely audible.") },
      { speaker: "claire", text: L("...ils sont juste derrière la porte.", "...they're right behind the door."), delayMs: 1200 },
      { speaker: "narrator", text: L("Une éternité passe. Puis... le silence.", "An eternity passes. Then... silence."), delayMs: 1500 },
      { speaker: "claire", text: L("...ils sont repartis. Pour cette fois.", "...they left. This time."), delayMs: 1500 },
      { speaker: "system", text: L("— FIN DE L'ACTE 1 —", "— END OF ACT 1 —"), delayMs: 1200 },
    ],
    choices: [
      { id: "continue_act2", label: L("▶ Continuer — Acte 2 : Indices", "▶ Continue — Act 2: Clues"), nextScene: "scene_8_clues", effects: { playerStress: 60 } },
    ],
  },

  // ============================================================
  // ACT 2 — INDICES
  // ============================================================
  scene_8_clues: {
    id: "scene_8_clues",
    title: L("Acte 2 · Premiers indices", "Act 2 · First clues"),
    onEnter: { dangerLevel: 55, ravisseursPresents: false, timeMinutes: 0 },
    beats: [
      { speaker: "narrator", text: L("Vingt minutes plus tard. La maison est silencieuse.", "Twenty minutes later. The house is silent.") },
      { speaker: "claire", text: L("Je vais essayer de regarder autour de moi.", "I'm going to try to look around."), delayMs: 1000 },
      { speaker: "claire", text: L("Il y a... une vieille chaudière. Des outils rouillés. Et un calendrier au mur — 2007.", "There's... an old boiler. Rusted tools. And a calendar on the wall — 2007."), delayMs: 1800 },
    ],
    choices: [
      { id: "ask_window", label: L("« Y a-t-il une fenêtre ? Du jour ? »", "\"Is there a window? Any daylight?\""), nextScene: "scene_9_window", effects: { claireConfiance: 80 } },
      { id: "ask_sound", label: L("« Quels sons entendez-vous dehors ? »", "\"What sounds do you hear outside?\""), nextScene: "scene_9_sounds", effects: { claireConfiance: 78 } },
      { id: "ask_smell", label: L("« L'odeur — mer, forêt, ville ? »", "\"The smell — sea, forest, city?\""), nextScene: "scene_9_smell", effects: { claireConfiance: 75 } },
    ],
    allowFreeText: true,
    allowAdvanceTime: true,
  },

  scene_9_window: {
    id: "scene_9_window",
    title: L("Acte 2 · Le soupirail", "Act 2 · The vent window"),
    beats: [
      { speaker: "claire", text: L("Il y a un soupirail tout en haut. Bouché par des planches.", "There's a small window up high. Boarded shut."), delayMs: 1200 },
      { speaker: "claire", text: L("Mais... un fin rai de lumière passe. Orange. C'est le soir.", "But... a thin line of light gets through. Orange. It's evening."), delayMs: 1500 },
      { speaker: "narrator", text: L("Indice : Lieu rural, fin de journée.", "Clue: Rural location, end of day."), delayMs: 800 },
    ],
    choices: [
      { id: "to_act2_mid", label: L("Continuer l'enquête", "Continue the investigation"), nextScene: "scene_10_phone_battery" },
    ],
  },

  scene_9_sounds: {
    id: "scene_9_sounds",
    title: L("Acte 2 · Sons lointains", "Act 2 · Distant sounds"),
    beats: [
      { speaker: "claire", text: L("J'entends... un train. Au loin. Et des corbeaux. Beaucoup de corbeaux.", "I hear... a train. Far away. And crows. A lot of crows."), delayMs: 1500 },
      { speaker: "claire", text: L("Pas de voitures. C'est pas la ville.", "No cars. This isn't the city."), delayMs: 1000 },
      { speaker: "narrator", text: L("Indice : Voie ferrée + zone isolée.", "Clue: Railway + isolated area."), delayMs: 800 },
    ],
    choices: [{ id: "to_act2_mid", label: L("Continuer l'enquête", "Continue the investigation"), nextScene: "scene_10_phone_battery" }],
  },

  scene_9_smell: {
    id: "scene_9_smell",
    title: L("Acte 2 · Odeurs", "Act 2 · Smells"),
    beats: [
      { speaker: "claire", text: L("Ça sent l'humidité... et le fioul. Comme une vieille ferme.", "It smells damp... and like heating oil. Like an old farm."), delayMs: 1400 },
      { speaker: "claire", text: L("Et... quelque chose de sucré. Des pommes pourries peut-être.", "And... something sweet. Rotting apples maybe."), delayMs: 1300 },
      { speaker: "narrator", text: L("Indice : Exploitation agricole, verger abandonné.", "Clue: Farmland, abandoned orchard."), delayMs: 800 },
    ],
    choices: [{ id: "to_act2_mid", label: L("Continuer l'enquête", "Continue the investigation"), nextScene: "scene_10_phone_battery" }],
  },

  scene_10_phone_battery: {
    id: "scene_10_phone_battery",
    title: L("Acte 2 · Batterie faible", "Act 2 · Low battery"),
    onEnter: { playerStress: 65 },
    beats: [
      { speaker: "system", text: L("🔋 Batterie de Claire : 17%", "🔋 Claire's battery: 17%") },
      { speaker: "claire", text: L("Mon téléphone... il va bientôt s'éteindre.", "My phone... it's going to die soon."), delayMs: 1000 },
      { speaker: "claire", text: L("Qu'est-ce que je fais ?", "What do I do?"), delayMs: 800 },
    ],
    choices: [
      { id: "conserve", label: L("« Mettez en mode avion sauf pour moi. »", "\"Go airplane mode, except for me.\""), nextScene: "scene_11_voices", effects: { claireConfiance: 85 } },
      { id: "send_loc", label: L("« Envoyez votre position GPS d'abord. »", "\"Send your GPS location first.\""), nextScene: "scene_11_voices", effects: { claireConfiance: 90, playerStress: 60 } },
      { id: "keep", label: L("« Gardez la ligne, peu importe. »", "\"Keep the line open, no matter what.\""), nextScene: "scene_11_voices", effects: { claireConfiance: 88, playerStress: 75 } },
    ],
    allowFreeText: true,
  },

  scene_11_voices: {
    id: "scene_11_voices",
    title: L("Acte 2 · Les ravisseurs parlent", "Act 2 · The captors talk"),
    onEnter: { dangerLevel: 70, ravisseursPresents: true },
    beats: [
      { speaker: "narrator", text: L("Des voix étouffées filtrent à travers le plafond.", "Muffled voices filter through the ceiling.") },
      { speaker: "claire", text: L("Ils parlent de... 'la livraison'. Et d'un nom : Marek.", "They're talking about... 'the delivery'. And a name: Marek."), delayMs: 1500 },
      { speaker: "claire", text: L("Ils disent qu'elle doit partir avant l'aube.", "They say it has to leave before dawn."), delayMs: 1200 },
    ],
    choices: [
      { id: "remember", label: L("« Retenez ce nom. Marek. »", "\"Remember that name. Marek.\""), nextScene: "scene_12_end_act2", effects: { claireConfiance: 85 } },
      { id: "ask_more", label: L("« Essayez d'écouter plus, sans bouger. »", "\"Try to listen more, without moving.\""), nextScene: "scene_12_end_act2", effects: { playerStress: 80 } },
    ],
    allowFreeText: true,
  },

  scene_12_end_act2: {
    id: "scene_12_end_act2",
    title: L("Acte 2 · Compte à rebours", "Act 2 · Countdown"),
    onEnter: { dangerLevel: 75 },
    beats: [
      { speaker: "narrator", text: L("Vous notez tout : verger, train, Marek, aube.", "You write it all down: orchard, train, Marek, dawn.") },
      { speaker: "claire", text: L("Je crois que vous êtes ma seule chance.", "I think you're my only chance."), delayMs: 1300 },
      { speaker: "system", text: L("— FIN DE L'ACTE 2 —", "— END OF ACT 2 —"), delayMs: 1200 },
    ],
    choices: [{ id: "continue_act3", label: L("▶ Continuer — Acte 3 : Confrontation", "▶ Continue — Act 3: Confrontation"), nextScene: "scene_13_police" }],
  },

  // ============================================================
  // ACT 3 — CONFRONTATION
  // ============================================================
  scene_13_police: {
    id: "scene_13_police",
    title: L("Acte 3 · Appel aux secours", "Act 3 · Calling for help"),
    onEnter: { timeMinutes: 0, ravisseursPresents: false },
    beats: [
      { speaker: "system", text: L("Vous contactez les autorités sur une seconde ligne.", "You contact the authorities on a second line.") },
      { speaker: "unknown", text: L("Police, je vous écoute. Décrivez votre urgence.", "Police, go ahead. Describe your emergency."), delayMs: 1000 },
    ],
    choices: [
      { id: "all_clues", label: L("Tout dire : Marek, verger, train, aube", "Tell everything: Marek, orchard, train, dawn"), nextScene: "scene_14_doubt", effects: { claireConfiance: 92, playerStress: 60 } },
      { id: "partial", label: L("Donner seulement la zone géographique", "Give only the geographic area"), nextScene: "scene_14_doubt", effects: { claireConfiance: 80, playerStress: 65 } },
      { id: "lie_lowkey", label: L("Mentir : prétendre être un proche", "Lie: pretend to be a relative"), nextScene: "scene_14_doubt", effects: { playerStress: 80 } },
    ],
    allowFreeText: true,
  },

  scene_14_doubt: {
    id: "scene_14_doubt",
    title: L("Acte 3 · Doute", "Act 3 · Doubt"),
    beats: [
      { speaker: "unknown", text: L("Nous envoyons une patrouille. Mais... la zone est vaste.", "We're sending a patrol. But... the area is huge."), delayMs: 1300 },
      { speaker: "unknown", text: L("Restez en ligne avec elle. Ne lui dites rien d'explicite.", "Stay on the line with her. Don't tell her anything explicit."), delayMs: 1400 },
      { speaker: "claire", text: L("Vous êtes encore là ? J'ai entendu un déclic.", "Are you still there? I heard a click."), delayMs: 1200 },
    ],
    choices: [
      { id: "reassure", label: L("« Tout va bien. Je suis là. »", "\"Everything's fine. I'm here.\""), nextScene: "scene_15_kidnapper_call", effects: { claireConfiance: 88, playerStress: 65 } },
      { id: "code", label: L("Lui parler en code pour la guider", "Speak in code to guide her"), nextScene: "scene_15_kidnapper_call", effects: { claireConfiance: 92, playerStress: 75 } },
    ],
    allowFreeText: true,
  },

  scene_15_kidnapper_call: {
    id: "scene_15_kidnapper_call",
    title: L("Acte 3 · L'autre voix", "Act 3 · The other voice"),
    onEnter: { dangerLevel: 85, ravisseursPresents: true },
    beats: [
      { speaker: "system", text: L("📞 Appel entrant — Numéro masqué", "📞 Incoming call — Hidden number") },
      { speaker: "unknown", text: L("On sait que vous parlez à la police.", "We know you're talking to the police."), delayMs: 1000 },
      { speaker: "unknown", text: L("Encore un mot et on accélère le calendrier.", "One more word and we move the schedule up."), delayMs: 1300 },
    ],
    choices: [
      { id: "negotiate", label: L("Négocier : gagner du temps", "Negotiate: buy time"), nextScene: "scene_16_end_act3", effects: { claireConfiance: 85, playerStress: 85 } },
      { id: "bluff", label: L("Bluffer : « On est déjà devant chez vous. »", "Bluff: \"We're already outside your door.\""), nextScene: "scene_16_end_act3", effects: { dangerLevel: 95, playerStress: 90 } },
      { id: "silent_def", label: L("Ne rien dire. Raccrocher.", "Say nothing. Hang up."), nextScene: "scene_16_end_act3", effects: { playerStress: 80 } },
    ],
    allowFreeText: true,
  },

  scene_16_end_act3: {
    id: "scene_16_end_act3",
    title: L("Acte 3 · Compte à rebours serré", "Act 3 · Tight countdown"),
    onEnter: { dangerLevel: 90 },
    beats: [
      { speaker: "claire", text: L("J'ai entendu une voiture démarrer. Ils préparent quelque chose.", "I heard a car start. They're preparing something."), delayMs: 1300 },
      { speaker: "narrator", text: L("Le temps presse. La patrouille est encore loin.", "Time is short. The patrol is still far away."), delayMs: 1100 },
      { speaker: "system", text: L("— FIN DE L'ACTE 3 —", "— END OF ACT 3 —"), delayMs: 1200 },
    ],
    choices: [{ id: "continue_act4", label: L("▶ Continuer — Acte 4 : Évasion", "▶ Continue — Act 4: Escape"), nextScene: "scene_17_escape" }],
  },

  // ============================================================
  // ACT 4 — ÉVASION
  // ============================================================
  scene_17_escape: {
    id: "scene_17_escape",
    title: L("Acte 4 · Tenter l'évasion", "Act 4 · Attempting escape"),
    onEnter: { timeMinutes: 0, ravisseursPresents: false, dangerLevel: 70 },
    beats: [
      { speaker: "claire", text: L("La porte du sous-sol... ils l'ont laissée entrouverte.", "The basement door... they left it ajar."), delayMs: 1200 },
      { speaker: "claire", text: L("Je peux essayer. Mais j'ai peur. Dites-moi quoi faire.", "I can try. But I'm scared. Tell me what to do."), delayMs: 1300 },
    ],
    choices: [
      { id: "go_now", label: L("« Allez-y. Maintenant. Doucement. »", "\"Go. Now. Slowly.\""), nextScene: "scene_18_stairs", effects: { claireConfiance: 90, playerStress: 80 } },
      { id: "wait_check", label: L("« Attendez. Écoutez d'abord 30 secondes. »", "\"Wait. Listen for 30 seconds first.\""), nextScene: "scene_18_stairs", effects: { claireConfiance: 85, playerStress: 70 } },
      { id: "weapon", label: L("« Prenez un outil. Pour vous défendre. »", "\"Grab a tool. To defend yourself.\""), nextScene: "scene_18_stairs", effects: { claireConfiance: 88, playerStress: 75 } },
    ],
    allowFreeText: true,
    allowAdvanceTime: true,
  },

  scene_18_stairs: {
    id: "scene_18_stairs",
    title: L("Acte 4 · L'escalier", "Act 4 · The stairs"),
    onEnter: { dangerLevel: 85, claireLocation: "moving" },
    beats: [
      { speaker: "narrator", text: L("Vous l'entendez monter, marche après marche.", "You hear her climbing, step after step.") },
      { speaker: "claire", text: L("Une marche craque sous mon pied... oh mon dieu.", "A step creaks under my foot... oh god."), delayMs: 1400 },
      { speaker: "claire", text: L("Personne. Je continue.", "Nobody. I'm going on."), delayMs: 1000 },
    ],
    choices: [
      { id: "guide_left", label: L("« Tournez à gauche, vers la lumière. »", "\"Turn left, toward the light.\""), nextScene: "scene_19_corridor", effects: { claireConfiance: 92 } },
      { id: "guide_right", label: L("« À droite, vers la sortie probable. »", "\"Right, toward the likely exit.\""), nextScene: "scene_19_corridor", effects: { claireConfiance: 90 } },
      { id: "stop", label: L("« Stop. Cachez-vous. »", "\"Stop. Hide.\""), nextScene: "scene_19_corridor", effects: { playerStress: 85 } },
    ],
    allowFreeText: true,
  },

  scene_19_corridor: {
    id: "scene_19_corridor",
    title: L("Acte 4 · Le couloir", "Act 4 · The hallway"),
    onEnter: { dangerLevel: 92, ravisseursPresents: true },
    beats: [
      { speaker: "claire", text: L("Je vois la porte d'entrée. À cinq mètres.", "I can see the front door. Five meters away."), delayMs: 1200 },
      { speaker: "claire", text: L("Et... il y a un homme. De dos. Il fume sur le perron.", "And... there's a man. Facing away. Smoking on the porch."), delayMs: 1500 },
    ],
    choices: [
      { id: "distract", label: L("« Cassez quelque chose à l'étage pour le faire monter. »", "\"Break something upstairs to draw him up.\""), nextScene: "scene_20_end_act4", effects: { claireConfiance: 94, playerStress: 88 } },
      { id: "rush", label: L("« Courez. Tout de suite. »", "\"Run. Right now.\""), nextScene: "scene_20_end_act4", effects: { dangerLevel: 98, playerStress: 95 } },
      { id: "backdoor", label: L("« Cherchez une porte arrière. »", "\"Look for a back door.\""), nextScene: "scene_20_end_act4", effects: { claireConfiance: 92, playerStress: 80 } },
    ],
    allowFreeText: true,
  },

  scene_20_end_act4: {
    id: "scene_20_end_act4",
    title: L("Acte 4 · Premier souffle", "Act 4 · First breath"),
    beats: [
      { speaker: "narrator", text: L("Vous entendez sa respiration s'accélérer...", "You hear her breathing quicken...") },
      { speaker: "claire", text: L("Je suis dehors. JE SUIS DEHORS.", "I'm outside. I'M OUTSIDE."), delayMs: 1400 },
      { speaker: "claire", text: L("Mais ils vont s'en rendre compte. Bientôt.", "But they'll notice. Soon."), delayMs: 1100 },
      { speaker: "system", text: L("— FIN DE L'ACTE 4 —", "— END OF ACT 4 —"), delayMs: 1200 },
    ],
    choices: [{ id: "continue_act5", label: L("▶ Continuer — Acte 5 : Délivrance", "▶ Continue — Act 5: Deliverance"), nextScene: "scene_21_run" }],
  },

  // ============================================================
  // ACT 5 — DÉLIVRANCE
  // ============================================================
  scene_21_run: {
    id: "scene_21_run",
    title: L("Acte 5 · La course", "Act 5 · The run"),
    onEnter: { timeMinutes: 0, dangerLevel: 88, claireLocation: "moving" },
    beats: [
      { speaker: "claire", text: L("Je cours dans le verger. Les branches me griffent le visage.", "I'm running through the orchard. Branches are clawing my face."), delayMs: 1300 },
      { speaker: "claire", text: L("Où je vais ? Dites-moi où aller !", "Where do I go? Tell me where to go!"), delayMs: 1000 },
    ],
    choices: [
      { id: "to_train", label: L("« Le bruit du train — courez vers les rails. »", "\"The train sound — run toward the tracks.\""), nextScene: "scene_22_chase", effects: { claireConfiance: 95 } },
      { id: "to_road", label: L("« Cherchez une route. Une voiture. »", "\"Find a road. A car.\""), nextScene: "scene_22_chase", effects: { claireConfiance: 90 } },
      { id: "hide", label: L("« Cachez-vous. Ne bougez plus. »", "\"Hide. Don't move.\""), nextScene: "scene_22_chase", effects: { playerStress: 90 } },
    ],
    allowFreeText: true,
  },

  scene_22_chase: {
    id: "scene_22_chase",
    title: L("Acte 5 · Phares", "Act 5 · Headlights"),
    onEnter: { dangerLevel: 96, ravisseursPresents: true },
    beats: [
      { speaker: "narrator", text: L("Des phares balaient les arbres. Ils sont en chasse.", "Headlights sweep the trees. They're hunting.") },
      { speaker: "claire", text: L("Ils me cherchent. Avec des lampes torches.", "They're looking for me. With flashlights."), delayMs: 1300 },
      { speaker: "system", text: L("🚓 SMS Police : 'Patrouille à 3 km. Tenez bon.'", "🚓 Police SMS: 'Patrol 3 km away. Hold on.'"), delayMs: 1200 },
    ],
    choices: [
      { id: "signal", label: L("« Allumez votre flash. Visez le ciel. »", "\"Turn on your flash. Point it at the sky.\""), nextScene: "scene_23_final", effects: { claireConfiance: 95, playerStress: 90 } },
      { id: "silent_run", label: L("« Plus un bruit. Rampez. »", "\"Not a sound. Crawl.\""), nextScene: "scene_23_final", effects: { claireConfiance: 93, playerStress: 85 } },
      { id: "scream_help", label: L("« Criez. Tout ce que vous avez. »", "\"Scream. Everything you've got.\""), nextScene: "scene_23_final", effects: { dangerLevel: 99, claireConfiance: 90 } },
    ],
    allowFreeText: true,
  },

  scene_23_final: {
    id: "scene_23_final",
    title: L("Acte 5 · Sirènes", "Act 5 · Sirens"),
    onEnter: { dangerLevel: 75 },
    beats: [
      { speaker: "narrator", text: L("Au loin, des sirènes. Qui se rapprochent.", "Far off, sirens. Getting closer.") },
      { speaker: "claire", text: L("Je les entends. Je les entends !", "I hear them. I hear them!"), delayMs: 1200 },
      { speaker: "narrator", text: L("Un homme hurle son nom dans la nuit. Des pas s'approchent dans la boue.", "A man screams her name into the night. Footsteps approach through the mud."), delayMs: 1400 },
    ],
    choices: [
      { id: "hold_on", label: L("« Tenez bon. Encore quelques secondes. »", "\"Hold on. Just a few more seconds.\""), nextScene: "scene_24_rescue", effects: { claireConfiance: 100, playerStress: 95 } },
      { id: "fight", label: L("« S'il vous touche : frappez. Visez la gorge. »", "\"If he touches you: strike. Aim for the throat.\""), nextScene: "scene_24_rescue", effects: { claireConfiance: 97, playerStress: 92 } },
    ],
    allowFreeText: true,
  },

  scene_24_rescue: {
    id: "scene_24_rescue",
    title: L("Acte 5 · Délivrance", "Act 5 · Deliverance"),
    onEnter: { dangerLevel: 20, ravisseursPresents: false, claireLocation: "rescued", missionStatus: "complete" },
    beats: [
      { speaker: "system", text: L("🚓 Police sur les lieux.", "🚓 Police on scene.") },
      { speaker: "narrator", text: L("Un faisceau de phare la frappe. Un cri. 'POLICE, À TERRE !'", "A headlight beam hits her. A shout. 'POLICE, GET DOWN!'"), delayMs: 1500 },
      { speaker: "claire", text: L("Ils... ils m'ont eue. Ils m'ont eue.", "They... they got me. They got me."), delayMs: 1400 },
      { speaker: "claire", text: L("Vous êtes encore là ?", "Are you still there?"), delayMs: 1200 },
      { speaker: "claire", text: L("Merci. Merci d'avoir décroché.", "Thank you. Thank you for picking up."), delayMs: 1500 },
      { speaker: "system", text: L("— MISSION ACCOMPLIE —", "— MISSION COMPLETE —"), delayMs: 1500 },
      { speaker: "system", text: L("Claire est sauve. Grâce à vous.", "Claire is safe. Because of you."), delayMs: 1000 },
    ],
    choices: [],
  },

  // ============================================================
  // ÉCHEC
  // ============================================================
  scene_bad_hangup: {
    id: "scene_bad_hangup",
    title: L("Vous avez raccroché", "You hung up"),
    onEnter: { missionStatus: "failed", claireLocation: "lost" },
    beats: [
      { speaker: "system", text: L("📵 Appel terminé.", "📵 Call ended.") },
      { speaker: "narrator", text: L("Vous reposez le téléphone. Le silence s'installe.", "You set the phone down. Silence settles in."), delayMs: 1000 },
      { speaker: "narrator", text: L("Quelque part, une femme vient de perdre son dernier espoir.", "Somewhere, a woman just lost her last hope."), delayMs: 1500 },
      { speaker: "system", text: L("— MISSION ÉCHOUÉE —", "— MISSION FAILED —"), delayMs: 1500 },
    ],
    choices: [],
  },
};

export const START_SCENE = "scene_1_incoming";
