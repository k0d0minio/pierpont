"use client"
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { checkAuthStatus, enableEditMode, disableEditMode } from '../app/actions/auth'

type AdminAuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (password: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
  syncAuthState: (isInitialSync?: boolean) => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

type AdminAuthProviderProps = {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  /**
   * Sync authentication state with server
   * @param isInitialSync - Whether this is the initial sync on mount
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
   * @param password - The admin password
   * @returns Promise with ok status and optional error
   */
  const signIn = useCallback(async (password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const formData = new FormData()
      formData.append('code', password)
      
      const result = await enableEditMode(formData)
      
      if (result.ok) {
        // Sync state after successful login
        await syncAuthState(false)
        return { ok: true }
      } else {
        return { ok: false, error: result.error || "Échec de l'authentification" }
      }
    } catch (error) {
      console.error("Error signing in:", error)
      return { ok: false, error: "Échec de la connexion" }
    }
  }, [syncAuthState])
  
  /**
   * Sign out and clear authentication
   */
  const signOut = useCallback(async (): Promise<void> => {
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
