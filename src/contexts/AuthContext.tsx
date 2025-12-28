import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '../utils/api'

interface User {
  id: string
  email: string
  role: 'ADMIN' | 'TEACHER'
  teacherProfile?: {
    id: string
    name: string
    department: string
    position: string
    phone?: string
    profilePicture?: string
    status: string
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      apiClient.setToken(token)
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const userData = await apiClient.get<User>('/auth/me')
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/auth/login', {
        email,
        password,
      })
      setToken(response.token)
      setUser(response.user)
      apiClient.setToken(response.token)
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    apiClient.setToken(null)
  }

  const setTokenValue = (newToken: string | null) => {
    setToken(newToken)
    if (newToken) {
      localStorage.setItem('token', newToken)
      apiClient.setToken(newToken)
    } else {
      localStorage.removeItem('token')
      apiClient.setToken(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        setUser,
        setToken: setTokenValue,
        isLoading,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

