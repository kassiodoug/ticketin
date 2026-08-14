"use client";

import { api } from "@/api/client";
import { RequireRole } from "@/components/RequireRole";
import { EventSummary } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function GateScannerPage() {
  return (
    <RequireRole role='GATE'>
      <ListEventsGate />
    </RequireRole>
  );
}

function ListEventsGate() {
  const [events, setEvents] = useState<EventSummary[]>();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(query = "") {
    setLoading(true);
    try {
      const data = await api.get<EventSummary[]>(
        `/events${query ? `?q=${encodeURIComponent(query)}` : ""}`
      );
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className='container'>
      {loading && <p style={{ color: "var(--paper-dim)" }}>Carregando...</p>}
      {!loading && events?.length === 0 && (
        <div className='empty-state'>Nenhum evento publicado no momento.</div>
      )}

      {events?.map((ev) => (
        <Link
          key={ev.id}
          href={`/portaria/evento/${ev.id}`}
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
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
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
  );
}
