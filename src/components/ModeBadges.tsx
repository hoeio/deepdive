"use client";
import { t } from "@/lib/strings";
import { useSettings } from "./SettingsProvider";

export function ModeBadges() {
  const { settings } = useSettings();
  return (
    <span className="flex gap-2 text-xs">
      {settings.broadcastMode && <span className="rounded bg-[#7a1f1f] px-2 py-1 font-semibold text-white">{t.settings.broadcastOn}</span>}
      {settings.reducedMode && <span className="rounded bg-[#1d4d2b] px-2 py-1 font-semibold text-white">{t.settings.reducedOn}</span>}
    </span>
  );
}
