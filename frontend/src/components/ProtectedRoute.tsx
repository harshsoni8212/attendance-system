import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import type { PropsWithChildren } from "react"

type ProtectedRouteProps = PropsWithChildren<{
  allowedRole?: string
}>

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {

  const { user, token } = useAuth()

  // 🔐 Not logged in
  if (!token) {
    return <Navigate to="/" replace />
  }

  // 🧠 Context still loading after refresh
  if (!user) {
    return null
  }

  // 🚫 Wrong role
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}