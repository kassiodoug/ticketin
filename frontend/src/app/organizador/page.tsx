"use client"

import { useEffect, useState } from "react"
import { api, ApiError } from "../../api/client"
import { RequireRole } from "../../components/RequireRole"

interface CatalogItem {
  externalId: string
  source: "TICKETMASTER" | "TMDB"
  title: string
  imageUrl?: string
  suggestedVenue?: string
  suggestedDate?: string
}
interface OrgEvent {
  id: string
  title: string
  starts_at: string
  capacity: number
  published: boolean
}

export default function OrganizerDashboardPage() {
  return (
    <RequireRole role='ORGANIZER'>
      <OrganizerDashboardContent />
    </RequireRole>
  )
}

function OrganizerDashboardContent() {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<CatalogItem[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [events, setEvents] = useState<OrgEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  const [venueName, setVenueName] = useState("")
  const [venueAddress, setVenueAddress] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [price, setPrice] = useState("")
  const [seatRows, setSeatRows] = useState(5)
  const [seatCols, setSeatCols] = useState(8)
  const [creating, setCreating] = useState(false)

  function loadMyEvents() {
    api.get<OrgEvent[]>("/events/mine").then(setEvents)
  }
  useEffect(loadMyEvents, [])

  async function search(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setError(null)
    try {
      const res = await api.get<{ items: CatalogItem[]; errors: string[] }>(
        `/catalog/search?q=${encodeURIComponent(query)}&source=both`
      )
      setItems(res.items)
      if (res.errors?.length) setError(res.errors.join(" | "))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha na busca")
    } finally {
      setSearching(false)
    }
  }

  function pick(item: CatalogItem) {
    setSelected(item)
    if (item.suggestedVenue) setVenueName(item.suggestedVenue)
    if (item.suggestedDate) setStartsAt(item.suggestedDate.slice(0, 16))
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setCreating(true)
    setError(null)
    try {
      const capacity = seatRows * seatCols
      await api.post("/events", {
        source: selected.source,
        externalId: selected.externalId,
        title: selected.title,
        imageUrl: selected.imageUrl,
        venueName,
        venueAddress,
        startsAt: new Date(startsAt).toISOString(),
        priceCents: Math.round(parseFloat(price) * 100),
        capacity,
        seatRows,
        seatCols,
      })
      setSelected(null)
      setVenueName("")
      setVenueAddress("")
      setStartsAt("")
      setPrice("")
      loadMyEvents()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha ao criar evento")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className='container'>
      <h1>Painel do organizador</h1>
      {error && <div className='error-banner'>{error}</div>}

      <h2 style={{ fontSize: "1rem" }}>
        1. Buscar no catálogo (Ticketmaster + TMDb)
      </h2>
      <form
        onSubmit={search}
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
      >
        <input
          placeholder='Nome do show ou filme...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className='btn-secondary' type='submit' disabled={searching}>
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {items.length > 0 && (
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "2rem" }}>
          {items.map((item) => (
            <button
              key={`${item.source}-${item.externalId}`}
              type='button'
              className='stub-card'
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "0.75rem",
                textAlign: "left",
                alignItems: "center",
              }}
              onClick={() => pick(item)}
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=''
                  width={48}
                  height={48}
                  style={{ objectFit: "cover", borderRadius: 4 }}
                />
              )}
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--marquee)" }}>
                  {item.source}
                </div>
                <div>{item.title}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          <h2 style={{ fontSize: "1rem" }}>
            2. Configurar evento: {selected.title}
          </h2>
          <form
            onSubmit={createEvent}
            className='stub-card'
            style={{ padding: "1.25rem", maxWidth: 420 }}
          >
            <div className='field'>
              <label>Local</label>
              <input
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
              />
            </div>
            <div className='field'>
              <label>Endereço</label>
              <input
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
              />
            </div>
            <div className='field'>
              <label>Data e hora</label>
              <input
                type='datetime-local'
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className='field'>
              <label>Preço por ingresso (R$)</label>
              <input
                type='number'
                step='0.01'
                min='0'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div className='field' style={{ flex: 1 }}>
                <label>Fileiras</label>
                <input
                  type='number'
                  min={1}
                  max={26}
                  value={seatRows}
                  onChange={(e) => setSeatRows(Number(e.target.value))}
                />
              </div>
              <div className='field' style={{ flex: 1 }}>
                <label>Assentos por fileira</label>
                <input
                  type='number'
                  min={1}
                  max={30}
                  value={seatCols}
                  onChange={(e) => setSeatCols(Number(e.target.value))}
                />
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--paper-dim)" }}>
              Capacidade total: {seatRows * seatCols} assentos
            </p>
            <button className='btn-primary' type='submit' disabled={creating}>
              {creating ? "Publicando..." : "Publicar evento"}
            </button>
          </form>
        </>
      )}

      <h2 style={{ fontSize: "1rem", marginTop: "2.5rem" }}>Meus eventos</h2>
      {events.length === 0 && (
        <p style={{ color: "var(--paper-dim)" }}>Nenhum evento criado ainda.</p>
      )}
      {events.map((ev) => (
        <div
          key={ev.id}
          className='stub-card'
          style={{
            padding: "1rem",
            marginBottom: "0.5rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{ev.title}</span>
          <span style={{ color: "var(--paper-dim)", fontSize: "0.85rem" }}>
            {new Date(ev.starts_at).toLocaleDateString("pt-BR")} · {ev.capacity}{" "}
            lugares
          </span>
        </div>
      ))}
    </div>
  )
}
