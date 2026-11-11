"use client";
import { useState } from "react";
import { BROADCAST, DIFFICULTIES, GENRES } from "@/content/schema";
import type { WorkCard } from "@/lib/cards";
import { matches, noFilters, type Filters } from "@/lib/filters";
import { t } from "@/lib/strings";
import { useSettings } from "./SettingsProvider";
import { WarningToggles } from "./WarningToggles";
import { WorkCardView } from "./WorkCardView";

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold">
      {label}
      <select className="rounded border border-line bg-card px-2 py-1 font-normal" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t.filters.any}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function WorksBrowser({ works }: { works: WorkCard[] }) {
  const [f, setF] = useState<Filters>(noFilters);
  const { settings } = useSettings();
  const set = (k: keyof Filters) => (v: string) => setF({ ...f, [k]: v });
  const shown = works.filter((w) => matches(w, f, settings.hiddenWarnings));

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <form aria-label={t.filters.legend} className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <Select label={t.filters.genre} value={f.genre} onChange={set("genre")} options={GENRES.map((g) => [g, t.genre[g]])} />
        <Select
          label={t.filters.playTime}
          value={f.time}
          onChange={set("time")}
          options={(["short", "medium", "long"] as const).map((k) => [k, t.filters.time[k]])}
        />
        <Select label={t.filters.difficulty} value={f.difficulty} onChange={set("difficulty")} options={DIFFICULTIES.map((d) => [d, t.difficulty[d]])} />
        <Select label={t.filters.broadcast} value={f.broadcast} onChange={set("broadcast")} options={BROADCAST.map((b) => [b, t.broadcast[b].label])} />
        <WarningToggles legend={t.filters.hide} />
        <p className="text-xs text-muted">{t.filters.hideHelp}</p>
        <button type="button" className="self-start text-sm underline" onClick={() => setF(noFilters)}>
          {t.filters.reset}
        </button>
      </form>
      <section aria-labelledby="results">
        <h2 id="results" className="mb-3 text-sm text-muted" aria-live="polite">
          {t.works.count(shown.length)}
        </h2>
        {shown.length === 0 ? (
          <p>{t.works.empty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((w) => (
              <WorkCardView key={w.slug} work={w} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
