import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "~*~ Emily & Max's Wedding ~*~",
  description:
    "Emily and Max are getting married in Los Angeles, California on October 24, 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
