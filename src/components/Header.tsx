import Link from "next/link";
import { t } from "@/lib/strings";
import { ModeBadges } from "./ModeBadges";

export function Header() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {t.site.name}
        </Link>
        <nav aria-label={t.nav.main} className="flex gap-4 text-sm">
          <Link href="/works" className="underline-offset-4 hover:underline">
            {t.nav.works}
          </Link>
          <Link href="/settings" className="underline-offset-4 hover:underline">
            {t.nav.settings}
          </Link>
        </nav>
        <span className="ml-auto">
          <ModeBadges />
        </span>
      </div>
    </header>
  );
}
