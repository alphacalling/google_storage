"use client"

import type { ReactNode } from "react"
import { useAuth } from "./auth-provider"
import { LoginView } from "./login-view"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginView />
  }

  return <>{children}</>
}
