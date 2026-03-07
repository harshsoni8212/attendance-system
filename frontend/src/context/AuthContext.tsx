import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

type User = {
  id: number
  name: string
  email: string
  role: string
  class?: string
  badge_id?: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  role: string | null
  login: (userData: User, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem("user") || "null")
  )

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  )

  const [role, setRole] = useState<string | null>(
    localStorage.getItem("role")
  )

  const login = (userData: User, token: string) => {
    setUser(userData)
    setToken(token)
    setRole(userData.role)

    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", token)
    localStorage.setItem("role", userData.role)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setRole(null)

    localStorage.removeItem("user")
    localStorage.removeItem("token")
    localStorage.removeItem("role")
  }

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}