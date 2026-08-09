"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ApiError } from "../../api/client"
import { Role, useAuth } from "../../context/AuthContext"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("CLIENT")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(name, email, password, role)
      router.push("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha ao cadastrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container' style={{ maxWidth: 380 }}>
      <h1>Criar conta</h1>
      {error && <div className='error-banner'>{error}</div>}
      <form onSubmit={onSubmit}>
        <div className='field'>
          <label htmlFor='name'>Nome</label>
          <input
            id='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            minLength={6}
          />
        </div>
        <div className='field'>
          <label htmlFor='role'>Papel</label>
          <select
            id='role'
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value='CLIENT'>Cliente</option>
            <option value='ORGANIZER'>Organizador</option>
            <option value='GATE'>Portaria</option>
          </select>
        </div>
        <button className='btn-primary' type='submit' disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
    </div>
  )
}
