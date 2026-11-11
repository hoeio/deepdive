import type { Metadata } from "next";
import { WorksBrowser } from "@/components/WorksBrowser";
import { publishedWorks } from "@/content/loader";
import { toCard } from "@/lib/cards";
import { t } from "@/lib/strings";

export const metadata: Metadata = { title: t.works.title };

export default function WorksPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t.works.title}</h1>
      <WorksBrowser works={publishedWorks().map(toCard)} />
    </main>
  );
}
