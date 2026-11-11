import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/play/Shell";
import { getPublishedWork } from "@/content/loader";

export async function generateMetadata({ params }: PageProps<"/works/[slug]/play">): Promise<Metadata> {
  return { title: getPublishedWork((await params).slug)?.work.title };
}

export default async function PlayPage({ params }: PageProps<"/works/[slug]/play">) {
  const l = getPublishedWork((await params).slug);
  if (!l) notFound();
  return <Shell slug={l.work.slug} />;
}
