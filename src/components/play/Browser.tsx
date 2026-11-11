"use client";
import { useEffect, useState } from "react";
import { playApi, type PlayerPage } from "@/lib/play-api";
import { t } from "@/lib/strings";
import { HtmlContent } from "./HtmlContent";
import { SceneGate } from "./SceneGate";

type Hit = Awaited<ReturnType<typeof playApi.search>>["hits"][number];

export function toUrl(input: string): string {
  const s = input.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function seekQuery(url: string, host: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname === host ? (u.searchParams.get("q") ?? "") : null;
  } catch {
    return null;
  }
}

export function Browser(props: {
  slug: string;
  proofs: Record<string, string>;
  url: string;
  canBack: boolean;
  canForward: boolean;
  startUrl: string;
  searchHost: string;
  reduced: boolean;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onOpenMail: (id: string) => void;
  onOpenDoc: (id: string) => void;
}) {
  const { slug, proofs, url, searchHost } = props;
  // Results are tagged with the request they answer, so a stale result simply reads as "loading".
  const reqKey = JSON.stringify([url, proofs]);
  const [result, setResult] = useState<{ key: string; page?: PlayerPage | null; hits?: Hit[] } | null>(null);
  const q = seekQuery(url, searchHost);

  useEffect(() => {
    let live = true;
    const [u, p] = JSON.parse(reqKey) as [string, Record<string, string>];
    const query = seekQuery(u, searchHost);
    const done = (r: { page?: PlayerPage | null; hits?: Hit[] }) => live && setResult({ key: reqKey, ...r });
    if (query !== null) {
      if (query.trim()) playApi.search(slug, p, query).then((r) => done({ hits: r.hits })).catch(() => done({ hits: [] }));
    } else {
      playApi.page(slug, p, u).then((r) => done({ page: r.page })).catch(() => done({ page: null }));
    }
    return () => {
      live = false;
    };
  }, [slug, reqKey, searchHost]);

  const current = result?.key === reqKey ? result : null;
  const page: PlayerPage | null | "loading" = current ? (current.page ?? null) : "loading";
  const hits = current?.hits ?? null;

  const seekUrl = (query: string) => `https://${searchHost}/?q=${encodeURIComponent(query)}`;
  const btn = "rounded border border-line bg-card px-2 py-1 text-sm disabled:opacity-50";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-[#ececf0] p-2">
        <button type="button" className={btn} onClick={props.onBack} disabled={!props.canBack} aria-label={t.play.back}>
          ←
        </button>
        <button type="button" className={btn} onClick={props.onForward} disabled={!props.canForward} aria-label={t.play.forward}>
          →
        </button>
        <button type="button" className={btn} onClick={() => props.onNavigate(props.startUrl)} aria-label={t.play.home}>
          ⌂
        </button>
        <AddressBar key={url} url={url} onGo={props.onNavigate} btn={btn} />
        <button type="button" className={btn} onClick={() => props.onNavigate(`https://${searchHost}/`)}>
          {t.play.seekName}
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-card">
        {q !== null ? (
          <Seek
            key={url}
            q={q}
            hits={hits}
            onSearch={(s) => props.onNavigate(seekUrl(s))}
            onOpen={(h) => (h.kind === "pages" && h.url ? props.onNavigate(h.url) : h.kind === "mails" ? props.onOpenMail(h.id) : props.onOpenDoc(h.id))}
          />
        ) : page === "loading" ? (
          <p className="p-6">{t.play.loading}</p>
        ) : page === null ? (
          <div className="p-6" data-testid="page-not-found">
            <h1 className="mb-2 text-2xl font-bold">{t.play.notFoundTitle}</h1>
            <p>{t.play.notFoundBody(url)}</p>
            <button type="button" className="mt-3 underline" onClick={() => props.onNavigate(`https://${searchHost}/`)}>
              {t.play.searchOnSeek}
            </button>
          </div>
        ) : (
          <SceneGate key={page.url} scene={page.scene} sound={page.sound} reduced={props.reduced}>
            <article className="p-6" aria-label={page.title}>
              <HtmlContent html={page.html} onNavigate={props.onNavigate} onOpenDoc={props.onOpenDoc} />
            </article>
          </SceneGate>
        )}
      </div>
    </div>
  );
}

function Seek({ q, hits, onSearch, onOpen }: { q: string; hits: Hit[] | null; onSearch: (q: string) => void; onOpen: (h: Hit) => void }) {
  const [input, setInput] = useState(q);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <p className="text-center text-3xl font-bold tracking-tight text-[#1f4fd1]" aria-hidden="true">
        {t.play.seekName}
      </p>
      <p className="text-center text-sm text-muted">{t.play.seekTagline}</p>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) onSearch(input.trim());
        }}
      >
        <label htmlFor="seek-q" className="sr-only">
          {t.play.seekPlaceholder}
        </label>
        <input id="seek-q" type="search" className="flex-1 rounded-full border border-line px-4 py-2" placeholder={t.play.seekPlaceholder} value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-fg">
          {t.play.seekButton}
        </button>
      </form>
      {q.trim() && (
        <section aria-live="polite">
          {hits === null ? (
            <p>{t.play.loading}</p>
          ) : hits.length === 0 ? (
            <p>{t.play.seekNoResults(q)}</p>
          ) : (
            <>
              <h2 className="mb-2 text-sm text-muted">{t.play.seekResults(hits.length, q)}</h2>
              <ol className="flex flex-col gap-4" data-testid="seek-results">
                {hits.map((h) => (
                  <li key={`${h.kind}:${h.id}`}>
                    <button type="button" className="text-left text-lg text-[#1f4fd1] underline" onClick={() => onOpen(h)}>
                      {h.title}
                    </button>
                    <p className="font-mono text-xs text-ok">{h.url ?? (h.kind === "mails" ? t.play.apps.mail : t.play.apps.files)}</p>
                    <p className="text-sm">{h.snippet}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function AddressBar({ url, onGo, btn }: { url: string; onGo: (url: string) => void; btn: string }) {
  const [address, setAddress] = useState(url);
  return (
    <form
      className="flex min-w-0 flex-1 gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (address.trim()) onGo(toUrl(address));
      }}
    >
      <label htmlFor="address" className="sr-only">
        {t.play.address}
      </label>
      <input
        id="address"
        className="min-w-0 flex-1 rounded border border-line bg-card px-2 py-1 font-mono text-sm"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <button type="submit" className={btn}>
        {t.play.go}
      </button>
    </form>
  );
}
