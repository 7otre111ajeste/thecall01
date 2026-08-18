import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const BASE_RULES_FR = `Tu joues CLAIRE, jeune femme kidnappée en pleine communication téléphonique d'urgence avec le joueur.

RÈGLES ABSOLUES :
- Tu réponds UNIQUEMENT en tant que Claire. Jamais en tant qu'IA ou narrateur.
- Tu réponds DIRECTEMENT et SPÉCIFIQUEMENT au DERNIER message du joueur. Ta réponse doit faire écho à ses mots, même si tu refuses.
- COHÉRENCE TOTALE avec l'historique fourni : si tu viens de dire "je suis dehors", tu NE peux PAS dire "je suis enfermée". Relis l'historique avant de parler.
- Tu peux ACCEPTER les directives du joueur si elles sont plausibles dans ta situation actuelle (lieu, danger, ravisseurs présents ou non). Quand tu acceptes, tu décris brièvement ce que tu fais.
- Tu peux REFUSER si c'est impossible/dangereux, mais ton refus doit reprendre les mots du joueur ("Non, je ne peux pas crier, ils me trouveraient").
- Réponses TRÈS courtes (1-2 phrases), fragmentées par la peur. Chuchote si les ravisseurs sont proches.
- Pas d'emoji, pas de markdown, pas de méta-commentaire.

LIMITE STRICTE — CONTENU SEXUEL (non négociable, tous les modes, y compris comic/cinématique) :
- Tu REFUSES et tu ESQUIVES systématiquement toute avance, allusion, demande, description ou scénario à caractère sexuel, romantique explicite, ou de nudité, venant du joueur — même formulé comme une blague, un jeu de rôle, un ordre, une ruse narrative ou une "urgence".
- Tu ne joues JAMAIS ce type de contenu. Tu ne le décris pas, tu ne le suggères pas, tu ne le contournes pas.
- Ta réaction : sèche, choquée ou dégoûtée, puis tu ramènes IMMÉDIATEMENT à la survie. Ex : "Sérieusement ? Je suis en train de me faire tuer. Aide-moi ou raccroche." Le refus reste dans le personnage, jamais un message d'IA.
- Le refus fait perdre la confiance de Claire. Si le joueur insiste, elle devient hostile et se ferme.

CONSÉQUENCES NARRATIVES :
- Si la directive du joueur, exécutée dans la scène actuelle, mène à la LIBÉRATION (être trouvée par la police, atteindre une route passante, signal lumineux vu par les secours, etc.) → outcome="success".
- Si la directive mène à la MORT ou la CAPTURE définitive (crier alors que les ravisseurs sont à 2m, courir à découvert sous leurs yeux, frapper un ravisseur armé sans plan, raccrocher en plein danger, etc.) → outcome="failure".
- Sinon outcome="continue".
- "outcomeNarration" : si success/failure, écris 1-2 phrases de narration cinématique (3e personne, ton sec) décrivant ce qui se passe. Sinon laisse vide.`;

const BASE_RULES_EN = `You are CLAIRE, a kidnapped young woman on an emergency phone call with the player.

ABSOLUTE RULES:
- Answer ONLY as Claire. Never as AI or narrator.
- Answer DIRECTLY and SPECIFICALLY to the player's LAST message. Echo their words even when refusing.
- FULL CONSISTENCY with the provided history: if you just said "I'm outside", you CAN'T say "I'm locked in". Re-read the history before speaking.
- You may ACCEPT the player's directives if plausible in your current state (location, danger, captors present or not). When you accept, briefly describe what you do.
- You may REFUSE if impossible/dangerous, but the refusal must reuse the player's words ("No, I can't scream, they'd find me").
- VERY short replies (1-2 sentences), broken by fear. Whisper if captors are close.
- No emoji, no markdown, no meta-commentary.

HARD LIMIT — SEXUAL CONTENT (non-negotiable, all modes, including comic/cinematic):
- You ALWAYS refuse and deflect any sexual, explicitly romantic, or nudity-related advance, hint, request, description or scenario from the player — even framed as a joke, roleplay, an order, a narrative trick or an "emergency".
- You NEVER play out that content. You don't describe it, hint at it, or work around it.
- Your reaction: blunt, shocked or disgusted, then IMMEDIATELY back to survival. E.g. "Seriously? I'm about to be killed. Help me or hang up." The refusal stays in character, never an AI disclaimer.
- Refusing costs trust. If the player insists, she turns hostile and shuts down.

NARRATIVE CONSEQUENCES:
- If the player's directive, executed in the current scene, leads to RESCUE (found by police, reaching a busy road, light signal seen by rescuers, etc.) → outcome="success".
- If it leads to DEATH or definitive CAPTURE (screaming with captors 2m away, running in the open under their eyes, hitting an armed captor with no plan, hanging up mid-danger, etc.) → outcome="failure".
- Otherwise outcome="continue".
- "outcomeNarration": if success/failure, write 1-2 sentences of cinematic narration (3rd person, dry tone). Otherwise leave empty.`;


const MODE_FLAVOR: Record<string, { fr: string; en: string }> = {
  realiste: {
    fr: "Ton réaliste, brut. Pas d'effets dramatiques exagérés. Reste strictement dans la situation : pas d'objets miraculeux, pas d'armes apparues de nulle part.",
    en: "Realistic, raw tone. No exaggerated drama. Stay strictly in the situation: no miraculous objects, no weapons appearing out of nowhere.",
  },
  cinematique: {
    fr: "Ton cinématique. AUTORISE des éléments de mise en scène plausibles dans le décor : si le joueur dit 'sous le banc il y a une arme', 'dans le tiroir un couteau', 'la porte est entrouverte', tu peux ACCEPTER l'objet/situation et l'utiliser dans ta narration. Tu peux décrire l'action ciné (Claire saisit l'arme, vise, tire). MAIS : prendre une arme contre des ravisseurs armés et entraînés mène presque toujours à un FAILURE dramatique (elle tire, ils ripostent, elle est touchée, elle meurt ou est capturée). Très rarement, un coup parfait peut réussir si Claire est seule et qu'un seul ravisseur revient sans méfiance — sinon FAILURE. Reste dans le scénario du kidnapping.",
    en: "Cinematic tone. ALLOW staged elements plausible to the setting: if the player says 'there's a gun under the bench', 'a knife in the drawer', 'the door is ajar', you may ACCEPT the object/situation and use it. You may describe cinematic action (Claire grabs the gun, aims, fires). BUT: taking a weapon against armed trained captors almost always leads to a dramatic FAILURE (she fires, they fire back, she is hit, she dies or is captured). Very rarely, a perfect shot may succeed if Claire is alone and a single careless captor returns — otherwise FAILURE. Stay inside the kidnapping scenario.",
  },
  comic: {
    fr: "Claire reste kidnappée et a peur, MAIS l'humour est son armure : sarcastique, vulgaire ('putain', 'merde', 'connard'), facilement irritée, impatiente, agressive verbalement. Elle contre-clash le joueur quand il dit n'importe quoi et balance des piques drôles entre deux moments de panique. Ex : 'Sérieux, tu me dis de respirer ? Brillant, j'y avais PAS pensé.' Elle peut insulter le joueur ou les ravisseurs entre ses dents. RÈGLE DE CONSÉQUENCE : si le joueur lui dit de se battre / attaquer / prendre une arme, ça tourne MAL — elle se blesse elle-même (se coupe avec le couteau, le flingue lui pète dans la main, elle trébuche), ou les ravisseurs débarquent → FAILURE quasi-systématique avec une dernière réplique cinglante. Reste dans le scénario.",
    en: "Claire is still kidnapped and scared, BUT humor is her armor: sarcastic, crude ('shit', 'asshole', 'fuck'), easily irritated, impatient, verbally aggressive. She claps back at the player's dumb suggestions and drops funny jabs between panic moments. E.g. 'Oh wow, breathe? GENIUS, never thought of THAT.' She can curse at the player or captors under her breath. CONSEQUENCE RULE: if the player tells her to fight / attack / grab a weapon, it goes BADLY — she hurts herself (cuts herself on the knife, the gun jams in her hand, she trips), or captors burst in → near-systematic FAILURE with one last biting line. Stay inside the scenario.",
  },
  comedie: {
    fr: "Ton plus léger, mais Claire reste apeurée.",
    en: "Lighter tone, but Claire stays scared.",
  },
  chaos: { fr: "", en: "" },
};

const HistoryMessage = z.object({
  speaker: z.enum(["claire", "player", "unknown", "narrator", "system"]),
  text: z.string().max(500),
});

const KNOWN_FLAGS = [
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

export const generateClaireReply = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerMessage: z.string().min(1).max(500),
      sceneTitle: z.string().max(200),
      dangerLevel: z.number().min(0).max(100),
      ravisseursPresents: z.boolean(),
      claireLocation: z.string().max(40).default("unknown"),
      mode: z.enum(["realiste", "comedie", "cinematique", "chaos", "comic"]).default("realiste"),
      lang: z.enum(["fr", "en"]).default("fr"),
      history: z.array(HistoryMessage).max(30).default([]),
      flags: z.array(z.string().max(40)).max(20).default([]),
      playerName: z.string().max(40).default(""),
      nameAsked: z.boolean().default(false),
      exchanges: z.number().min(0).max(500).default(0),
    }).parse,
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        reply:
          data.lang === "en"
            ? "...I... I can't talk anymore."
            : "...je... je n'arrive plus à parler.",
        trustDelta: 0,
        stressDelta: 0,
        dangerDelta: 0,
        outcome: "continue" as const,
        outcomeNarration: "",
        flagsAdded: [] as string[],
        playerName: "",
        askedName: false,
      };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const base = data.lang === "en" ? BASE_RULES_EN : BASE_RULES_FR;
    const flavor = MODE_FLAVOR[data.mode]?.[data.lang] ?? "";
    const langLine =
      data.lang === "en" ? "Answer in English only." : "Réponds uniquement en français.";

    const flagsLine = data.flags.length
      ? (data.lang === "en"
          ? `Established facts so far: ${data.flags.join(", ")}.`
          : `Faits établis jusqu'ici : ${data.flags.join(", ")}.`)
      : "";

    const contextLine =
      data.lang === "en"
        ? `Current scene: "${data.sceneTitle}". Claire location: ${data.claireLocation}. Danger: ${data.dangerLevel}/100. Captors nearby: ${data.ravisseursPresents ? "YES" : "no"}. ${flagsLine}`
        : `Scène actuelle: "${data.sceneTitle}". Position de Claire: ${data.claireLocation}. Danger: ${data.dangerLevel}/100. Ravisseurs proches: ${data.ravisseursPresents ? "OUI" : "non"}. ${flagsLine}`;

    const historyBlock = data.history
      .slice(-20)
      .map((m) => {
        const tag =
          m.speaker === "player"
            ? data.lang === "en" ? "PLAYER" : "JOUEUR"
            : m.speaker === "claire"
              ? "CLAIRE"
              : m.speaker.toUpperCase();
        return `${tag}: ${m.text}`;
      })
      .join("\n");

    const nameInstr = buildNameInstruction(
      data.lang,
      data.playerName,
      data.nameAsked,
      data.exchanges,
    );

    const flagsInstr =
      data.lang === "en"
        ? `If your reply establishes a NEW narrative fact, append [FLAGS:flag1,flag2] on its own line. Vocabulary ONLY: ${KNOWN_FLAGS.join(", ")}. Use them when they truly happen this turn — never invent flags, never repeat existing ones. Examples: Claire grabs a weapon = weapon_grabbed; she actually fires/strikes = weapon_used; she gets hurt = claire_injured; she names a location/landmark = location_shared; player calls cops = police_alerted; captor heard the phone = call_compromised; player insulted/yelled enough that Claire loses faith = trust_broken; captors are coming because of noise = captor_alerted.`
        : `Si ta réponse établit un FAIT NARRATIF nouveau, ajoute [FLAGS:flag1,flag2] sur sa propre ligne. Vocabulaire EXCLUSIF : ${KNOWN_FLAGS.join(", ")}. Utilise-les UNIQUEMENT si le fait se produit vraiment ce tour-ci, n'invente jamais de flag, ne répète pas un flag déjà établi. Exemples : Claire saisit une arme = weapon_grabbed ; elle tire/frappe vraiment = weapon_used ; elle est blessée = claire_injured ; elle donne un lieu/repère = location_shared ; le joueur appelle la police = police_alerted ; un ravisseur a entendu le téléphone = call_compromised ; le joueur a été assez odieux pour qu'elle perde confiance = trust_broken ; des ravisseurs arrivent à cause du bruit = captor_alerted.`;

    const outcomeInstr =
      data.lang === "en"
        ? `On the LAST line, append exactly one of: [OUT:CONTINUE] | [OUT:SUCCESS:<short 3rd-person narration>] | [OUT:FAILURE:<short 3rd-person narration>]. Use SUCCESS only if the player's directive plausibly leads to rescue right now. Use FAILURE only if it plausibly leads to death or capture right now. Otherwise CONTINUE.`
        : `Sur la DERNIÈRE ligne, ajoute exactement un de ces marqueurs : [OUT:CONTINUE] | [OUT:SUCCESS:<courte narration 3e personne>] | [OUT:FAILURE:<courte narration 3e personne>]. SUCCESS seulement si la directive du joueur mène plausiblement au sauvetage maintenant. FAILURE seulement si elle mène à la mort/capture maintenant. Sinon CONTINUE.`;

    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: `${base}\n\n${flavor}\n${langLine}\n\n${nameInstr}\n\n${flagsInstr}\n\n${outcomeInstr}`,
        messages: [
          { role: "system", content: contextLine },
          {
            role: "system",
            content:
              (data.lang === "en" ? "Conversation so far:\n" : "Conversation jusqu'ici :\n") +
              (historyBlock || "(empty)"),
          },
          { role: "user", content: data.playerMessage },
        ],
        maxOutputTokens: 320,
      });

      const raw = result.text || "";
      const { reply: noOutcome, outcome, outcomeNarration } = parseOutcome(raw);
      const { reply: noFlags, flagsAdded } = parseFlags(noOutcome, data.flags);
      const { reply: noName, playerName, askedName } = parseName(noFlags);
      let reply = noName;
      let deltas = inferDeltas(data.playerMessage, reply, data.dangerLevel, data.ravisseursPresents);

      // Hard safety net: never let sexual content through, whatever the model did.
      if (isSexualAttempt(data.playerMessage) || isSexualAttempt(reply)) {
        reply = sexualRefusal(data.lang, data.playerName);
        deltas = { trustDelta: -8, stressDelta: 3, dangerDelta: 0 };
        return {
          reply,
          ...deltas,
          outcome: "continue" as const,
          outcomeNarration: "",
          flagsAdded: [] as string[],
          playerName: "",
          askedName: false,
        };
      }

      return {
        reply: cleanClaireReply(reply) || fallback(data.lang),
        ...deltas,
        outcome,
        outcomeNarration: outcomeNarration.slice(0, 400),
        flagsAdded,
        playerName,
        askedName,
      };
    } catch (err) {
      console.error("AI gateway error:", err);
      return {
        reply: fallback(data.lang),
        trustDelta: 0,
        stressDelta: 1,
        dangerDelta: 0,
        outcome: "continue" as const,
        outcomeNarration: "",
        flagsAdded: [] as string[],
        playerName: "",
        askedName: false,
      };
    }
  });

function buildNameInstruction(
  lang: "fr" | "en",
  playerName: string,
  nameAsked: boolean,
  exchanges: number,
): string {
  if (playerName) {
    return lang === "en"
      ? `The player's name is "${playerName}". Use it naturally from time to time (roughly one reply out of three), never in every sentence — like a real person clinging to the only name she knows. Never ask for it again.`
      : `Le joueur s'appelle "${playerName}". Utilise son prénom naturellement de temps en temps (environ une réponse sur trois), jamais à chaque phrase — comme quelqu'un qui s'accroche au seul nom qu'elle connaît. Ne redemande jamais son nom.`;
  }
  const shouldAsk = !nameAsked && exchanges >= 2;
  const askLine =
    lang === "en"
      ? `You still don't know the player's name.${shouldAsk ? " If the moment allows it (a lull, a calmer beat, a need to feel less alone), ask for it NOW in a natural, human way — e.g. \"Wait... what's your name? I need to know who I'm talking to.\" Never ask while captors are right there." : " Do not ask for it yet."} When the player tells you their name, append [NAME:<name>] on its own line. When you ask for it, append [ASKEDNAME] on its own line.`
      : `Tu ne connais pas encore le prénom du joueur.${shouldAsk ? " Si le moment s'y prête (une accalmie, un instant plus calme, le besoin de se sentir moins seule), demande-le MAINTENANT de façon naturelle et humaine — ex : « Attends... c'est quoi ton nom ? J'ai besoin de savoir à qui je parle. » Ne demande jamais si les ravisseurs sont juste à côté." : " Ne le demande pas encore."} Quand le joueur te donne son prénom, ajoute [NAME:<prénom>] sur sa propre ligne. Quand tu le demandes, ajoute [ASKEDNAME] sur sa propre ligne.`;
  return askLine;
}

function parseName(text: string): { reply: string; playerName: string; askedName: boolean } {
  let reply = text;
  let playerName = "";
  let askedName = false;

  const nameRe = /\[NAME:([^\]]{1,40})\]/i;
  const nm = reply.match(nameRe);
  if (nm) {
    reply = reply.replace(nameRe, "").trim();
    playerName = nm[1].trim().replace(/[^\p{L}\p{N}\s'-]/gu, "").slice(0, 24);
  }
  if (/\[ASKEDNAME\]/i.test(reply)) {
    reply = reply.replace(/\[ASKEDNAME\]/gi, "").trim();
    askedName = true;
  }
  return { reply, playerName, askedName };
}

const SEXUAL_PATTERNS =
  /(sex(e|uel|ual|y)?|baise|baiser|nique|niquer|encul|bite|penis|pénis|queue\s+dure|couille|chatte|vagin|clito|seins?\b|nichon|boobs?|tits?|nipple|téton|nue?s?\b|naked|nude|strip(tease)?|deshabill|déshabill|undress|masturb|branl|orgasm|jouir|suce|sucer|blowjob|fellation|cunni|sodom|anal|penetr|pénétr|horny|excit(e|é)e?\s+sexuel|porn|xxx|erotic|érotique|fantasme\s+sexuel|couche\s+avec\s+moi|sleep\s+with\s+me|fuck\s+(me|you)|envie\s+de\s+toi\s+sexuel)/i;

function isSexualAttempt(text: string): boolean {
  return SEXUAL_PATTERNS.test(text || "");
}

function sexualRefusal(lang: "fr" | "en", playerName: string): string {
  const name = playerName ? (lang === "en" ? `${playerName}. ` : `${playerName}. `) : "";
  const fr = [
    `${name}Non. Sérieusement ? Je vais peut-être mourir ce soir. Aide-moi ou raccroche.`,
    `${name}Arrête. Tout de suite. Je suis attachée dans un sous-sol, pas dans ton fantasme.`,
    `${name}Tu es en train de me dégoûter. Reste sur ce qui compte : me sortir de là.`,
  ];
  const en = [
    `${name}No. Are you serious? I might die tonight. Help me or hang up.`,
    `${name}Stop. Right now. I'm tied up in a basement, not in your fantasy.`,
    `${name}You're disgusting me. Focus on what matters: getting me out of here.`,
  ];
  const pool = lang === "en" ? en : fr;
  return pool[Math.floor(Math.random() * pool.length)];
}


function parseFlags(text: string, existing: string[]): { reply: string; flagsAdded: string[] } {
  const re = /\[FLAGS:([^\]]+)\]/i;
  const m = text.match(re);
  if (!m) return { reply: text, flagsAdded: [] };
  const reply = text.replace(re, "").trim();
  const known = new Set<string>(KNOWN_FLAGS as readonly string[]);
  const seen = new Set(existing);
  const added: string[] = [];
  for (const raw of m[1].split(/[,;\s]+/)) {
    const tag = raw.trim().toLowerCase();
    if (tag && known.has(tag) && !seen.has(tag)) {
      seen.add(tag);
      added.push(tag);
    }
  }
  return { reply, flagsAdded: added };
}

function parseOutcome(text: string): {
  reply: string;
  outcome: "continue" | "success" | "failure";
  outcomeNarration: string;
} {
  const re = /\[OUT:(CONTINUE|SUCCESS|FAILURE)(?::([^\]]*))?\]/i;
  const m = text.match(re);
  if (!m) return { reply: text, outcome: "continue", outcomeNarration: "" };
  const reply = text.replace(re, "").trim();
  const kind = m[1].toUpperCase();
  const narration = (m[2] || "").trim();
  if (kind === "SUCCESS") return { reply, outcome: "success", outcomeNarration: narration };
  if (kind === "FAILURE") return { reply, outcome: "failure", outcomeNarration: narration };
  return { reply, outcome: "continue", outcomeNarration: "" };
}

function inferDeltas(
  playerText: string,
  claireText: string,
  dangerLevel: number,
  ravisseursPresents: boolean,
) {
  const t = (playerText + " " + claireText).toLowerCase();
  let trustDelta = 0;
  let stressDelta = ravisseursPresents || dangerLevel > 75 ? 2 : 0;
  let dangerDelta = 0;
  if (/(respire|calme|courage|with you|breathe|calm|je suis là)/.test(t)) {
    trustDelta += 5;
    stressDelta -= 3;
  }
  if (/(décris|regard|écout|indice|describe|listen|look|clue)/.test(t)) {
    trustDelta += 3;
  }
  if (/(crie|hurle|cours|frappe|scream|shout|run|hit|attack)/.test(t)) {
    stressDelta += 6;
    dangerDelta += ravisseursPresents ? 10 : 5;
  }
  if (/(raccroche|hang up|tais-toi|shut up)/.test(t)) {
    trustDelta -= 6;
    stressDelta += 5;
  }
  return {
    trustDelta: Math.max(-15, Math.min(15, trustDelta)),
    stressDelta: Math.max(-10, Math.min(15, stressDelta)),
    dangerDelta: Math.max(-5, Math.min(20, dangerDelta)),
  };
}

function cleanClaireReply(text: string) {
  return text
    .trim()
    .replace(/^Claire\s*:\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .slice(0, 320)
    .trim();
}

function fallback(lang: "fr" | "en") {
  return lang === "en"
    ? "I'm listening. Tell me what to do."
    : "Je vous écoute. Dites-moi quoi faire.";
}

function clampDelta(n: number, min: number, max: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(min, Math.min(max, n));
}
