"use client"
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { checkAuthStatus, enableEditMode, disableEditMode } from '../app/actions/auth'

export const AdminAuthContext = createContext()
export const useAdminAuth = () => useContext(AdminAuthContext)

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  /**
   * Sync authentication state with server
   * @param {boolean} isInitialSync - Whether this is the initial sync on mount
   */
  const syncAuthState = useCallback(async (isInitialSync = false) => {
    try {
      const result = await checkAuthStatus()
      if (result.ok) {
        setIsAuthenticated(result.authenticated)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("Error syncing auth state:", error)
      setIsAuthenticated(false)
    } finally {
      if (isInitialSync) {
        setIsLoading(false)
        setHasInitialized(true)
      }
    }
  }, [])
  
  /**
   * Sign in with password
   * @param {string} password - The admin password
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  const signIn = useCallback(async (password) => {
    try {
      const formData = new FormData()
      formData.append('code', password)
      
      const result = await enableEditMode(formData)
      
      if (result.ok) {
        // Sync state after successful login
        await syncAuthState(false)
        return { ok: true }
      } else {
        return { ok: false, error: result.error || "Authentication failed" }
      }
    } catch (error) {
      console.error("Error signing in:", error)
      return { ok: false, error: "Failed to sign in" }
    }
  }, [syncAuthState])
  
  /**
   * Sign out and clear authentication
   */
  const signOut = useCallback(async () => {
    try {
      const result = await disableEditMode()
      if (result.ok) {
        setIsAuthenticated(false)
      } else {
        console.error("Error signing out:", result.error)
        // Still update local state even if server action fails
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("Error signing out:", error)
      // Still update local state even if server action fails
      setIsAuthenticated(false)
    }
  }, [])
  
  // Initial sync on mount
  useEffect(() => {
    syncAuthState(true)
  }, [syncAuthState])
  
  // Periodic sync to keep state in sync with server (every 5 minutes)
  useEffect(() => {
    if (hasInitialized) {
      const interval = setInterval(() => {
        syncAuthState(false)
      }, 5 * 60 * 1000) // 5 minutes
      
      return () => clearInterval(interval)
    }
  }, [hasInitialized, syncAuthState])
  
  return (
    <AdminAuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      signIn,
      signOut,
      syncAuthState 
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
