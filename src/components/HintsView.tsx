"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { playApi, type PlayerHint } from "@/lib/play-api";
import { playerStore, type Progress } from "@/lib/player-store";
import { t } from "@/lib/strings";
import { useSettings } from "./SettingsProvider";

// Platform page outside the fiction. Only shows hints for puzzles the player has reached.
export function HintsView({ slug, title }: { slug: string; title: string }) {
  const { settings, loaded } = useSettings();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [hints, setHints] = useState<PlayerHint[] | null>(null);
  const [showInBroadcast, setShowInBroadcast] = useState(false);

  useEffect(() => {
    playerStore().loadProgress(slug).then(setProgress);
  }, [slug]);

  const key = progress ? JSON.stringify([progress.proofs, progress.revealedHints]) : null;
  useEffect(() => {
    if (!key) return;
    const [proofs, revealed] = JSON.parse(key);
    let live = true;
    playApi.hints(slug, proofs, revealed).then((r) => live && setHints(r.hints));
    return () => {
      live = false;
    };
  }, [slug, key]);

  function reveal(id: string, tier: number) {
    if (!progress) return;
    const next = { ...progress, revealedHints: { ...progress.revealedHints, [id]: tier } };
    setProgress(next);
    void playerStore().saveProgress(slug, next);
  }

  const hidden = settings.broadcastMode && !showInBroadcast;
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <h1 className="text-2xl font-bold">{t.hints.title(title)}</h1>
      <p className="text-muted">{t.hints.intro}</p>
      <Link href={`/works/${slug}/play`} className="self-start underline">
        {t.hints.back}
      </Link>
      {!loaded || !hints ? (
        <p>{t.play.loading}</p>
      ) : hidden ? (
        <div className="rounded border border-line bg-card p-4">
          <p>{t.hints.broadcastHidden}</p>
          <button type="button" className="mt-2 underline" onClick={() => setShowInBroadcast(true)}>
            {t.hints.showAnyway}
          </button>
        </div>
      ) : hints.length === 0 ? (
        <p>{t.hints.none}</p>
      ) : (
        hints.map((h) => (
          <section key={h.id} className="rounded border border-line bg-card p-4" aria-labelledby={`h-${h.id}`} data-testid={`hint-${h.id}`}>
            <h2 id={`h-${h.id}`} className="font-bold">
              {h.title} {h.solved && <span className="ml-2 rounded bg-[#e3f1e6] px-2 text-sm text-[#14532d]">{t.hints.solved}</span>}
            </h2>
            <ol className="mt-2 flex flex-col gap-2">
              {h.tiers.map((text, i) => (
                <li key={i}>
                  <span className="text-sm font-semibold text-muted">{t.hints.tiers[i]}: </span>
                  {text}
                </li>
              ))}
            </ol>
            {h.tiers.length < 3 && (
              <button type="button" className="mt-3 rounded border border-line px-3 py-1 text-sm" onClick={() => reveal(h.id, h.tiers.length + 1)}>
                {t.hints.reveal(h.tiers.length + 1)}
              </button>
            )}
          </section>
        ))
      )}
    </main>
  );
}
