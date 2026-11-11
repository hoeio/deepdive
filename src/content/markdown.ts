import { Marked } from "marked";
import sanitizeHtml, { type Transformer } from "sanitize-html";
import { fictionalUrlHost } from "./fictional";

// Hard constraint #4: every content body goes through this sanitizer. Raw HTML in content is stripped.
const marked = new Marked({ gfm: true, breaks: false });

export function assetUrl(slug: string, assetPath: string): string {
  return `/api/assets/${encodeURIComponent(slug)}/${assetPath.split("/").map(encodeURIComponent).join("/")}`;
}

export function renderMarkdown(md: string, slug: string): string {
  const html = marked.parse(md, { async: false });
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h1", "h2"],
    allowedAttributes: { a: ["href", "data-ddv-href", "data-ddv-doc"], img: ["src", "alt"] },
    allowedSchemes: [], // no absolute URLs survive: only "#" and our own relative asset paths
    allowProtocolRelative: false,
    transformTags: {
      a: ((_tag, attribs) => {
        const href = attribs.href ?? "";
        if (fictionalUrlHost(href)) return { tagName: "a", attribs: { href: "#", "data-ddv-href": href } };
        if (href.startsWith("doc:")) return { tagName: "a", attribs: { href: "#", "data-ddv-doc": href.slice(4) } };
        return { tagName: "span", attribs: {} }; // anything else (real web, mailto:, javascript:) loses its link
      }) as Transformer,
      img: ((_tag, attribs) => {
        const src = attribs.src ?? "";
        if (src.startsWith("asset:") && !src.includes(".."))
          return { tagName: "img", attribs: { src: assetUrl(slug, src.slice(6)), alt: attribs.alt ?? "" } };
        return { tagName: "span", attribs: {} };
      }) as Transformer,
    },
  });
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

export function markdownToText(md: string): string {
  const html = marked.parse(md, { async: false });
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, " ")
    .trim();
}

// Link/image targets in Markdown, for the validator.
export function markdownRefs(md: string): string[] {
  return [...md.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)].map((m) => m[1]);
}
