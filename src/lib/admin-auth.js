"use client"

import { useState, useEffect } from 'react'

// Admin authentication utilities
export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for admin authentication
    const authStatus = localStorage.getItem('admin_authenticated')
    const authTimestamp = localStorage.getItem('admin_auth_timestamp')
    
    if (authStatus === 'true' && authTimestamp) {
      // Check if authentication is still valid (24 hours)
      const now = Date.now()
      const authTime = parseInt(authTimestamp)
      const hoursSinceAuth = (now - authTime) / (1000 * 60 * 60)
      
      if (hoursSinceAuth < 24) {
        setIsAuthenticated(true)
      } else {
        // Clear expired authentication
        localStorage.removeItem('admin_authenticated')
        localStorage.removeItem('admin_auth_timestamp')
        setIsAuthenticated(false)
      }
    } else {
      setIsAuthenticated(false)
    }
    
    setIsLoading(false)
  }, [])

  const signOut = () => {
    localStorage.removeItem('admin_authenticated')
    localStorage.removeItem('admin_auth_timestamp')
    // Also clear the server-side cookie
    document.cookie = 'pierpont_edit_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setIsAuthenticated(false)
  }

  return { isAuthenticated, isLoading, signOut }
}

// Server-side compatible function for checking admin status
export function isAdminAuthenticated() {
  if (typeof window === 'undefined') {
    // Server-side: always return false, will be checked client-side
    return false
  }
  
  const authStatus = localStorage.getItem('admin_authenticated')
  const authTimestamp = localStorage.getItem('admin_auth_timestamp')
  
  if (authStatus === 'true' && authTimestamp) {
    const now = Date.now()
    const authTime = parseInt(authTimestamp)
    const hoursSinceAuth = (now - authTime) / (1000 * 60 * 60)
    
    return hoursSinceAuth < 24
  }
  
  return false
}
