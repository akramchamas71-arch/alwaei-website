import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "الوعي | منصة عربية للتحليلات السياسية",
    template: "%s | الوعي",
  },
  description:
    "الوعي - منصة عربية مستقلة للمقالات والتحليلات السياسية والفكرية.",
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
