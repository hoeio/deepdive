import Link from "next/link";
import { WorkCardView } from "@/components/WorkCardView";
import { publishedWorks } from "@/content/loader";
import { toCard } from "@/lib/cards";
import { t } from "@/lib/strings";

export default function Home() {
  const works = publishedWorks();
  const tutorial = works.find((w) => w.genres.includes("tutorial"));
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{t.home.heroTitle}</h1>
        <p className="max-w-2xl text-lg">{t.home.heroBody}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/works" className="rounded bg-accent px-4 py-2 font-semibold text-accent-fg">
            {t.home.browse}
          </Link>
          {tutorial && (
            <Link href={`/works/${tutorial.slug}`} className="rounded border border-line bg-card px-4 py-2 font-semibold">
              {t.home.newHere}
            </Link>
          )}
        </div>
      </section>
      <section aria-labelledby="how">
        <h2 id="how" className="mb-3 text-xl font-bold">
          {t.home.how}
        </h2>
        <ol className="list-decimal space-y-1 pl-6">
          {t.home.howSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="featured">
        <h2 id="featured" className="mb-3 text-xl font-bold">
          {t.home.featured}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.slice(0, 3).map((w) => (
            <WorkCardView key={w.slug} work={toCard(w)} />
          ))}
        </div>
      </section>
    </main>
  );
}
