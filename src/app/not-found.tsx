import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function NotFound() {
  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <h1 className="text-xl sm:text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-zinc-500 mt-2">The page you are looking for does not exist.</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
