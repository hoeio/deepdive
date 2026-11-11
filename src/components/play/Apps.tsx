"use client";
import { useState } from "react";
import type { PlayerState } from "@/lib/play-api";
import { t } from "@/lib/strings";
import { HtmlContent } from "./HtmlContent";
import { SceneGate } from "./SceneGate";

type Nav = { onNavigate: (url: string) => void; onOpenDoc: (id: string) => void };
const listBtn = (active: boolean) => `w-full border-b border-line px-3 py-2 text-left ${active ? "bg-[#e3e9fb]" : "bg-card hover:bg-bg"}`;

export function MailApp({ mails, selected, read, onSelect, reduced, ...nav }: Nav & {
  mails: PlayerState["mails"];
  selected: string | null;
  read: string[];
  onSelect: (id: string) => void;
  reduced: boolean;
}) {
  const m = mails.find((x) => x.id === selected);
  return (
    <div className="grid flex-1 md:grid-cols-[18rem_1fr]">
      <nav aria-label={t.play.inbox} className="border-r border-line">
        <h2 className="px-3 py-2 font-bold">{t.play.inbox}</h2>
        {mails.length === 0 && <p className="px-3">{t.play.noMail}</p>}
        <ul>
          {[...mails].reverse().map((x) => {
            const unread = !read.includes(x.id);
            return (
              <li key={x.id}>
                <button type="button" className={listBtn(x.id === selected)} onClick={() => onSelect(x.id)} aria-current={x.id === selected}>
                  <span className={`block ${unread ? "font-bold" : ""}`}>
                    {x.subject}
                    {unread && <span className="sr-only"> ({t.play.unread})</span>}
                  </span>
                  <span className="block text-xs text-muted">
                    {x.from.name}
                    {x.date ? ` · ${x.date}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="bg-card">
        {m && (
          <SceneGate key={m.id} scene={m.scene} sound={m.sound} reduced={reduced}>
            <article className="p-6" aria-label={m.subject}>
              <h2 className="text-xl font-bold">{m.subject}</h2>
              <p className="mb-4 text-sm text-muted">
                {t.play.from}: {m.from.name} &lt;{m.from.address}&gt;
                {m.date ? ` · ${m.date}` : ""}
              </p>
              <HtmlContent html={m.html} {...nav} />
            </article>
          </SceneGate>
        )}
      </div>
    </div>
  );
}

export function FilesApp({ docs, selected, onSelect, reduced, ...nav }: Nav & {
  docs: PlayerState["documents"];
  selected: string | null;
  onSelect: (id: string) => void;
  reduced: boolean;
}) {
  const d = docs.find((x) => x.id === selected);
  return (
    <div className="grid flex-1 md:grid-cols-[18rem_1fr]">
      <nav aria-label={t.play.files} className="border-r border-line">
        <h2 className="px-3 py-2 font-bold">{t.play.files}</h2>
        {docs.length === 0 && <p className="px-3">{t.play.noFiles}</p>}
        <ul>
          {docs.map((x) => (
            <li key={x.id}>
              <button type="button" className={listBtn(x.id === selected)} onClick={() => onSelect(x.id)} aria-current={x.id === selected}>
                {x.title}
                <span className="block text-xs uppercase text-muted">{x.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="bg-card">
        {d && (
          <SceneGate key={d.id} scene={d.scene} sound={d.sound} reduced={reduced}>
            <article className="flex flex-col gap-4 p-6" aria-label={d.title}>
              <h2 className="text-xl font-bold">{d.title}</h2>
              {d.kind === "image" && d.assetUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- local work asset, no optimization needed
                <img src={d.assetUrl} alt={d.alt} className="max-h-[70vh] max-w-full self-start rounded border border-line" />
              )}
              {d.kind === "pdf" && d.assetUrl && (
                <>
                  <iframe src={d.assetUrl} title={d.title} className="h-[70vh] w-full rounded border border-line" />
                  <a href={d.assetUrl} target="_blank" rel="noopener" className="underline">
                    {t.play.openFile}
                  </a>
                </>
              )}
              {d.kind === "audio" && d.assetUrl && <audio controls src={d.assetUrl} className="w-full" />}
              {d.kind === "video" && d.assetUrl && <video controls src={d.assetUrl} className="max-h-[70vh] w-full" />}
              {d.html && (
                <div>
                  {(d.kind === "audio" || d.kind === "video") && <h3 className="font-semibold">{t.play.transcript}</h3>}
                  <HtmlContent html={d.html} {...nav} />
                </div>
              )}
            </article>
          </SceneGate>
        )}
      </div>
    </div>
  );
}

export function NotesApp({ notes, onChange, broadcast }: { notes: string; onChange: (s: string) => void; broadcast: boolean }) {
  const [shown, setShown] = useState(!broadcast);
  return (
    <div className="flex flex-1 flex-col gap-2 bg-card p-6">
      <label htmlFor="notes" className="text-xl font-bold">
        {t.play.notes}
      </label>
      <p className="text-sm text-muted">{t.play.notesHelp}</p>
      {shown ? (
        <textarea id="notes" className="min-h-[50vh] flex-1 rounded border border-line p-3 font-mono" value={notes} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div>
          <p>{t.play.notesHidden}</p>
          <button type="button" className="mt-2 underline" onClick={() => setShown(true)}>
            {t.play.notesShow}
          </button>
        </div>
      )}
    </div>
  );
}

export function AnswersApp({ puzzles, onSubmit, ended, onShowEnding, ...nav }: Nav & {
  puzzles: PlayerState["puzzles"];
  onSubmit: (puzzleId: string, answer: string) => Promise<boolean>;
  ended: boolean;
  onShowEnding: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 bg-card p-6">
      <h2 className="text-xl font-bold">{t.play.answers}</h2>
      {puzzles.length === 0 && <p>{t.play.noPuzzles}</p>}
      {puzzles.map((p) => (
        <PuzzleForm key={p.id} puzzle={p} onSubmit={onSubmit} {...nav} />
      ))}
      {ended && (
        <button type="button" className="self-start rounded bg-accent px-4 py-2 font-semibold text-accent-fg" onClick={onShowEnding}>
          {t.play.endingView}
        </button>
      )}
    </div>
  );
}

function PuzzleForm({ puzzle, onSubmit, ...nav }: Nav & { puzzle: PlayerState["puzzles"][number]; onSubmit: (id: string, a: string) => Promise<boolean> }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"" | "correct" | "wrong" | "error">("");
  const id = `answer-${puzzle.id}`;
  return (
    <section className="rounded border border-line p-4" aria-labelledby={`${id}-title`} data-testid={`puzzle-${puzzle.id}`}>
      <h3 id={`${id}-title`} className="font-bold">
        {puzzle.title} {puzzle.solved && <span className="ml-2 rounded bg-[#e3f1e6] px-2 text-sm text-[#14532d]">{t.play.solved}</span>}
      </h3>
      <HtmlContent html={puzzle.html} {...nav} />
      {!puzzle.solved && (
        <form
          className="mt-2 flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!answer.trim()) return;
            try {
              const ok = await onSubmit(puzzle.id, answer);
              setResult(ok ? "correct" : "wrong");
              if (ok) setAnswer("");
            } catch {
              setResult("error");
            }
          }}
        >
          <label htmlFor={id} className="sr-only">
            {t.play.answerLabel}
          </label>
          <input id={id} className="min-w-0 flex-1 rounded border border-line px-2 py-1" placeholder={t.play.answerLabel} value={answer} onChange={(e) => setAnswer(e.target.value)} autoComplete="off" />
          <button type="submit" className="rounded bg-accent px-3 py-1 font-semibold text-accent-fg">
            {t.play.submit}
          </button>
        </form>
      )}
      <p role="status" className="mt-2 text-sm">
        {result === "correct" ? t.play.correct : result === "wrong" ? t.play.wrong : result === "error" ? t.play.error : ""}
      </p>
    </section>
  );
}
