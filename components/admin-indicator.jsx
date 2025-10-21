"use client"

import { useAdminAuth } from '../src/lib/admin-auth'
import { Button } from './button'
import { Link } from './link'

export function AdminIndicator() {
  const { isAuthenticated, isLoading, signOut } = useAdminAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <Link href="/admin">
        <Button plain className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          Admin
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        Admin Mode
      </span>
      <Button
        plain
        onClick={signOut}
        className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
      >
        Sign Out
      </Button>
    </div>
  )
}
