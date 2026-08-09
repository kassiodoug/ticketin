"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ApiError } from "../../api/client"
import { useAuth } from "../../context/AuthContext"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      router.push("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha ao entrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container' style={{ maxWidth: 380 }}>
      <h1>Entrar</h1>
      {error && <div className='error-banner'>{error}</div>}
      <form onSubmit={onSubmit}>
        <div className='field'>
          <label htmlFor='email'>E-mail</label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className='field'>
          <label htmlFor='password'>Senha</label>
          <input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className='btn-primary' type='submit' disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "0.85rem",
          color: "var(--paper-dim)",
        }}
      >
        Não tem conta? <Link href='/registrar'>Criar conta</Link>
      </p>
      <p style={{ fontSize: "0.8rem", color: "var(--paper-dim)" }}>
        Usuários de teste (seed): organizador@evento.test, cliente1@evento.test,
        cliente2@evento.test, portaria@evento.test — senha: senha123
      </p>
    </div>
  )
}
