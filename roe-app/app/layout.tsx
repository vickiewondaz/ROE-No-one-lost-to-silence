import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Figma v1: Inter throughout — display included (500/600/700 for headings).
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ROE — No one lost to silence",
  description: "No one lost to silence — follow up with every newcomer.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ROE",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#F8FAF9] font-body text-[#111827] antialiased">
        {children}
      </body>
    </html>
  );
}
