import type { Metadata } from "next";
import "./globals.css";
import { t } from "@/lib/strings";

export const metadata: Metadata = {
  title: t.site.name,
  description: t.site.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
