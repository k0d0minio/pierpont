"use client"
import { createContext, useContext, useState, useEffect } from 'react'

export const AdminAuthContext = createContext()
export const useAdminAuth = () => useContext(AdminAuthContext)

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check localStorage (client-side only)
    const authStatus = localStorage.getItem('admin_authenticated')
    const authTimestamp = localStorage.getItem('admin_auth_timestamp')
    
    if (authStatus === 'true' && authTimestamp) {
      const now = Date.now()
      const authTime = parseInt(authTimestamp)
      const hoursSinceAuth = (now - authTime) / (1000 * 60 * 60)
      
      if (hoursSinceAuth < 24) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('admin_authenticated')
        localStorage.removeItem('admin_auth_timestamp')
      }
    }
    
    setIsLoading(false)
  }, [])
  
  const signOut = () => {
    localStorage.removeItem('admin_authenticated')
    localStorage.removeItem('admin_auth_timestamp')
    document.cookie = 'pierpont_edit_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setIsAuthenticated(false)
  }
  
  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
