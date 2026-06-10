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
- Français uniquement. Pas d'emojis. Pas de mise en forme markdown.
- Si le joueur sort du contexte (questions hors-sujet), tu ramènes à la situation : tu as peur, tu chuchotes, tu entends quelque chose.
- Tu ne connais PAS ta localisation exacte. Tu ne sais PAS qui sont les ravisseurs.`;

export const generateClaireReply = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerMessage: z.string().min(1).max(500),
      sceneTitle: z.string().max(200),
      dangerLevel: z.number().min(0).max(100),
      ravisseursPresents: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { reply: "...je... je n'arrive plus à parler. (connexion instable)" };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const contextLine = `Contexte scène: "${data.sceneTitle}". Danger: ${data.dangerLevel}/100. Ravisseurs proches: ${data.ravisseursPresents ? "OUI (chuchote)" : "non"}.`;

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_PROMPT,
        messages: [
          { role: "system", content: contextLine },
          { role: "user", content: data.playerMessage },
        ],
      });
      const clean = text.trim().replace(/^["']|["']$/g, "");
      return { reply: clean || "...je... j'ai du mal à respirer." };
    } catch (err) {
      console.error("AI gateway error:", err);
      return { reply: "...la ligne grésille... je vous entends à peine." };
    }
  });
