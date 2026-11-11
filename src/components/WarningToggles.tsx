"use client";
import { WARNING_CATEGORIES, type WarningCategory } from "@/content/schema";
import { t } from "@/lib/strings";
import { useSettings } from "./SettingsProvider";

// The player's "hide works with these warnings" setting. Shared by the works list and the settings page.
export function WarningToggles({ legend }: { legend: string }) {
  const { settings, update } = useSettings();
  const toggle = (c: WarningCategory, on: boolean) =>
    update({ hiddenWarnings: on ? [...settings.hiddenWarnings, c] : settings.hiddenWarnings.filter((x) => x !== c) });
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 font-semibold">{legend}</legend>
      {WARNING_CATEGORIES.map((c) => (
        <label key={c} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.hiddenWarnings.includes(c)} onChange={(e) => toggle(c, e.target.checked)} />
          <span aria-hidden="true">{t.warning[c].icon}</span> {t.warning[c].label}
        </label>
      ))}
    </fieldset>
  );
}
