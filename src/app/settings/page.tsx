import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";
import { t } from "@/lib/strings";

export const metadata: Metadata = { title: t.settings.title };

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{t.settings.title}</h1>
      <p className="mb-6 text-muted">{t.settings.intro}</p>
      <SettingsForm />
    </main>
  );
}
