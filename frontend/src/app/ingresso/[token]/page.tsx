"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "../../../api/client"

interface SharedTicket {
  id: string
  status: "VALID" | "USED" | "CANCELED"
  event_title: string
  starts_at: string
  venue_name: string
  row_label: string
  col_number: number
  used_at?: string
}

// Rota pública — quem recebe o link não precisa estar logado. Mostra o
// status do ingresso, mas nunca o código assinado (isso ficaria exposto
// pra qualquer um com o link, o que anularia a proteção da portaria).
export default function TicketSharePage() {
  const { token } = useParams<{ token: string }>()
  const [ticket, setTicket] = useState<SharedTicket | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<SharedTicket>(`/tickets/share/${token}`)
      .then(setTicket)
      .catch(() => setError("link inválido ou expirado"))
  }, [token])

  if (error)
    return (
      <div className='container'>
        <div className='error-banner'>{error}</div>
      </div>
    )
  if (!ticket) return <div className='container'>Carregando...</div>

  return (
    <div className='container' style={{ maxWidth: 420 }}>
      <div className='stub-card' style={{ padding: "1.5rem" }}>
        <span
          className={`status-pill ${ticket.status === "VALID" ? "valid" : ticket.status === "USED" ? "used" : "invalid"}`}
        >
          {ticket.status === "VALID"
            ? "Válido"
            : ticket.status === "USED"
              ? "Já utilizado"
              : "Cancelado"}
        </span>
        <h1 style={{ marginTop: "0.75rem" }}>{ticket.event_title}</h1>
        <p style={{ color: "var(--paper-dim)" }}>
          {new Date(ticket.starts_at).toLocaleString("pt-BR", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        <p style={{ color: "var(--paper-dim)" }}>
          {ticket.venue_name} — Assento {ticket.row_label}
          {ticket.col_number}
        </p>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--paper-dim)",
            marginTop: "1rem",
          }}
        >
          Este é um link de visualização. O código de entrada (QR) só aparece
          para o dono do ingresso, em "Meus ingressos".
        </p>
      </div>
    </div>
  )
}
