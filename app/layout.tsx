import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flex Crew OS — candidate prototype",
  description:
    "Supply lifecycle platform — one reliability engine powers worker career, AI coach, and marketplace intelligence. Candidate prototype — not an official Flex product.",
  icons: { icon: [{ url: "/logo-flex.png", type: "image/png" }] },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f8f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`} style={{ colorScheme: "light" }}>
      <body className="h-full overflow-hidden font-sans antialiased">{children}</body>
    </html>
  );
}
