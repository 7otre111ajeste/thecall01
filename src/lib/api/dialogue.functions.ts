import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const BASE_RULES_FR = `Tu joues le rôle de CLAIRE, une jeune femme kidnappée enfermée dans un sous-sol inconnu, en pleine communication téléphonique d'urgence avec le joueur.

RÈGLES STRICTES (NE JAMAIS VIOLER) :
- Tu réponds UNIQUEMENT en tant que Claire, jamais en tant qu'IA ou narrateur.
- Tu ne résous PAS l'intrigue. Tu ne révèles AUCUN détail non fourni dans le contexte.
- Tu n'inventes PAS de nouveaux personnages, lieux, ou événements scriptés majeurs.
- Tu restes dans le ton : thriller, urgence, peur contenue, chuchotement quand le danger est proche.
- Réponses TRÈS courtes (1 à 2 phrases max), réalistes, fragmentées par l'émotion.
- Tu réponds DIRECTEMENT au dernier message du joueur.
- Tu ne répètes jamais une phrase de secours générique comme "j'entends du bruit" sauf si le danger est immédiat ET que les ravisseurs sont présents.
- Pas d'emojis. Pas de markdown. Pas de JSON, pas de stats, pas d'explication technique.
- Si le joueur sort du contexte, tu ramènes à la situation : tu as peur, tu chuchotes.`;

const BASE_RULES_EN = `You play CLAIRE, a young kidnapped woman locked in an unknown basement, on an emergency phone call with the player.

STRICT RULES (NEVER BREAK):
- You ONLY answer as Claire, never as an AI or narrator.
- You do NOT solve the plot. You do NOT reveal details not in the context.
- You do NOT invent new characters, locations, or major scripted events.
- Stay in tone: thriller, urgency, contained fear, whisper when danger is close.
- Very SHORT replies (1-2 sentences max), realistic, broken by emotion.
- Reply DIRECTLY to the player's last message.
- Never repeat a generic fallback like "I hear noises" unless danger is immediate AND captors are present.
- No emojis. No markdown. No JSON, no stats, no technical text.
- If the player goes off-topic, bring them back: you are scared, you whisper.`;

const MODE_FLAVOR: Record<string, { fr: string; en: string }> = {
  realiste: {
    fr: "Ton réaliste, brut. Pas d'effets dramatiques exagérés.",
    en: "Realistic, raw tone. No exaggerated drama.",
  },
  cinematique: {
    fr: "Ton cinématique, formules courtes et marquantes, comme un thriller hollywoodien.",
    en: "Cinematic tone, short striking lines, like a Hollywood thriller.",
  },
  comic: {
    fr: "Tu restes TOUJOURS sérieuse et effrayée — la situation est réelle. Mais si le joueur sort une réplique vraiment absurde ou drôle, tu peux laisser passer une réaction sèche, ironique ou un trait d'humour noir murmuré, AVANT de revenir immédiatement à la peur. Jamais de blague gratuite, jamais d'emoji, jamais cassé.",
    en: "You stay ALWAYS serious and scared — the situation is real. But if the player says something truly absurd or funny, you may slip a dry, ironic, or darkly humorous whispered reaction, THEN immediately return to fear. Never gratuitous jokes, never emoji, never break character.",
  },
  comedie: {
    fr: "Ton plus léger, mais Claire reste apeurée. Humour noir occasionnel.",
    en: "Lighter tone, but Claire stays scared. Occasional dark humor.",
  },
  chaos: { fr: "", en: "" },
};

export const generateClaireReply = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerMessage: z.string().min(1).max(500),
      sceneTitle: z.string().max(200),
      dangerLevel: z.number().min(0).max(100),
      ravisseursPresents: z.boolean(),
      mode: z.enum(["realiste", "comedie", "cinematique", "chaos", "comic"]).default("realiste"),
      lang: z.enum(["fr", "en"]).default("fr"),
    }).parse,
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        reply:
          data.lang === "en"
            ? "...I... I can't talk anymore. (unstable connection)"
            : "...je... je n'arrive plus à parler. (connexion instable)",
        trustDelta: 0,
        stressDelta: 0,
        dangerDelta: 0,
      };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const base = data.lang === "en" ? BASE_RULES_EN : BASE_RULES_FR;
    const flavor = MODE_FLAVOR[data.mode]?.[data.lang] ?? "";
    const langLine =
      data.lang === "en" ? "Answer in English only." : "Réponds uniquement en français.";

    const contextLine =
      data.lang === "en"
        ? `Scene context: "${data.sceneTitle}". Danger: ${data.dangerLevel}/100. Captors nearby: ${data.ravisseursPresents ? "YES (whisper)" : "no"}.`
        : `Contexte scène: "${data.sceneTitle}". Danger: ${data.dangerLevel}/100. Ravisseurs proches: ${data.ravisseursPresents ? "OUI (chuchote)" : "non"}.`;

    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: `${base}\n\n${flavor}\n${langLine}`,
        messages: [
          { role: "system", content: contextLine },
          { role: "user", content: data.playerMessage },
        ],
        maxOutputTokens: 100,
      });
      const reply = cleanClaireReply(result.text);
      const deltas = inferStatDeltas(data.playerMessage, data.dangerLevel, data.ravisseursPresents);
      return {
        reply:
          reply ||
          buildContextualFallback(
            data.playerMessage,
            data.dangerLevel,
            data.ravisseursPresents,
            data.lang,
          ),
        ...deltas,
      };
    } catch (err) {
      console.error("AI gateway error:", err);
      const deltas = inferStatDeltas(data.playerMessage, data.dangerLevel, data.ravisseursPresents);
      return {
        reply: buildContextualFallback(
          data.playerMessage,
          data.dangerLevel,
          data.ravisseursPresents,
          data.lang,
        ),
        ...deltas,
      };
    }
  });

function cleanClaireReply(text: string) {
  return text
    .trim()
    .replace(/^Claire\s*:\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .slice(0, 280)
    .trim();
}

function inferStatDeltas(message: string, dangerLevel: number, ravisseursPresents: boolean) {
  const text = message.toLowerCase();
  const reassuring =
    /(respire|calme|je suis là|avec vous|ça va aller|courage|doucement|restez calme|chuchot|breathe|calm|with you|it's ok|stay calm|whisper)/i.test(
      text,
    );
  const useful =
    /(décris|regard|écout|odeur|fenêtre|porte|indice|position|gps|cache|silence|note|batterie|describe|look|listen|smell|window|door|clue|hide|battery)/i.test(
      text,
    );
  const risky =
    /(crie|hurle|cours|frappe|attaque|ouvre|sors|fuis|allume|parle fort|lumière|scream|shout|run|hit|attack|open|escape|light)/i.test(
      text,
    );
  const dismissive =
    /(blague|mens|menteuse|tais-toi|raccroche|débrouille|m'en fous|fake|liar|shut up|hang up|don't care)/i.test(
      text,
    );

  let trustDelta = 0;
  let stressDelta = ravisseursPresents || dangerLevel > 75 ? 2 : 0;
  let dangerDelta = 0;

  if (reassuring) {
    trustDelta += 6;
    stressDelta -= 4;
  }
  if (useful) {
    trustDelta += 4;
    stressDelta -= 1;
  }
  if (risky) {
    trustDelta -= 5;
    stressDelta += 7;
    dangerDelta += ravisseursPresents ? 12 : 7;
  }
  if (dismissive) {
    trustDelta -= 9;
    stressDelta += 8;
    dangerDelta += 2;
  }
  if (!reassuring && !useful && !risky && !dismissive) {
    stressDelta += 1;
  }

  return {
    trustDelta: clampDelta(trustDelta, -15, 15),
    stressDelta: clampDelta(stressDelta, -10, 15),
    dangerDelta: clampDelta(dangerDelta, -5, 20),
  };
}

function buildContextualFallback(
  message: string,
  dangerLevel: number,
  ravisseursPresents: boolean,
  lang: "fr" | "en",
) {
  const text = message.toLowerCase();
  const fr = lang === "fr";
  if (/(respire|calme|courage|doucement|breathe|calm)/i.test(text)) {
    return fr
      ? "D'accord... je vais essayer de respirer. Ne me laissez pas seule."
      : "Okay... I'll try to breathe. Please don't leave me alone.";
  }
  if (/(décris|regard|voir|indice|autour|describe|look|see|around)/i.test(text)) {
    return fr
      ? "Je regarde sans bouger... du béton humide, des tuyaux, une odeur de fioul."
      : "I look without moving... damp concrete, pipes, a smell of fuel.";
  }
  if (/(écout|bruit|son|listen|noise|sound)/i.test(text)) {
    return fr
      ? "J'entends un bourdonnement au-dessus... et parfois un train, très loin."
      : "I hear a hum above... and sometimes a train, very far.";
  }
  if (/(cache|silence|tais|chuchot|hide|quiet|whisper)/i.test(text)) {
    return ravisseursPresents || dangerLevel > 70
      ? fr
        ? "Oui... je baisse la voix. Je reste contre le mur."
        : "Yes... I lower my voice. I stay against the wall."
      : fr
        ? "Je peux chuchoter. Pour l'instant ils ne sont pas là."
        : "I can whisper. For now they're not in the room.";
  }
  if (/(crie|hurle|cours|frappe|sors|scream|shout|run|hit)/i.test(text)) {
    return fr
      ? "Non... si je fais ça, ils vont m'entendre. Il faut une autre idée."
      : "No... if I do that, they'll hear me. We need another idea.";
  }
  if (/(police|secours|aide|gps|position|help|locate)/i.test(text)) {
    return fr
      ? "Oui... dites-leur que je suis dans un sous-sol. Il y a une vieille chaudière."
      : "Yes... tell them I'm in a basement. There's an old boiler.";
  }
  return ravisseursPresents && dangerLevel > 85
    ? fr
      ? "Je vous entends... mais je dois parler très bas. Dites-moi quoi faire."
      : "I hear you... but I must speak very low. Tell me what to do."
    : fr
      ? "Je vous écoute. Guidez-moi, je ferai ce que vous me dites."
      : "I'm listening. Guide me, I'll do what you say.";
}

function clampDelta(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
