"use client"

export const dynamic = 'force-dynamic'

export default function Error({ error, reset }) {
  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <h1 className="text-xl sm:text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-zinc-500 mt-2">{error?.message || 'An unexpected error occurred.'}</p>
      <button className="mt-4 underline" onClick={() => reset?.()}>Try again</button>
    </div>
  )
}


