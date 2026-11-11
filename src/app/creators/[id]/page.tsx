import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkCardView } from "@/components/WorkCardView";
import { getCreator, publishedWorks } from "@/content/loader";
import { toCard } from "@/lib/cards";
import { t } from "@/lib/strings";

export async function generateMetadata({ params }: PageProps<"/creators/[id]">): Promise<Metadata> {
  return { title: getCreator((await params).id)?.name };
}

const Text = ({ s }: { s: string }) => <p className="whitespace-pre-line">{s.trim()}</p>;

// TODO(creator-links): creator pages render plain text only, no external links. See docs/DECISIONS.md.
export default async function CreatorPage({ params }: PageProps<"/creators/[id]">) {
  const c = getCreator((await params).id);
  if (!c) notFound();
  const works = publishedWorks().filter((w) => w.creator === c.id);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">{c.name}</h1>
      <Text s={c.bio} />
      <section aria-labelledby="wp">
        <h2 id="wp" className="mb-1 text-xl font-bold">{t.creator.warningPolicy}</h2>
        <Text s={c.warningPolicy} />
      </section>
      <section aria-labelledby="bp">
        <h2 id="bp" className="mb-1 text-xl font-bold">{t.creator.broadcastPolicy}</h2>
        <Text s={c.broadcastPolicy} />
      </section>
      <section aria-labelledby="cw">
        <h2 id="cw" className="mb-3 text-xl font-bold">{t.creator.works}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((w) => <WorkCardView key={w.slug} work={toCard(w)} />)}
        </div>
      </section>
    </main>
  );
}
