// Hard constraint #2: fictional domains only use names reserved for documentation/testing (RFC 2606 / RFC 6761).
const RESERVED_TLDS = ["example", "invalid", "test"];
const RESERVED_DOMAINS = ["example.com", "example.net", "example.org"];

export function isFictionalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  const tld = h.split(".").pop() ?? "";
  return RESERVED_TLDS.includes(tld) || RESERVED_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}

export function fictionalUrlHost(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return isFictionalHost(u.hostname) ? u.hostname : null;
  } catch {
    return null;
  }
}

// Canonical key for comparing fake URLs: no scheme, no trailing slash, lowercase host, no hash.
export function urlKey(url: string): string {
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const u = new URL(withScheme);
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.hostname.toLowerCase()}${path}${u.search}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

// US numbers 555-0100..555-0199 are reserved for fiction.
export const FICTIONAL_PHONE = /555[\s.-]?01\d\d/;

// The built-in in-game search engine lives at this fake host in every work.
export const PLATFORM_SEARCH_HOST = "seek.example";
