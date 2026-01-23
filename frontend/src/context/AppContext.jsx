import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { getStoredUser, getToken, logout as authLogout, validateToken } from '../services/authService'
import { getWallet } from '../services/walletService'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken()
      const storedUser = getStoredUser()

      if (token && storedUser) {
        try {
          // Validate token with backend
          await validateToken()
          setUser(storedUser)
          setIsAuthenticated(true)

          // Fetch wallet data
          if (storedUser.userId) {
            try {
              const walletData = await getWallet(storedUser.userId)
              setWallet(walletData)
            } catch (err) {
              console.error('Failed to fetch wallet:', err)
            }
          }
        } catch (err) {
          // Token invalid, clear it
          console.error('Token validation failed:', err)
          authLogout()
          setUser(null)
          setIsAuthenticated(false)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  // Login handler - called after successful API login
  const login = useCallback(async (userData) => {
    setUser(userData)
    setIsAuthenticated(true)

    // Fetch wallet after login
    if (userData.userId) {
      try {
        const walletData = await getWallet(userData.userId)
        setWallet(walletData)
      } catch (err) {
        console.error('Failed to fetch wallet:', err)
      }
    }
  }, [])

  // Logout handler
  const logout = useCallback(() => {
    authLogout()
    setUser(null)
    setWallet(null)
    setIsAuthenticated(false)
  }, [])

  // Update user info
  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }))
  }, [])

  // Refresh wallet data
  const refreshWallet = useCallback(async () => {
    if (user?.userId) {
      try {
        const walletData = await getWallet(user.userId)
        setWallet(walletData)
        return walletData
      } catch (err) {
        console.error('Failed to refresh wallet:', err)
        throw err
      }
    }
  }, [user?.userId])

  // Check if user is admin (Banker)
  const isAdmin = user?.role === 'ADMIN'

  // Transaction update trigger
  const [txUpdateCounter, setTxUpdateCounter] = useState(0)

  const triggerTxUpdate = useCallback(() => {
    setTxUpdateCounter(prev => prev + 1)
  }, [])

  const value = {
    user,
    wallet,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    logout,
    updateUser,
    refreshWallet,
    txUpdateCounter,
    triggerTxUpdate,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
