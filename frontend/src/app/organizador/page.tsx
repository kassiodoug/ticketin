"use client";

import { api, ApiError } from "@/api/client";
import CreateEventModal from "@/components/CreateEventModal";
import { RequireRole } from "@/components/RequireRole";
import { ICatalogItem, IOrgEvent } from "@/types";
import { useEffect, useState } from "react";

export default function OrganizerDashboardPage() {
  return (
    <RequireRole role='ORGANIZER'>
      <OrganizerDashboardContent />
    </RequireRole>
  );
}

function OrganizerDashboardContent() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ICatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ICatalogItem | null>(null);
  const [events, setEvents] = useState<IOrgEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [venueName, setVenueName] = useState("");
  const [startsAt, setStartsAt] = useState("");

  function loadMyEvents() {
    api.get<IOrgEvent[]>("/events/mine").then(setEvents);
  }

  useEffect(loadMyEvents, []);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setError(null);
    try {
      const res = await api.get<{ items: ICatalogItem[]; errors: string[] }>(
        `/catalog/search?q=${encodeURIComponent(query)}&source=both`
      );
      setItems(res.items);
      if (res.errors?.length) setError(res.errors.join(" | "));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha na busca");
    } finally {
      setSearching(false);
    }
  }

  function pick(item: ICatalogItem) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSelected(item);
    if (item.suggestedVenue) setVenueName(item.suggestedVenue);
    if (item.suggestedDate) setStartsAt(item.suggestedDate.slice(0, 16));
  }

  const handleCloseModal = () => {
    setSelected(null);
  };

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
        <CreateEventModal
          item={selected}
          loadMyEvents={loadMyEvents}
          startAt={startsAt}
          venueName={venueName}
          onClose={handleCloseModal}
        />
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
  );
}
