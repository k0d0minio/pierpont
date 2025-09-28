import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "Pierpont Assistant",
    template: "%s | Pierpont Assistant",
  },
  description: "Your assistant for Pierpont. Chat, plan, and manage tasks.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Pierpont Assistant",
    description: "Your assistant for Pierpont. Chat, plan, and manage tasks.",
    url: "/",
    siteName: "Pierpont Assistant",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Pierpont Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pierpont Assistant",
    description: "Your assistant for Pierpont. Chat, plan, and manage tasks.",
    images: ["/icon.svg"],
  },
};

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var storageKey = 'theme';
                  var stored = localStorage.getItem(storageKey);
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = stored ? stored === 'dark' : prefersDark;
                  var root = document.documentElement;
                  if (isDark) { root.classList.add('dark'); root.classList.remove('light'); }
                  else { root.classList.add('light'); root.classList.remove('dark'); }
                } catch (_) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
