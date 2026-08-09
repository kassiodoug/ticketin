"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import { api } from "../api/client"

export type Role = "ORGANIZER" | "CLIENT" | "GATE"
export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthContextValue {
  user: User | null
  ready: boolean // true após ler localStorage no client, evita "flash" de deslogado
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role: Role
  ) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  // localStorage só existe no client — lido em useEffect para não divergir
  // do HTML renderizado no server (evita erro de hydration).
  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) setUser(JSON.parse(stored))
    setReady(true)
  }, [])

  async function login(email: string, password: string) {
    const result = await api.post<{ user: User; token: string }>(
      "/auth/login",
      { email, password }
    )
    localStorage.setItem("token", result.token)
    localStorage.setItem("user", JSON.stringify(result.user))
    setUser(result.user)
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: Role
  ) {
    await api.post("/auth/register", { name, email, password, role })
    await login(email, password)
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>")
  return ctx
}
