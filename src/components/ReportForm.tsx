"use client";
import { useState } from "react";
import { REPORT_REASONS } from "@/lib/report";
import { t } from "@/lib/strings";
import { SpoilerText } from "./Spoiler";

export function ReportForm({ slug }: { slug: string }) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workSlug: slug, reason, details }),
    }).catch(() => null);
    setState(res?.ok ? "sent" : "failed");
  }

  if (state === "sent") return <p role="status">{t.report.sent}</p>;
  return (
    <details className="rounded border border-line bg-card p-3">
      <summary className="cursor-pointer font-semibold">{t.report.open}</summary>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t.report.reason}
          <select className="rounded border border-line px-2 py-1 font-normal" value={reason} onChange={(e) => setReason(e.target.value)}>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {t.report.reasons[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          {t.report.details}
          <textarea
            className="rounded border border-line px-2 py-1 font-normal"
            rows={3}
            maxLength={1000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            aria-describedby="report-help"
          />
        </label>
        <p id="report-help" className="text-xs text-muted">
          {t.report.detailsHelp}
        </p>
        {details && (
          <p className="text-sm">
            <span className="font-semibold">{t.report.preview}: </span>
            <SpoilerText text={details} />
          </p>
        )}
        <button type="submit" disabled={state === "sending"} className="self-start rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg">
          {t.report.submit}
        </button>
        {state === "failed" && <p role="alert">{t.report.failed}</p>}
      </form>
    </details>
  );
}
