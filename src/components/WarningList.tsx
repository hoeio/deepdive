import type { Work } from "@/content/schema";
import { t } from "@/lib/strings";
import { declaredWarnings } from "@/lib/warnings";

// Full warnings, one collapsed item per category. Expand to read the spoiler-free note.
export function WarningList({ warnings }: { warnings: Work["warnings"] }) {
  return (
    <ul className="flex flex-col gap-2" data-testid="warning-list">
      {declaredWarnings(warnings).map(({ category, intensity, note }) => (
        <li key={category}>
          <details className="rounded border border-line bg-card px-3 py-2">
            <summary className="cursor-pointer">
              <span aria-hidden="true">{t.warning[category].icon} </span>
              <span className="font-semibold">{t.warning[category].label}</span>:{" "}
              {intensity ? t.intensity[intensity] : t.detail.notDeclared}
            </summary>
            <p className="mt-2 text-sm">{note ?? t.warning[category].help}</p>
            {note && <p className="mt-1 text-xs text-muted">{t.warning[category].help}</p>}
          </details>
        </li>
      ))}
    </ul>
  );
}
