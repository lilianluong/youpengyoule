import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "有朋友了",
  description: "找朋友 (Zhao Pengyou / Finding Friends) card game score tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "有朋友了",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
