import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://store.clutchsmp.net"),
  title: {
    default: "ClutchSMP Store | Premium Minecraft Network Store",
    template: "%s | ClutchSMP Store",
  },
  description:
    "Premium futuristic Minecraft server store for ClutchSMP ranks, coins, crate keys, items, vote rewards, and player support.",
  keywords: [
    "ClutchSMP",
    "Minecraft server store",
    "Minecraft ranks",
    "Minecraft coins",
    "Minecraft crates",
    "premium Minecraft network",
  ],
  openGraph: {
    title: "ClutchSMP Store",
    description:
      "A premium futuristic Minecraft network storefront with instant delivery, ranks, coins, crate keys, and survival items.",
    images: ["/images/clutchsmp-cinematic-hub.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#02030a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}>
      <body className="min-h-full font-sans antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
