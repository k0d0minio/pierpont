"use client"

import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic'

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <h1 className="text-xl sm:text-2xl font-semibold">Something went wrong, hi max</h1>
      <p className="text-sm text-zinc-500 mt-2">{error?.message || 'An unexpected error occurred.'}</p>
      <Button variant="destructive" onClick={() => reset?.()}>Try again</Button>
    </div>
  )
}
