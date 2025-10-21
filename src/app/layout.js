import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegistration from "../../components/pwa-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "HORECA - Schedule Manager",
    template: "%s | HORECA Pierpont",
  },
  description: "Schedule management system for Pierpont Golf Course reception and restaurant coordination. Streamline communication between golf course operations and HORECA services.",
  keywords: ["golf course", "schedule manager", "restaurant", "reception", "HORECA", "Pierpont", "coordination"],
  authors: [{ name: "Pierpont Golf Course" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%2300612e' rx='4'/><text x='16' y='22' font-family='Arial,sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='white'>P</text></svg>",
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%2300612e' rx='4'/><text x='16' y='22' font-family='Arial,sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='white'>P</text></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%2300612e' rx='4'/><text x='16' y='22' font-family='Arial,sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='white'>P</text></svg>",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00612e" },
    { media: "(prefers-color-scheme: dark)", color: "#00612e" }
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%2300612e' rx='4'/><text x='16' y='22' font-family='Arial,sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='white'>P</text></svg>" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
