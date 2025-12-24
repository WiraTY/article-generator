import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Article Generator - AI-Powered SEO Content",
  description: "Generate SEO-optimized articles with AI. Research keywords, create content, and grow your organic traffic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
