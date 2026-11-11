"use client";
import { t } from "@/lib/strings";
import { useSettings } from "./SettingsProvider";
import { WarningToggles } from "./WarningToggles";

function Toggle({ label, help, checked, onChange, id }: { label: string; help: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" className="mt-1 h-4 w-4" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-describedby={`${id}-help`} />
      <div>
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <p id={`${id}-help`} className="text-sm text-muted">
          {help}
        </p>
      </div>
    </div>
  );
}

export function SettingsForm() {
  const { settings, update } = useSettings();
  return (
    <div className="flex flex-col gap-6">
      <Toggle id="reduced" label={t.settings.reduced} help={t.settings.reducedHelp} checked={settings.reducedMode} onChange={(v) => update({ reducedMode: v })} />
      <Toggle id="broadcast" label={t.settings.broadcast} help={t.settings.broadcastHelp} checked={settings.broadcastMode} onChange={(v) => update({ broadcastMode: v })} />
      <WarningToggles legend={t.settings.hidden} />
    </div>
  );
}
