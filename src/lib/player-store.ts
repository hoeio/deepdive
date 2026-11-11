import type { WarningCategory } from "@/content/schema";

// Player-side persistence. Everything goes through the PlayerStore interface so server-side
// accounts can replace localStorage later without touching the UI. Methods are async for that reason.

export type Progress = {
  version: 1;
  proofs: Record<string, string>; // puzzleId -> server-signed proof
  visited: string[]; // page urls
  readMails: string[];
  notes: string;
  revealedHints: Record<string, number>; // puzzleId -> highest tier revealed (1..3)
  lastUrl?: string;
  updatedAt?: string;
};

export type Settings = {
  reducedMode: boolean;
  broadcastMode: boolean;
  hiddenWarnings: WarningCategory[]; // hide works where any of these is present (mild or more)
};

export type Consent = { accepted: boolean; at: string };

export interface PlayerStore {
  loadProgress(slug: string): Promise<Progress>;
  saveProgress(slug: string, p: Progress): Promise<void>;
  resetProgress(slug: string): Promise<void>;
  loadSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  getConsent(slug: string): Promise<Consent | null>;
  setConsent(slug: string, c: Consent | null): Promise<void>;
}

export const emptyProgress = (): Progress => ({ version: 1, proofs: {}, visited: [], readMails: [], notes: "", revealedHints: {} });
export const defaultSettings = (): Settings => ({ reducedMode: false, broadcastMode: false, hiddenWarnings: [] });

type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function memoryKV(): KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

function browserKV(): KV {
  try {
    const s = globalThis.localStorage;
    s.setItem("ddv:probe", "1");
    s.removeItem("ddv:probe");
    return s;
  } catch {
    return memoryKV(); // private mode / storage disabled: progress lasts for this tab only
  }
}

export class LocalPlayerStore implements PlayerStore {
  constructor(private kv: KV = browserKV()) {}

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = this.kv.getItem(key);
      if (!raw) return fallback;
      const v = JSON.parse(raw);
      return v && typeof v === "object" ? { ...fallback, ...v } : fallback;
    } catch {
      return fallback; // corrupted entry: start fresh rather than crash
    }
  }

  private write(key: string, v: unknown) {
    try {
      this.kv.setItem(key, JSON.stringify(v));
    } catch {
      /* quota exceeded: keep playing, progress just isn't saved */
    }
  }

  async loadProgress(slug: string) {
    return this.read<Progress>(`ddv:progress:${slug}`, emptyProgress());
  }
  async saveProgress(slug: string, p: Progress) {
    this.write(`ddv:progress:${slug}`, { ...p, updatedAt: new Date().toISOString() });
  }
  async resetProgress(slug: string) {
    this.kv.removeItem(`ddv:progress:${slug}`);
  }
  async loadSettings() {
    return this.read<Settings>("ddv:settings", defaultSettings());
  }
  async saveSettings(s: Settings) {
    this.write("ddv:settings", s);
  }
  async getConsent(slug: string) {
    const c = this.read<Consent | null>(`ddv:consent:${slug}`, null);
    return c?.accepted ? c : null;
  }
  async setConsent(slug: string, c: Consent | null) {
    if (c) this.write(`ddv:consent:${slug}`, c);
    else this.kv.removeItem(`ddv:consent:${slug}`);
  }
}

let store: PlayerStore | null = null;
export function playerStore(): PlayerStore {
  return (store ??= new LocalPlayerStore());
}
