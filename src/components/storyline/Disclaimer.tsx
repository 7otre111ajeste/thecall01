import { useState } from "react";

import { useLang } from "@/lib/i18n";
import type { StoryModule } from "@/lib/storyline/stories";

import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";

type L = { fr: string; en: string };
type Rule = { title: L; summary: L; details?: L };

function rules(story: StoryModule | null): Rule[] {
  return [
    {
      title: { fr: "Fiction", en: "Fiction" },
      summary: story
        ? { fr: story.warning, en: story.warningEn }
        : {
            fr: "Tout est inventé. Les histoires parlent parfois de danger et de peur : ce n'est pas pour tout le monde.",
            en: "Everything is made up. Stories sometimes deal with danger and fear: it's not for everyone.",
          },
      details: {
        fr: "Les personnages sont fictifs. Ce jeu n'est PAS un service d'urgence : en cas de vrai danger, appelle le 911.",
        en: "Characters are fictional. This game is NOT an emergency service: if you're in real danger, call 911.",
      },
    },
    {
      title: { fr: "IA", en: "AI" },
      summary: {
        fr: "Quand tu écris librement, c'est une IA qui répond. Elle peut se tromper ou surprendre.",
        en: "When you write freely, an AI answers. It can be wrong or surprising.",
      },
      details: {
        fr: "Ses réponses ne représentent pas l'opinion du créateur et ne sont jamais des conseils réels.",
        en: "Its replies don't represent the creator's opinion and are never real advice.",
      },
    },
    {
      title: { fr: "Interdit", en: "Forbidden" },
      summary: {
        fr: "Contenu sexuel, haine, harcèlement, demandes dangereuses ou illégales, détourner l'IA.",
        en: "Sexual content, hate, harassment, dangerous or illegal requests, hijacking the AI.",
      },
      details: {
        fr: "Ne partage jamais d'infos personnelles. En cas d'abus, l'accès à l'IA peut être limité.",
        en: "Never share personal info. In case of abuse, access to the AI may be limited.",
      },
    },
    {
      title: { fr: "Signaler", en: "Report" },
      summary: {
        fr: "Une réponse louche ? Appuie sur « ⚑ Signaler » juste en dessous.",
        en: "A weird reply? Tap “⚑ Report” right below it.",
      },
      details: {
        fr: "Le signalement est anonyme et examiné.",
        en: "Reports are anonymous and reviewed.",
      },
    },
    {
      title: { fr: "Temps de jeu", en: "Play time" },
      summary: {
        fr: "3 minutes gratuites par jour. Ensuite : 1 pub = +3 min · 2 pubs = +7 min · 3 pubs = +11 min.",
        en: "3 free minutes per day. Then: 1 ad = +3 min · 2 ads = +7 min · 3 ads = +11 min.",
      },
      details: {
        fr: "Le temps s'écoule seulement pendant que tu joues. Le temps gagné est perdu à la fermeture, sauf avec « 🔒 Garder mon temps » (1 pub).",
        en: "Time only runs while you play. Earned time is lost when you close the app, unless you use “🔒 Keep my time” (1 ad).",
      },
    },
    {
      title: { fr: "Tes données", en: "Your data" },
      summary: {
        fr: "Tes messages servent seulement à faire répondre les personnages. Pas liés à ton identité.",
        en: "Your messages are only used to make the characters reply. Not linked to your identity.",
      },
      details: {
        fr: "Services utilisés : IA et pubs Google AdMob. Tes sauvegardes et ton temps restent sur ton téléphone.",
        en: "Services used: AI and Google AdMob ads. Your saves and time stay on your phone.",
      },
    },
    {
      title: { fr: "Responsabilité", en: "Responsibility" },
      summary: {
        fr: "Le jeu est fourni « tel quel ». Tu es responsable de ce que tu écris.",
        en: "The game is provided “as is”. You are responsible for what you write.",
      },
    },
  ];
}

export function Disclaimer({
  story,
  accent,
  readOnly = false,
  onAccept,
  onBack,
}: {
  story: StoryModule | null;
  accent: string;
  readOnly?: boolean;
  onAccept?: () => void;
  onBack: () => void;
}) {
  const [lang] = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const [age, setAge] = useState(false);
  const [read, setRead] = useState(false);
  const tr = (l: L) => l[lang];
  const head = story ? story.title : "MY STORYLINE";

  return (
    <div
      className="storyline-themed relative flex min-h-screen flex-col items-center px-6 py-10 pt-16 text-white"
      style={{
        background: `radial-gradient(ellipse at top, ${accent}33, #050505 60%), radial-gradient(ellipse at bottom, ${accent}11, transparent)`,
      }}
    >
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: accent }}>
          {head} · {lang === "en" ? "Before you play" : "Avant de jouer"}
        </div>
        <h1 className="mb-2 text-center text-3xl font-bold tracking-wider sm:text-4xl">
          {lang === "en" ? "THE RULES" : "LES RÈGLES"}
        </h1>
        <p className="mb-8 text-center text-sm text-white/60">
          {lang === "en"
            ? "Read them once. They protect the story — and you."
            : "Lis-les une fois. Elles protègent l'histoire — et toi."}
        </p>

        <div className="flex flex-col gap-2">
          {rules(story).map((r, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-lg border border-white/10 py-3 pl-5 pr-4"
              style={{ background: `linear-gradient(180deg, ${accent}1f 0%, #0a0a0a 85%)` }}
            >
              <span aria-hidden className="absolute inset-y-0 left-0 w-[4px]" style={{ background: accent }} />
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10px]" style={{ color: accent }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold uppercase tracking-widest">{tr(r.title)}</span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-white/70">{tr(r.summary)}</p>
              {r.details && (
                <>
                  {open === i && <p className="mt-2 text-[12px] leading-snug text-white/50">{tr(r.details)}</p>}
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="mt-1 font-mono text-[10px] uppercase tracking-widest hover:opacity-80"
                    style={{ color: accent }}
                  >
                    {open === i ? (lang === "en" ? "Less −" : "Moins −") : lang === "en" ? "Details +" : "Détails +"}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {readOnly ? (
          <button
            onClick={onBack}
            className="mt-8 w-full rounded-md px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white"
            style={{ backgroundColor: accent }}
          >
            {lang === "en" ? "Close" : "Fermer"}
          </button>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {[
              { v: age, set: setAge, l: lang === "en" ? "I am 16 or older." : "J'ai 16 ans ou plus." },
              {
                v: read,
                set: setRead,
                l: lang === "en" ? "I have read and accept the rules and terms." : "J'ai lu et j'accepte les règles et conditions.",
              },
            ].map((c, i) => (
              <label key={i} className="flex cursor-pointer items-center gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={c.v}
                  onChange={(e) => c.set(e.target.checked)}
                  className="h-4 w-4"
                  style={{ accentColor: accent }}
                />
                {c.l}
              </label>
            ))}
            <button
              disabled={!age || !read}
              onClick={onAccept}
              className="mt-2 w-full rounded-md px-6 py-4 text-lg font-semibold uppercase tracking-widest text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: accent, boxShadow: age && read ? `0 0 30px ${accent}66` : "none" }}
            >
              {lang === "en" ? "I accept" : "J'accepte"}
            </button>
            <button
              onClick={onBack}
              className="w-full rounded-md px-6 py-3 text-xs uppercase tracking-widest text-white/50 hover:text-white"
            >
              {lang === "en" ? "← Back" : "← Retour"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
