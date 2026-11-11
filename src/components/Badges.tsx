import type { Work } from "@/content/schema";
import { t } from "@/lib/strings";
import { highestIntensity, presentWarnings } from "@/lib/warnings";

const BROADCAST_STYLE: Record<Work["broadcast"]["permission"], string> = {
  allowed: "bg-[#e3f1e6] text-[#14532d] border-[#9cc9a7]",
  allowed_with_spoiler_restrictions: "bg-[#fdf1dc] text-[#7a3e00] border-[#e2b877]",
  not_allowed: "bg-[#fbe4e4] text-[#7a1f1f] border-[#e3a1a1]",
};

export function BroadcastBadge({ permission, long }: { permission: Work["broadcast"]["permission"]; long?: boolean }) {
  const b = t.broadcast[permission];
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${BROADCAST_STYLE[permission]}`} title={b.help} data-testid="broadcast-badge">
      {long ? b.label : b.short}
    </span>
  );
}

export function WarningIcons({ warnings }: { warnings: Work["warnings"] }) {
  const present = presentWarnings(warnings);
  if (present.length === 0) return <p className="text-xs text-muted">{t.works.noWarnings}</p>;
  const top = highestIntensity(warnings);
  return (
    <div className="flex flex-wrap items-center gap-1" aria-label={t.works.warnings}>
      {present.map((w) => (
        <span
          key={w.category}
          className="inline-flex items-center gap-1 rounded border border-line bg-bg px-1.5 py-0.5 text-xs"
          title={`${t.warning[w.category].label}: ${t.intensity[w.intensity]}`}
        >
          <span aria-hidden="true">{t.warning[w.category].icon}</span>
          <span>
            {t.warning[w.category].label}: {t.intensity[w.intensity]}
          </span>
        </span>
      ))}
      <span className="text-xs font-semibold text-warn">{t.works.highest(t.intensity[top])}</span>
    </div>
  );
}
