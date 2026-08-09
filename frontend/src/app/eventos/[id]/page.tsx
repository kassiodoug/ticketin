"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

interface Seat {
  id: string;
  row_label: string;
  col_number: number;
  status: "AVAILABLE" | "HELD" | "SOLD";
}
interface EventDetailData {
  id: string;
  title: string;
  description?: string;
  venue_name: string;
  starts_at: string;
  price_cents: number;
  seat_rows: number;
  seat_cols: number;
  seats: Seat[];
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<EventDetailData>(`/events/${id}`)
      .then(setEvent)
      .catch(() => setError("evento não encontrado"));
  }, [id]);

  if (error)
    return (
      <div className='container'>
        <div className='error-banner'>{error}</div>
      </div>
    );
  if (!event) return <div className='container'>Carregando...</div>;

  const rows = Array.from(new Set(event.seats.map((s) => s.row_label))).sort();

  function toggleSeat(seat: Seat) {
    if (seat.status !== "AVAILABLE") return;
    setSelected((prev) =>
      prev.includes(seat.id)
        ? prev.filter((sid) => sid !== seat.id)
        : [...prev, seat.id]
    );
  }

  async function reserve() {
    if (!user) return router.push("/login");
    if (user.role !== "CLIENT") {
      setError("apenas contas de cliente podem reservar ingressos");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const reservation = await api.post<{ id: string }>("/reservations", {
        eventId: event?.id,
        seatIds: selected,
      });
      router.push(`/checkout/${reservation.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha ao reservar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='container'>
      <div className='eyebrow' style={{ color: "var(--marquee)" }}>
        {new Date(event.starts_at).toLocaleString("pt-BR", {
          dateStyle: "full",
          timeStyle: "short",
        })}
      </div>
      <h1>{event.title}</h1>
      <p style={{ color: "var(--paper-dim)" }}>{event.venue_name}</p>
      {event.description && <p>{event.description}</p>}

      <h2 style={{ marginTop: "2rem", fontSize: "1rem" }}>
        Escolha seu(s) lugar(es)
      </h2>
      <div className='seat-map'>
        {rows.map((row) => (
          <div className='seat-row' key={row}>
            <span className='row-label'>{row}</span>
            {event.seats
              .filter((s) => s.row_label === row)
              .sort((a, b) => a.col_number - b.col_number)
              .map((seat) => (
                <button
                  key={seat.id}
                  type='button'
                  className='seat'
                  data-status={seat.status}
                  data-selected={selected.includes(seat.id)}
                  disabled={seat.status !== "AVAILABLE"}
                  onClick={() => toggleSeat(seat)}
                  title={`${row}${seat.col_number} — ${seat.status}`}
                >
                  {seat.col_number}
                </button>
              ))}
          </div>
        ))}
      </div>

      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--paper-dim)",
          marginTop: "0.5rem",
        }}
      >
        ■ disponível &nbsp; ▪ ocupado/reservado &nbsp; ★ selecionado
      </p>

      {error && <div className='error-banner'>{error}</div>}

      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <strong>
          {selected.length} lugar(es) — R${" "}
          {((event.price_cents * selected.length) / 100).toFixed(2)}
        </strong>
        <button
          className='btn-primary'
          disabled={selected.length === 0 || submitting}
          onClick={reserve}
        >
          {submitting ? "Reservando..." : "Reservar e ir para pagamento"}
        </button>
      </div>
    </div>
  );
}
