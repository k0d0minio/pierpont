"use client"

import { useState, useEffect, useId } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { useAdminAuth } from '../../lib/AdminAuthProvider'

export default function AdminLogin() {
  const passwordId = useId()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, signIn } = useAdminAuth()

  useEffect(() => {
    // Check if already authenticated
    if (!authLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn(password)
      
      if (result.ok) {
        // Redirect to home page after successful login
        router.push('/')
        router.refresh() // Refresh to ensure server state is updated
      } else {
        setError(result.error || 'Invalid password')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during sign in. Please try again.')
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Admin Access
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter the admin password to access editing features
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor={passwordId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Password
            </label>
            <Input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="w-full"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ← Back to Week View
          </Button>
        </div>
      </div>
    </div>
  )
}
