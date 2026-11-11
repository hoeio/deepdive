import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { SettingsProvider } from "@/components/SettingsProvider";
import { t } from "@/lib/strings";

export const metadata: Metadata = {
  title: { default: t.site.name, template: `%s · ${t.site.name}` },
  description: t.site.tagline,
};

// Content is read from disk at request time, so fixture works and status changes apply without a rebuild.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-card focus:p-2">
          {t.site.skip}
        </a>
        <SettingsProvider>
          <Header />
          <div id="main" className="flex flex-1 flex-col">
            {children}
          </div>
          <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">{t.site.footer}</footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
