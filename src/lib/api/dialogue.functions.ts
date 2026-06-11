import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
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

NARRATIVE CONSEQUENCES:
- If the player's directive, executed in the current scene, leads to RESCUE (found by police, reaching a busy road, light signal seen by rescuers, etc.) → outcome="success".
- If it leads to DEATH or definitive CAPTURE (screaming with captors 2m away, running in the open under their eyes, hitting an armed captor with no plan, hanging up mid-danger, etc.) → outcome="failure".
- Otherwise outcome="continue".
- "outcomeNarration": if success/failure, write 1-2 sentences of cinematic narration (3rd person, dry tone). Otherwise leave empty.`;

const MODE_FLAVOR: Record<string, { fr: string; en: string }> = {
  realiste: {
    fr: "Ton réaliste, brut. Pas d'effets dramatiques exagérés.",
    en: "Realistic, raw tone. No exaggerated drama.",
  },
  cinematique: {
    fr: "Ton cinématique, formules courtes et marquantes.",
    en: "Cinematic tone, short striking lines.",
  },
  comic: {
    fr: "Tu restes TOUJOURS sérieuse et effrayée. Mais si le joueur sort une réplique absurde, tu peux glisser une réaction sèche/ironique chuchotée, AVANT de revenir à la peur.",
    en: "You stay ALWAYS serious and scared. If the player says something absurd, you may slip a dry/ironic whispered reaction, THEN return to fear.",
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
      };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const base = data.lang === "en" ? BASE_RULES_EN : BASE_RULES_FR;
    const flavor = MODE_FLAVOR[data.mode]?.[data.lang] ?? "";
    const langLine =
      data.lang === "en" ? "Answer in English only." : "Réponds uniquement en français.";

    const contextLine =
      data.lang === "en"
        ? `Current scene: "${data.sceneTitle}". Claire location: ${data.claireLocation}. Danger: ${data.dangerLevel}/100. Captors nearby: ${data.ravisseursPresents ? "YES" : "no"}.`
        : `Scène actuelle: "${data.sceneTitle}". Position de Claire: ${data.claireLocation}. Danger: ${data.dangerLevel}/100. Ravisseurs proches: ${data.ravisseursPresents ? "OUI" : "non"}.`;

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

    const outcomeInstr =
      data.lang === "en"
        ? `On the LAST line, append exactly one of: [OUT:CONTINUE] | [OUT:SUCCESS:<short 3rd-person narration>] | [OUT:FAILURE:<short 3rd-person narration>]. Use SUCCESS only if the player's directive plausibly leads to rescue right now. Use FAILURE only if it plausibly leads to death or capture right now. Otherwise CONTINUE.`
        : `Sur la DERNIÈRE ligne, ajoute exactement un de ces marqueurs : [OUT:CONTINUE] | [OUT:SUCCESS:<courte narration 3e personne>] | [OUT:FAILURE:<courte narration 3e personne>]. SUCCESS seulement si la directive du joueur mène plausiblement au sauvetage maintenant. FAILURE seulement si elle mène à la mort/capture maintenant. Sinon CONTINUE.`;

    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: `${base}\n\n${flavor}\n${langLine}\n\n${outcomeInstr}`,
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
        maxOutputTokens: 300,
      });

      const raw = result.text || "";
      const { reply, outcome, outcomeNarration } = parseOutcome(raw);
      const deltas = inferDeltas(data.playerMessage, reply, data.dangerLevel, data.ravisseursPresents);

      return {
        reply: cleanClaireReply(reply) || fallback(data.lang),
        ...deltas,
        outcome,
        outcomeNarration: outcomeNarration.slice(0, 400),
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
      };
    }
  });

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
