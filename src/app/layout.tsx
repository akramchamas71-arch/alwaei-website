import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const SITE_TITLE = "الوعي | منصة عربية للتحليلات السياسية";
const SITE_DESCRIPTION =
  "الوعي - منصة عربية مستقلة للمقالات والتحليلات السياسية والفكرية.";

export const metadata: Metadata = {
  // Lets every relative URL in page-level metadata (og:image, canonical
  // links, …) resolve to a real absolute URL instead of failing to build.
  // Update this alongside src/lib/site.ts if the site ever moves to a
  // custom domain.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | الوعي",
  },
  description: SITE_DESCRIPTION,
  // Default Open Graph/Twitter data so a link to the homepage (or any page
  // that doesn't set its own) still shows a proper title/description card
  // when shared on Facebook, Telegram, X, or WhatsApp.
  openGraph: {
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ar_AR",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
