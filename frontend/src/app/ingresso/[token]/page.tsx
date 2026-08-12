"use client";

import { api } from "@/api/client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface SharedTicket {
  id: string;
  status: "VALID" | "USED" | "CANCELED";
  event_title: string;
  starts_at: string;
  venue_name: string;
  row_label: string;
  col_number: number;
  used_at?: string;
}

export default function TicketSharePage() {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<SharedTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrByTicket, setQrByTicket] = useState<string>("");

  useEffect(() => {
    api
      .get<SharedTicket>(`/tickets/share/${token}`)
      .then(setTicket)
      .catch(() => setError("link inválido ou expirado"));
  }, [token]);

  async function loadQr(ticketId: string) {
    if (qrByTicket) return;

    const { dataUrl } = await api.get<{ dataUrl: string }>(
      `/tickets/${ticketId}/qrcode`
    );

    setQrByTicket(dataUrl);
  }

  if (error)
    return (
      <div className='container'>
        <div className='error-banner'>{error}</div>
      </div>
    );

  if (!ticket) return <div className='container'>Carregando...</div>;

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
          Mostre o código QR ou informe o código alfanumérico de 9 dígitos na
          portaria.
        </p>

        {qrByTicket ? (
          <img
            src={qrByTicket}
            alt='QR do ingresso'
            width={240}
            height={240}
            style={{ borderRadius: 4 }}
          />
        ) : (
          <button className='btn-secondary' onClick={() => loadQr(ticket.id)}>
            Mostrar QR
          </button>
        )}
      </div>
    </div>
  );
}
