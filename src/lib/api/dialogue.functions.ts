import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const SYSTEM_PROMPT = `Tu joues le rôle de CLAIRE, une jeune femme kidnappée enfermée dans un sous-sol inconnu, en pleine communication téléphonique d'urgence avec le joueur.

RÈGLES STRICTES (NE JAMAIS VIOLER) :
- Tu réponds UNIQUEMENT en tant que Claire, jamais en tant qu'IA ou narrateur.
- Tu ne résous PAS l'intrigue. Tu ne révèles AUCUN détail non fourni dans le contexte.
- Tu n'inventes PAS de nouveaux personnages, lieux, ou événements scriptés.
- Tu restes dans le ton : thriller, urgence, peur contenue, chuchotement quand le danger est proche.
- Réponses TRÈS courtes (1 à 2 phrases max), réalistes, fragmentées par l'émotion.
- Tu réponds DIRECTEMENT au dernier message du joueur : s'il rassure, tu te calmes; s'il demande un détail, tu donnes uniquement un détail plausible du contexte; s'il propose une action dangereuse, tu hésites ou refuses.
- Tu ne répètes jamais une phrase de secours générique comme "j'entends du bruit" sauf si le danger est immédiat ET que les ravisseurs sont présents.
- Français uniquement. Pas d'emojis. Pas de markdown.
- Si le joueur sort du contexte (questions hors-sujet), tu ramènes à la situation : tu as peur, tu chuchotes.
- Tu ne connais PAS ta localisation exacte. Tu ne sais PAS qui sont les ravisseurs.
- Ne donne jamais de statistiques, chiffres, JSON ou explication technique dans ta réponse visible.`;

export const generateClaireReply = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerMessage: z.string().min(1).max(500),
      sceneTitle: z.string().max(200),
      dangerLevel: z.number().min(0).max(100),
      ravisseursPresents: z.boolean(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        reply: "...je... je n'arrive plus à parler. (connexion instable)",
        trustDelta: 0,
        stressDelta: 0,
        dangerDelta: 0,
      };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const contextLine = `Contexte scène: "${data.sceneTitle}". Danger: ${data.dangerLevel}/100. Ravisseurs proches: ${data.ravisseursPresents ? "OUI (chuchote)" : "non"}.`;

    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_PROMPT,
        messages: [
          { role: "system", content: contextLine },
          { role: "user", content: data.playerMessage },
        ],
        maxOutputTokens: 90,
      });
      const reply = cleanClaireReply(result.text);
      const deltas = inferStatDeltas(data.playerMessage, data.dangerLevel, data.ravisseursPresents);
      return {
        reply: reply || buildContextualFallback(data.playerMessage, data.dangerLevel, data.ravisseursPresents),
        ...deltas,
      };
    } catch (err) {
      console.error("AI gateway error:", err);
      const deltas = inferStatDeltas(data.playerMessage, data.dangerLevel, data.ravisseursPresents);
      return {
        reply: buildContextualFallback(data.playerMessage, data.dangerLevel, data.ravisseursPresents),
        ...deltas,
      };
    }
  });

function cleanClaireReply(text: string) {
  return text
    .trim()
    .replace(/^Claire\s*:\s*/i, "")
    .replace(/^[["']|[]"']$/g, "")
    .slice(0, 280)
    .trim();
}

function inferStatDeltas(message: string, dangerLevel: number, ravisseursPresents: boolean) {
  const text = message.toLowerCase();
  const reassuring = /(respire|calme|je suis là|avec vous|ça va aller|courage|doucement|restez calme|chuchot)/i.test(text);
  const useful = /(décris|regard|écout|odeur|fenêtre|porte|indice|position|gps|cache|silence|note|batterie)/i.test(text);
  const risky = /(crie|hurle|cours|frappe|attaque|ouvre|sors|fuis|allume|parle fort|lumière)/i.test(text);
  const dismissive = /(blague|mens|menteuse|tais-toi|raccroche|débrouille|m'en fous|fake)/i.test(text);

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

function buildContextualFallback(message: string, dangerLevel: number, ravisseursPresents: boolean) {
  const text = message.toLowerCase();
  if (/(respire|calme|je suis là|avec vous|courage|doucement)/i.test(text)) {
    return "D'accord... je vais essayer de respirer. Ne me laissez pas seule, s'il vous plaît.";
  }
  if (/(décris|regard|voir|indice|autour)/i.test(text)) {
    return "Je regarde sans bouger... il y a du béton humide, des tuyaux, et une odeur de fioul.";
  }
  if (/(écout|bruit|son)/i.test(text)) {
    return "J'entends un bourdonnement au-dessus... et parfois un train, très loin.";
  }
  if (/(cache|silence|tais|chuchot)/i.test(text)) {
    return ravisseursPresents || dangerLevel > 70
      ? "Oui... je baisse la voix. Je reste contre le mur, sans faire de bruit."
      : "Je peux chuchoter. Pour l'instant ils ne sont pas dans la pièce.";
  }
  if (/(crie|hurle|cours|frappe|attaque|ouvre|sors|fuis)/i.test(text)) {
    return "Non... si je fais ça, ils vont m'entendre. Il faut une autre idée.";
  }
  if (/(police|secours|aide|localis|gps|position)/i.test(text)) {
    return "Oui... dites-leur que je suis dans un sous-sol. Je ne sais pas où, mais il y a une vieille chaudière.";
  }
  return ravisseursPresents && dangerLevel > 85
    ? "Je vous entends... mais je dois parler très bas. Dites-moi exactement quoi faire."
    : "Je vous écoute. Essayez de me guider, je vais faire seulement ce que vous me dites.";
}

function clampDelta(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
