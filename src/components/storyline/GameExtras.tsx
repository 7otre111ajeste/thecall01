import { useState } from "react";

import { useLang } from "@/lib/i18n";
import {
  AD_STEP_SECONDS,
  addBonus,
  formatLeft,
  setKeep,
  totalLeft,
  usePlaytime,
  watchAd,
} from "@/lib/storyline/playtime";

export function PlaytimePill({ onClick }: { onClick: () => void }) {
  const p = usePlaytime();
  const left = totalLeft(p);
  const low = left < 60;
  return (
    <button
      onClick={onClick}
      className={`rounded border px-1.5 py-0.5 text-[10px] tabular-nums ${
        low ? "animate-pulse border-amber-400/60 text-amber-400" : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      ⏱ {formatLeft(left)}
      {p.keep ? " 🔒" : ""}
    </button>
  );
}

const OFFERS = [
  { ads: 1, min: 3, bonus: 0 },
  { ads: 2, min: 7, bonus: 1 },
  { ads: 3, min: 11, bonus: 2 },
];

export function TimeModal({
  forced,
  onClose,
  onQuit,
}: {
  forced: boolean;
  onClose: () => void;
  onQuit: () => void;
}) {
  const [lang] = useLang();
  const en = lang === "en";
  const p = usePlaytime();
  const [busy, setBusy] = useState<string | null>(null);

  const runPack = async (n: number) => {
    for (let i = 0; i < n; i++) {
      setBusy(en ? `Ad ${i + 1}/${n}…` : `Pub ${i + 1}/${n}…`);
      const ok = await watchAd();
      if (!ok) break;
      addBonus(AD_STEP_SECONDS[i]);
    }
    setBusy(null);
  };
  const runKeep = async () => {
    setBusy(en ? "Ad 1/1…" : "Pub 1/1…");
    if (await watchAd()) setKeep();
    setBusy(null);
  };

  const left = totalLeft(p);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => !forced && !busy && onClose()}
    >
      <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-5 text-center" onClick={(e) => e.stopPropagation()}>
        {forced && left === 0 ? (
          <>
            <p className="text-sm font-semibold text-foreground">⏱ {en ? "Time's up" : "Temps écoulé"}</p>
            <p className="mb-3 text-xs text-muted-foreground">
              {en
                ? "Claire is still on the line… Watch an ad to continue the call."
                : "Claire est toujours en ligne… Regarde une pub pour continuer l'appel."}
            </p>
          </>
        ) : (
          <p className="mb-1 text-sm font-semibold text-foreground">{en ? "More time" : "Plus de temps"}</p>
        )}
        <p className="text-4xl font-bold tabular-nums text-foreground">
          {formatLeft(left)}
          {p.keep ? " 🔒" : ""}
        </p>
        <p className="mb-4 mt-1 text-[11px] text-muted-foreground">
          {en ? "3 free minutes every day. · Test ads" : "3 minutes gratuites chaque jour. · Pubs de test"}
        </p>

        {busy ? (
          <p className="py-6 font-mono text-sm uppercase tracking-widest text-primary animate-pulse">🎬 {busy}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {OFFERS.map((o) => (
              <button
                key={o.ads}
                onClick={() => runPack(o.ads)}
                className="relative rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground hover:border-primary hover:bg-accent"
              >
                {o.ads === 3 && (
                  <span className="absolute -top-2 right-2 rounded bg-amber-400 px-1.5 text-[9px] font-semibold uppercase text-black">
                    ⭐ {en ? "Best deal" : "Meilleure offre"}
                  </span>
                )}
                {"🎬".repeat(o.ads)} {o.ads} {en ? (o.ads > 1 ? "ads" : "ad") : o.ads > 1 ? "pubs" : "pub"} = +{o.min} min
                {o.bonus > 0 && (
                  <span className="text-muted-foreground"> (+{o.bonus} min bonus)</span>
                )}
              </button>
            ))}
            {p.bonus > 0 && !p.keep && (
              <button
                onClick={runKeep}
                className="rounded-md border border-primary/60 bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20"
              >
                🔒 {en ? "Keep my time" : "Garder mon temps"} · 🎬
              </button>
            )}
            {forced && left === 0 ? (
              <button
                onClick={onQuit}
                className="mt-1 rounded-md px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:bg-accent"
              >
                {en ? "Quit the game" : "Quitter la partie"}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="mt-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {en ? "Keep playing" : "Continuer à jouer"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const REASONS = [
  { id: "offensive", fr: "Offensant / haineux", en: "Offensive / hateful" },
  { id: "sexual", fr: "Contenu sexuel", en: "Sexual content" },
  { id: "violent", fr: "Trop violent", en: "Too violent" },
  { id: "other", fr: "Autre", en: "Other" },
];

export function ReportModal({
  text,
  onClose,
  onSent,
}: {
  text: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [lang] = useLang();
  const en = lang === "en";
  const [sent, setSent] = useState(false);
  const send = (reason: string) => {
    console.log("[report]", { reason, text, at: new Date().toISOString() });
    setSent(true);
    onSent();
    setTimeout(onClose, 1400);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <p className="py-4 text-center text-sm text-foreground">
            {en ? "✓ Thanks, report sent." : "✓ Merci, signalement envoyé."}
          </p>
        ) : (
          <>
            <p className="mb-2 text-center text-sm font-semibold text-foreground">
              {en ? "Report this reply?" : "Signaler cette réponse ?"}
            </p>
            <blockquote className="mb-4 border-l-2 border-border pl-3 text-xs italic text-muted-foreground">
              « {text} »
            </blockquote>
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => send(r.id)}
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-left text-sm text-secondary-foreground hover:border-primary hover:bg-accent"
                >
                  {en ? r.en : r.fr}
                </button>
              ))}
              <button
                onClick={onClose}
                className="mt-1 rounded-md px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:bg-accent"
              >
                {en ? "Cancel" : "Annuler"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
