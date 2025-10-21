"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../../components/button.jsx'
import { Input } from '../../../components/input.jsx'
import { Heading } from '../../../components/heading.jsx'
import { Logo } from '../../../components/logo.jsx'

// Use the existing environment variable for the password
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_EDIT_CODE || "horeca2024"


export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    const isAuthenticated = localStorage.getItem('admin_authenticated')
    if (isAuthenticated === 'true') {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    if (password === ADMIN_PASSWORD) {
      // Store authentication in localStorage
      localStorage.setItem('admin_authenticated', 'true')
      localStorage.setItem('admin_auth_timestamp', Date.now().toString())
      
      // Also set the cookie for server-side authentication
      document.cookie = 'pierpont_edit_mode=1; path=/; sameSite=lax'
      
      // Redirect to home page
      router.push('/')
    } else {
      setError('Invalid password')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-4" />
          <Heading level={1} className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Admin Access
          </Heading>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter the admin password to access editing features
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Password
            </label>
            <Input
              id="password"
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
            className="w-full"
            color="emerald"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <Button
            plain
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
