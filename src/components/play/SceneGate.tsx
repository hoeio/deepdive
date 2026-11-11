"use client";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/strings";

export type Scene = { jumpScare?: boolean; flashing?: boolean; skippable?: boolean; skipText?: string } | null;
export type Sound = { url: string; sudden: boolean } | null;

// Wraps one content node. In Reduced Mode, tagged scenes get a pre-notice (with "skip" when allowed),
// effects are never applied and sudden sounds are muted. Give it a `key` per node so it resets.
export function SceneGate({ scene, sound, reduced, children }: { scene: Scene; sound: Sound; reduced: boolean; children: React.ReactNode }) {
  const tagged = !!(scene?.jumpScare || scene?.flashing);
  const [decision, setDecision] = useState<"pending" | "continue" | "skip">(reduced && tagged ? "pending" : "continue");
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (decision === "pending") continueRef.current?.focus();
  }, [decision]);

  if (decision === "pending") {
    return (
      <section role="alertdialog" aria-labelledby="scene-notice" aria-describedby="scene-notice-body" className="m-4 rounded-lg border-2 border-warn bg-card p-5" data-testid="scene-notice">
        <h2 id="scene-notice" className="mb-2 text-lg font-bold">
          {t.play.sceneNotice}
        </h2>
        <div id="scene-notice-body">
          {scene?.jumpScare && <p>{t.play.sceneJump}</p>}
          {scene?.flashing && <p>{t.play.sceneFlash}</p>}
        </div>
        <div className="mt-4 flex gap-3">
          <button ref={continueRef} type="button" className="rounded bg-accent px-3 py-1.5 font-semibold text-accent-fg" onClick={() => setDecision("continue")}>
            {t.play.sceneContinue}
          </button>
          {scene?.skippable && (
            <button type="button" className="rounded border border-line px-3 py-1.5" onClick={() => setDecision("skip")}>
              {t.play.sceneSkip}
            </button>
          )}
        </div>
      </section>
    );
  }

  if (decision === "skip") {
    return (
      <div className="m-4 rounded border border-line bg-card p-4" data-testid="scene-skipped">
        <p className="text-sm text-muted">{t.play.sceneSkipped}</p>
        <p className="mt-2">{scene?.skipText}</p>
      </div>
    );
  }

  const mute = reduced && sound?.sudden;
  const fx = reduced ? "" : [scene?.jumpScare && "fx-jumpscare", scene?.flashing && "fx-flashing"].filter(Boolean).join(" ");
  return (
    <div className={fx} data-testid="scene-content">
      {sound && !mute && <audio src={sound.url} autoPlay />}
      {mute && <p className="mx-4 mt-2 text-xs text-muted">{t.play.loudMuted}</p>}
      {children}
    </div>
  );
}
