import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HintsView } from "@/components/HintsView";
import { getPublishedWork } from "@/content/loader";
import { t } from "@/lib/strings";

export async function generateMetadata({ params }: PageProps<"/works/[slug]/hints">): Promise<Metadata> {
  const l = getPublishedWork((await params).slug);
  return { title: l ? t.hints.title(l.work.title) : undefined };
}

export default async function HintsPage({ params }: PageProps<"/works/[slug]/hints">) {
  const l = getPublishedWork((await params).slug);
  if (!l) notFound();
  return <HintsView slug={l.work.slug} title={l.work.title} />;
}
