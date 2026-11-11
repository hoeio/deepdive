import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BroadcastBadge, WarningIcons } from "@/components/Badges";
import { ReportForm } from "@/components/ReportForm";
import { ShareButton } from "@/components/ShareButton";
import { WarningList } from "@/components/WarningList";
import { getCreator, getPublishedWork } from "@/content/loader";
import { renderMarkdown } from "@/content/markdown";
import { t } from "@/lib/strings";

export async function generateMetadata({ params }: PageProps<"/works/[slug]">): Promise<Metadata> {
  const l = getPublishedWork((await params).slug);
  return { title: l?.work.title };
}

export default async function WorkPage({ params }: PageProps<"/works/[slug]">) {
  const l = getPublishedWork((await params).slug);
  if (!l) notFound();
  const w = l.work;
  const creator = getCreator(w.creator);

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1fr_18rem]">
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">{w.title}</h1>
        <div className="prose-ddv" dangerouslySetInnerHTML={{ __html: renderMarkdown(w.description, w.slug) }} />
        <section aria-labelledby="warnings">
          <h2 id="warnings" className="mb-1 text-xl font-bold">
            {t.detail.warningsTitle}
          </h2>
          <p className="mb-3 text-sm text-muted">{t.detail.warningsHelp}</p>
          <WarningList warnings={w.warnings} />
        </section>
        <ReportForm slug={w.slug} />
      </div>
      <aside className="flex flex-col gap-4">
        <Link href={`/works/${w.slug}/start`} className="rounded bg-accent px-4 py-3 text-center text-lg font-bold text-accent-fg">
          {t.detail.start}
        </Link>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted">{t.works.playTime}</dt>
          <dd>{t.works.minutes(w.playTimeMinutes.min, w.playTimeMinutes.max)}</dd>
          <dt className="text-muted">{t.works.difficulty}</dt>
          <dd>{t.difficulty[w.difficulty]}</dd>
          <dt className="text-muted">{t.works.genres}</dt>
          <dd>{w.genres.map((g) => t.genre[g]).join(", ")}</dd>
          <dt className="text-muted">{t.detail.creator}</dt>
          <dd>{creator ? <Link className="underline" href={`/creators/${creator.id}`}>{creator.name}</Link> : w.creator}</dd>
        </dl>
        <WarningIcons warnings={w.warnings} />
        <section aria-labelledby="broadcast" className="flex flex-col gap-2">
          <h2 id="broadcast" className="font-bold">
            {t.detail.broadcastTitle}
          </h2>
          <BroadcastBadge permission={w.broadcast.permission} long />
          <p className="text-sm">{w.broadcast.note ?? t.broadcast[w.broadcast.permission].help}</p>
        </section>
        <ShareButton slug={w.slug} />
        <p className="text-xs text-muted">{t.detail.shareHelp}</p>
      </aside>
    </main>
  );
}
