import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegistration from "@/components/pwa-registration";
import { AdminAuthProvider } from "../lib/AdminAuthProvider";
import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Pierpont Schedule",
    template: "%s | Pierpont Schedule",
  },
  description: "Schedule management system for Pierpont Golf Course reception and restaurant coordination. Streamline communication between golf course operations and Pierpont services.",
  keywords: ["golf course", "schedule manager", "restaurant", "reception", "Pierpont", "coordination"],
  authors: [{ name: "Pierpont Golf Course" }],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "HORECA - Schedule Manager",
    description: "Schedule management system for Pierpont Golf Course reception and restaurant coordination. Streamline communication between golf course operations and HORECA services.",
    url: "/",
    siteName: "HORECA Schedule Manager",
    images: [
      {
        url: "/icon-light.svg",
        width: 512,
        height: 512,
        alt: "HORECA Pierpont Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "HORECA - Schedule Manager",
    description: "Schedule management system for Pierpont Golf Course reception and restaurant coordination."
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00612e" },
    { media: "(prefers-color-scheme: dark)", color: "#00612e" }
  ],
}

export const dynamic = 'force-dynamic'

type RootLayoutProps = {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        {/* iOS PWA meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HORECA Pierpont" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWARegistration />
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </body>
    </html>
  );
}
