"use client";
import { useState } from "react";
import { t } from "@/lib/strings";

// Copies the public work URL only. Progress lives in localStorage and is never put in a link.
export function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded border border-line px-3 py-1.5 text-sm"
      title={t.detail.shareHelp}
      onClick={async () => {
        await navigator.clipboard?.writeText(`${location.origin}/works/${slug}`).catch(() => {});
        setCopied(true);
      }}
    >
      <span aria-live="polite">{copied ? t.detail.shared : t.detail.share}</span>
    </button>
  );
}
