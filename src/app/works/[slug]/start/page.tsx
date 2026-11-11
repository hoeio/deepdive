import { notFound } from "next/navigation";
import { ConsentScreen } from "@/components/ConsentScreen";
import { getPublishedWork } from "@/content/loader";

export default async function StartPage({ params }: PageProps<"/works/[slug]/start">) {
  const l = getPublishedWork((await params).slug);
  if (!l) notFound();
  const { slug, title, warnings, broadcast } = l.work;
  return <ConsentScreen slug={slug} title={title} warnings={warnings} broadcast={broadcast} />;
}
