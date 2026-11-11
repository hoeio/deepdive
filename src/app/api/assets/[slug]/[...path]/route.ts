import fs from "node:fs";
import path from "node:path";
import { getPublishedWork, resolveAssetPath } from "@/content/loader";

const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
  ".pdf": "application/pdf", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".m4a": "audio/mp4",
  ".mp4": "video/mp4", ".webm": "video/webm",
};

// Serves files from a published work's assets/ folder only. Path traversal is rejected in resolveAssetPath.
// ponytail: assets of locked documents are reachable if someone guesses the path. Gate assets by proofs if that matters.
export async function GET(_req: Request, ctx: RouteContext<"/api/assets/[slug]/[...path]">) {
  const { slug, path: parts } = await ctx.params;
  const l = getPublishedWork(slug);
  const file = l && resolveAssetPath(l, parts.join("/"));
  if (!file) return new Response("Not found", { status: 404 });
  const ext = path.extname(file).toLowerCase();
  const headers: Record<string, string> = {
    "content-type": TYPES[ext] ?? "application/octet-stream",
    "cache-control": "public, max-age=3600",
    "x-content-type-options": "nosniff",
  };
  // SVGs opened directly must not run scripts or load anything.
  if (ext === ".svg") headers["content-security-policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  return new Response(fs.readFileSync(file), { headers });
}
