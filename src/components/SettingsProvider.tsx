"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { defaultSettings, playerStore, type Settings } from "@/lib/player-store";

type Ctx = { settings: Settings; loaded: boolean; update: (patch: Partial<Settings>) => void };
const SettingsContext = createContext<Ctx>({ settings: defaultSettings(), loaded: false, update: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    playerStore()
      .loadSettings()
      .then((s) => {
        setSettings(s);
        setLoaded(true);
      });
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void playerStore().saveSettings(next);
      return next;
    });
  }, []);

  return <SettingsContext.Provider value={{ settings, loaded, update }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
