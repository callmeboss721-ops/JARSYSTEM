import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bai_Jamjuree, IBM_Plex_Sans_Thai, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./brand-id-2026.css";
import { Providers } from "./providers";
import { tokens } from "@workspace/jaguar-spk-design-system";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jaguar-krathm-kaychaa.replit.app";

const baiJamjuree = Bai_Jamjuree({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bai-jamjuree",
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-ibm-plex-thai",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  manifest: "/manifest.webmanifest",
  title: {
    default: "JAGUAR SPK — บัตรสมาชิกดิจิทัล | 97/56 ซอยบุญศิริ 6",
    template: "%s | JAGUAR SPK",
  },
  description:
    "JAGUAR SPK ที่ 97/56 ซอยบุญศิริ 6 สมุทรปราการ เปิด 24 ชั่วโมง โทร 0996125914 พร้อมบัตรสมาชิกดิจิทัลสะสมแต้มบนมือถือ",
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "JAGUAR SPK — บัตรสมาชิกดิจิทัล",
    description:
      "JAGUAR SPK ที่ 97/56 ซอยบุญศิริ 6 เปิด 24 ชั่วโมง โทร 0996125914 พร้อมบัตรสมาชิกดิจิทัล",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "/brand/og-share-2026.jpg",
        width: 1200,
        height: 630,
        alt: "JAGUAR SPK — บัตรสมาชิกดิจิทัล",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JAGUAR SPK — บัตรสมาชิกดิจิทัล",
    description:
      "JAGUAR SPK ที่ 97/56 ซอยบุญศิริ 6 เปิด 24 ชั่วโมง โทร 0996125914 พร้อมบัตรสมาชิกดิจิทัล",
    images: ["/brand/og-share-2026.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: tokens.color.brandId2026.background,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="th"
      className={`dark ${baiJamjuree.variable} ${ibmPlexSansThai.variable} ${jetbrainsMono.variable}`}
      data-brand-theme="2026"
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
