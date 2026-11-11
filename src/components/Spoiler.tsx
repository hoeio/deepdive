"use client";
import { useState } from "react";
import { t } from "@/lib/strings";

// Spoiler tag for community-style text. Hidden until the reader chooses to reveal it.
export function Spoiler({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <span className="rounded bg-[#ececf0] px-1">
      {children}{" "}
      <button type="button" className="text-xs underline" onClick={() => setOpen(false)}>
        {t.spoiler.hide}
      </button>
    </span>
  ) : (
    <button type="button" className="rounded bg-fg px-1.5 text-xs text-bg" onClick={() => setOpen(true)} aria-label={t.spoiler.show}>
      {t.spoiler.label}
    </button>
  );
}

// Plain text where ||this|| becomes a spoiler. Never renders HTML.
export function SpoilerText({ text }: { text: string }) {
  const parts = text.split(/\|\|(.+?)\|\|/g);
  return <>{parts.map((p, i) => (i % 2 ? <Spoiler key={i}>{p}</Spoiler> : <span key={i}>{p}</span>))}</>;
}
