"use client";

// Renders server-sanitized HTML and turns in-game links into navigation. Never receives unsanitized content.
export function HtmlContent({
  html,
  onNavigate,
  onOpenDoc,
  className = "",
}: {
  html: string;
  onNavigate: (url: string) => void;
  onOpenDoc: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`prose-ddv ${className}`}
      onClick={(e) => {
        const a = (e.target as HTMLElement).closest<HTMLElement>("[data-ddv-href],[data-ddv-doc]");
        if (!a) return;
        e.preventDefault();
        if (a.dataset.ddvHref) onNavigate(a.dataset.ddvHref);
        else if (a.dataset.ddvDoc) onOpenDoc(a.dataset.ddvDoc);
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
