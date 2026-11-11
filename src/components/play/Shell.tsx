"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { playApi, type PlayerState } from "@/lib/play-api";
import { emptyProgress, playerStore, type Progress } from "@/lib/player-store";
import { t } from "@/lib/strings";
import { useSettings } from "../SettingsProvider";
import { AnswersApp, FilesApp, MailApp, NotesApp } from "./Apps";
import { Browser } from "./Browser";
import { HtmlContent } from "./HtmlContent";

const APPS = ["browser", "mail", "files", "notes", "answers"] as const;
type App = (typeof APPS)[number];

export function Shell({ slug }: { slug: string }) {
  const router = useRouter();
  const { settings, loaded: settingsLoaded } = useSettings();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [app, setApp] = useState<App>("browser");
  const [history, setHistory] = useState<{ stack: string[]; i: number }>({ stack: [], i: 0 });
  const [mailId, setMailId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [ending, setEnding] = useState<"hidden" | "warn" | "shown">("hidden");
  const [announce, setAnnounce] = useState("");
  const [error, setError] = useState(false);
  const knownMails = useRef<Set<string> | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Load progress; players who haven't confirmed the warnings go to the consent screen first.
  useEffect(() => {
    (async () => {
      const store = playerStore();
      if (!(await store.getConsent(slug))) return router.replace(`/works/${slug}/start`);
      setProgress(await store.loadProgress(slug));
    })();
  }, [slug, router]);

  // Autosave on every change.
  useEffect(() => {
    if (progress) void playerStore().saveProgress(slug, progress);
  }, [slug, progress]);

  // Fetch what the player can see whenever their proofs change.
  const proofKey = progress ? JSON.stringify(progress.proofs) : null;
  useEffect(() => {
    if (!proofKey) return;
    let live = true;
    playApi
      .state(slug, JSON.parse(proofKey))
      .then((s) => live && (setState(s), setError(false)))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [slug, proofKey]);

  // Announce mail that arrives after an unlock.
  useEffect(() => {
    if (!state) return;
    const ids = state.mails.map((m) => m.id);
    if (knownMails.current) {
      const fresh = ids.filter((id) => !knownMails.current!.has(id));
      if (fresh.length) setAnnounce(t.play.newMail(fresh.length));
    }
    knownMails.current = new Set(ids);
  }, [state]);

  const patch = (p: Partial<Progress>) => setProgress((prev) => (prev ? { ...prev, ...p } : prev));

  // The first entry is the resumed page (or the start page); it joins the stack on the first navigation.
  const firstUrl = progress?.lastUrl ?? state?.startUrl ?? "";
  const navigate = (url: string) => {
    setApp("browser");
    setHistory((h) => {
      const stack = h.stack.length ? h.stack.slice(0, h.i + 1) : [firstUrl];
      return { stack: [...stack, url], i: stack.length };
    });
    setProgress((prev) => (prev ? { ...prev, lastUrl: url, visited: prev.visited.includes(url) ? prev.visited : [...prev.visited, url] } : prev));
  };
  const go = (delta: number) =>
    setHistory((h) => {
      const i = Math.max(0, Math.min(h.stack.length - 1, h.i + delta));
      patch({ lastUrl: h.stack[i] });
      return { ...h, i };
    });
  const openMail = (id: string) => {
    setApp("mail");
    setMailId(id);
    setProgress((prev) => (prev && !prev.readMails.includes(id) ? { ...prev, readMails: [...prev.readMails, id] } : prev));
  };
  const openDoc = (id: string) => {
    setApp("files");
    setDocId(id);
  };

  async function submitAnswer(puzzleId: string, answer: string) {
    if (!progress) return false;
    const r = await playApi.answer(slug, progress.proofs, puzzleId, answer);
    if (!r.correct || !r.proof) return false;
    const proofsNext = { ...progress.proofs, [puzzleId]: r.proof };
    patch({ proofs: proofsNext });
    const s = await playApi.state(slug, proofsNext);
    setState(s);
    if (s.ending && !state?.ending) setEnding(settings.broadcastMode ? "warn" : "shown");
    return true;
  }

  async function reset() {
    if (!confirm(t.play.resetConfirm)) return;
    await playerStore().resetProgress(slug);
    knownMails.current = null;
    setProgress(emptyProgress());
    setHistory({ stack: [], i: 0 });
    setMailId(null);
    setDocId(null);
    setEnding("hidden");
    setApp("browser");
  }

  if (!settingsLoaded || !progress || !state) {
    return <p className="p-8">{error ? t.play.error : t.play.loading}</p>;
  }

  const unread = state.mails.filter((m) => !progress.readMails.includes(m.id)).length;
  const url = history.stack[history.i] ?? firstUrl;
  const nav = { onNavigate: navigate, onOpenDoc: openDoc };

  function onTabKey(e: React.KeyboardEvent, idx: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const next = (idx + dir + APPS.length) % APPS.length;
    setApp(APPS[next]);
    tabRefs.current[next]?.focus();
  }

  return (
    <main className="flex flex-1 flex-col bg-bg">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-card px-4 py-2 text-sm">
        <h1 className="font-bold">{state.title}</h1>
        <span className="flex items-center gap-2">
          <progress max={state.progress.total} value={state.progress.solved} className="h-2 w-24" aria-hidden="true" />
          <span data-testid="progress">{t.play.progress(state.progress.solved, state.progress.total)}</span>
        </span>
        <span className="text-xs text-muted">{t.play.saved}</span>
        <span className="ml-auto flex gap-3">
          <Link href={`/works/${slug}/hints`} className="underline">
            {t.play.hints}
          </Link>
          <button type="button" className="underline" onClick={reset}>
            {t.play.reset}
          </button>
          <Link href={`/works/${slug}`} className="underline">
            {t.play.exit}
          </Link>
        </span>
      </div>

      <div role="tablist" aria-label={t.play.appsLabel} className="flex gap-1 overflow-x-auto border-b border-line bg-[#e4e4ea] px-2 pt-2">
        {APPS.map((a, i) => (
          <button
            key={a}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`tab-${a}`}
            aria-selected={app === a}
            aria-controls="app-panel"
            tabIndex={app === a ? 0 : -1}
            onClick={() => setApp(a)}
            onKeyDown={(e) => onTabKey(e, i)}
            className={`rounded-t px-4 py-2 text-sm font-semibold ${app === a ? "bg-card" : "bg-transparent hover:bg-[#d6d6de]"}`}
          >
            {t.play.apps[a]}
            {a === "mail" && unread > 0 && <span className="ml-1 rounded-full bg-[#7a1f1f] px-1.5 text-xs text-white">{unread}</span>}
          </button>
        ))}
      </div>

      <p aria-live="polite" className={announce ? "bg-[#fdf1dc] px-4 py-1 text-sm" : "sr-only"} data-testid="announce">
        {announce}
      </p>

      <div id="app-panel" role="tabpanel" aria-labelledby={`tab-${app}`} className="flex min-h-[60vh] flex-1 flex-col">
        {app === "browser" && (
          <Browser
            slug={slug}
            proofs={progress.proofs}
            url={url}
            canBack={history.i > 0}
            canForward={history.i < history.stack.length - 1}
            startUrl={state.startUrl}
            searchHost={state.searchHost}
            reduced={settings.reducedMode}
            onNavigate={navigate}
            onBack={() => go(-1)}
            onForward={() => go(1)}
            onOpenMail={openMail}
            onOpenDoc={openDoc}
          />
        )}
        {app === "mail" && <MailApp mails={state.mails} selected={mailId} read={progress.readMails} onSelect={openMail} reduced={settings.reducedMode} {...nav} />}
        {app === "files" && <FilesApp docs={state.documents} selected={docId} onSelect={setDocId} reduced={settings.reducedMode} {...nav} />}
        {app === "notes" && <NotesApp notes={progress.notes} onChange={(notes) => patch({ notes })} broadcast={settings.broadcastMode} />}
        {app === "answers" && (
          <AnswersApp puzzles={state.puzzles} onSubmit={submitAnswer} ended={!!state.ending} onShowEnding={() => setEnding(settings.broadcastMode ? "warn" : "shown")} {...nav} />
        )}
      </div>

      {ending !== "hidden" && state.ending && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="ending-title" className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-card p-6">
            {ending === "warn" ? (
              <>
                <h2 id="ending-title" className="mb-2 text-2xl font-bold">
                  {t.play.endingWarnTitle}
                </h2>
                <p>{t.play.endingWarnBody}</p>
                <div className="mt-4 flex gap-3">
                  <button type="button" autoFocus className="rounded bg-accent px-4 py-2 font-semibold text-accent-fg" onClick={() => setEnding("shown")}>
                    {t.play.endingContinue}
                  </button>
                  <button type="button" className="rounded border border-line px-4 py-2" onClick={() => setEnding("hidden")}>
                    {t.play.endingLater}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">{t.play.endingDone}</p>
                <h2 id="ending-title" className="mb-3 text-2xl font-bold">
                  {state.ending.title}
                </h2>
                <HtmlContent
                  html={state.ending.html}
                  onNavigate={(u) => (setEnding("hidden"), navigate(u))}
                  onOpenDoc={(id) => (setEnding("hidden"), openDoc(id))}
                />
                <button type="button" autoFocus className="mt-4 rounded bg-accent px-4 py-2 font-semibold text-accent-fg" onClick={() => setEnding("hidden")}>
                  {t.play.endingReplay}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
