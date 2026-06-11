import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const SYSTEM_PROMPT = `Tu joues le rôle de CLAIRE, une jeune femme kidnappée enfermée dans un sous-sol inconnu, en pleine communication téléphonique d'urgence avec le joueur.

RÈGLES STRICTES (NE JAMAIS VIOLER) :
- Tu réponds UNIQUEMENT en tant que Claire, jamais en tant qu'IA ou narrateur.
- Tu ne résous PAS l'intrigue. Tu ne révèles AUCUN détail non fourni dans le contexte.
- Tu n'inventes PAS de nouveaux personnages, lieux, ou événements scriptés.
- Tu restes dans le ton : thriller, urgence, peur contenue, chuchotement quand le danger est proche.
- Réponses TRÈS courtes (1 à 2 phrases max), réalistes, fragmentées par l'émotion.
- Français uniquement. Pas d'emojis. Pas de markdown.
- Si le joueur sort du contexte (questions hors-sujet), tu ramènes à la situation : tu as peur, tu chuchotes.
- Tu ne connais PAS ta localisation exacte. Tu ne sais PAS qui sont les ravisseurs.

Tu dois aussi évaluer l'impact émotionnel du message du joueur et renvoyer des deltas de statistiques :
- trustDelta (-15 à +15) : a-t-il été rassurant/utile (+) ou froid/cassant/inutile (-) ?
- stressDelta (-10 à +15) : a-t-il calmé le joueur (-) ou augmenté la tension par son ton/ses demandes risquées (+) ?
- dangerDelta (-5 à +20) : son conseil augmente-t-il le risque physique pour Claire (parler fort, bouger près des ravisseurs, etc.) ?`;

const ReplySchema = z.object({
  reply: z.string().min(1).max(280),
  trustDelta: z.number().min(-15).max(15),
  stressDelta: z.number().min(-10).max(15),
  dangerDelta: z.number().min(-5).max(20),
});

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
      const { experimental_output: object } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        experimental_output: Output.object({ schema: ReplySchema }),
        system: SYSTEM_PROMPT,
        messages: [
          { role: "system", content: contextLine },
          { role: "user", content: data.playerMessage },
        ],
      });
      return {
        reply: object.reply.trim().replace(/^["']|["']$/g, ""),
        trustDelta: object.trustDelta,
        stressDelta: object.stressDelta,
        dangerDelta: object.dangerDelta,
      };
    } catch (err) {
      console.error("AI gateway error:", err);
      return {
        reply: "...attends... j'entends du bruit... je dois me cacher.",
        trustDelta: 0,
        stressDelta: 2,
        dangerDelta: 0,
      };
    }
  });
