import Link from "next/link";
import type { WorkCard } from "@/lib/cards";
import { t } from "@/lib/strings";
import { BroadcastBadge, WarningIcons } from "./Badges";

export function WorkCardView({ work }: { work: WorkCard }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4" data-testid="work-card">
      <h3 className="text-lg font-bold">
        <Link href={`/works/${work.slug}`} className="underline-offset-4 hover:underline">
          {work.title}
        </Link>
      </h3>
      <p className="text-sm">{work.blurb}</p>
      <dl className="grid grid-cols-2 gap-x-3 text-sm">
        <dt className="text-muted">{t.works.playTime}</dt>
        <dd>{t.works.minutes(work.playTimeMinutes.min, work.playTimeMinutes.max)}</dd>
        <dt className="text-muted">{t.works.difficulty}</dt>
        <dd>{t.difficulty[work.difficulty]}</dd>
        <dt className="text-muted">{t.works.genres}</dt>
        <dd>{work.genres.map((g) => t.genre[g]).join(", ")}</dd>
      </dl>
      <WarningIcons warnings={work.warnings} />
      <div className="mt-auto">
        <BroadcastBadge permission={work.broadcast.permission} />
      </div>
    </article>
  );
}
