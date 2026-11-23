import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "JAGUAR SPK — บัตรสมาชิก",
  description:
    "JAGUAR SPK ที่ 97/56 ซอยบุญศิริ 6 เปิด 24 ชั่วโมง โทร 0996125914 พร้อมบัตรสมาชิกดิจิทัล",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

const supabaseOrigin = (() => {
  try {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!value) return undefined;
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : undefined;
  } catch {
    return undefined;
  }
})();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <head>
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />}
        {supabaseOrigin && <link rel="dns-prefetch" href={supabaseOrigin} />}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
