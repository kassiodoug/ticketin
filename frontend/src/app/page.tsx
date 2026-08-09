"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api } from "../api/client"

interface EventSummary {
  id: string
  title: string
  venue_name: string
  starts_at: string
  price_cents: number
  image_url?: string
}

export default function Home() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  async function load(query = "") {
    setLoading(true)
    try {
      const data = await api.get<EventSummary[]>(
        `/events${query ? `?q=${encodeURIComponent(query)}` : ""}`
      )
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className='container'>
      <h1>Em cartaz</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          load(q)
        }}
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}
      >
        <input
          placeholder='Buscar por nome do evento...'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className='btn-secondary' type='submit'>
          Buscar
        </button>
      </form>

      {loading && <p style={{ color: "var(--paper-dim)" }}>Carregando...</p>}
      {!loading && events.length === 0 && (
        <div className='empty-state'>Nenhum evento publicado no momento.</div>
      )}

      {events.map((ev) => (
        <Link
          key={ev.id}
          href={`/eventos/${ev.id}`}
          className='stub-card event-card'
        >
          <img
            src={
              ev.image_url ||
              "https://placehold.co/96x96/1c2028/e8a33d?text=%E2%98%85"
            }
            alt=''
          />
          <div>
            <div className='eyebrow'>
              {new Date(ev.starts_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </div>
            <h3>{ev.title}</h3>
            <div className='meta'>
              {ev.venue_name} · R$ {(ev.price_cents / 100).toFixed(2)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
