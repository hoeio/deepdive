"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Work } from "@/content/schema";
import { playerStore } from "@/lib/player-store";
import { t } from "@/lib/strings";
import { presentWarnings } from "@/lib/warnings";
import { BroadcastBadge } from "./Badges";
import { useSettings } from "./SettingsProvider";
import { WarningList } from "./WarningList";

export function ConsentScreen({ slug, title, warnings, broadcast }: { slug: string; title: string; warnings: Work["warnings"]; broadcast: Work["broadcast"] }) {
  const router = useRouter();
  const { settings, loaded, update } = useSettings();
  const [remembered, setRemembered] = useState<boolean | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const present = presentWarnings(warnings);

  useEffect(() => {
    playerStore()
      .getConsent(slug)
      .then((c) => {
        setRemembered(!!c);
        setConfirmed(!!c);
      });
  }, [slug]);

  // Remembered consent skips this screen, except in Broadcast Mode where the summary must appear on stream.
  useEffect(() => {
    if (loaded && remembered && !settings.broadcastMode) router.replace(`/works/${slug}/play`);
  }, [loaded, remembered, settings.broadcastMode, router, slug]);

  async function enter() {
    await playerStore().setConsent(slug, { accepted: true, at: new Date().toISOString() });
    router.push(`/works/${slug}/play`);
  }

  if (!loaded || remembered === null) return <p className="p-8">{t.play.loading}</p>;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
      <h1 className="text-2xl font-bold">{t.consent.title(title)}</h1>
      {settings.broadcastMode && (
        <section aria-labelledby="stream-summary" className="rounded-lg border-4 border-[#7a1f1f] bg-card p-4" data-testid="stream-summary">
          <h2 id="stream-summary" className="mb-2 text-xl font-bold">
            {t.consent.streamSummary}
          </h2>
          <p className="text-lg">
            {present.length ? present.map((w) => `${t.warning[w.category].label}: ${t.intensity[w.intensity]}`).join(" · ") : t.consent.none}
          </p>
          <div className="mt-2">
            <BroadcastBadge permission={broadcast.permission} long />
          </div>
        </section>
      )}
      <p>{present.length ? t.consent.intro : t.consent.none}</p>
      <WarningList warnings={warnings} />
      <div className="flex items-center gap-2">
        <span className="text-sm">{t.detail.broadcastTitle}:</span>
        <BroadcastBadge permission={broadcast.permission} long />
      </div>
      {remembered && <p className="text-sm text-muted">{t.consent.remembered}</p>}
      <label className="flex items-start gap-2">
        <input type="checkbox" className="mt-1 h-4 w-4" checked={settings.reducedMode} onChange={(e) => update({ reducedMode: e.target.checked })} />
        <span>{t.consent.reduced}</span>
      </label>
      <label className="flex items-start gap-2 font-semibold">
        <input type="checkbox" className="mt-1 h-4 w-4" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>{t.consent.confirm}</span>
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!confirmed} onClick={enter} className="rounded bg-accent px-4 py-2 font-bold text-accent-fg disabled:opacity-50">
          {t.consent.enter}
        </button>
        <Link href={`/works/${slug}`} className="px-2 py-2 underline">
          {t.consent.back}
        </Link>
      </div>
    </main>
  );
}
