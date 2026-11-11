import { t } from "@/lib/strings";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">{t.site.name}</h1>
      <p>{t.site.tagline}</p>
    </main>
  );
}
