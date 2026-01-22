"use client"

import Link from 'next/link'
import { useAdminAuth } from '@/lib/AdminAuthProvider'
import { Button } from '@/components/ui/button'
import { Settings, LogOut } from 'lucide-react'

export function AdminIndicator() {
  const { isAuthenticated, isLoading, signOut } = useAdminAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/admin">
          <Button variant="ghost" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            Administrateur
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <Link href="/admin/settings">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Paramètres"
          aria-label="Paramètres"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        className="h-10 w-10 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="Se déconnecter"
        aria-label="Se déconnecter"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  )
}
