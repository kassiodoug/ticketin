"use client";

import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { RequireRole } from "../../components/RequireRole";

interface Ticket {
  id: string;
  status: "VALID" | "USED" | "CANCELED";
  share_token: string;
  event_title: string;
  starts_at: string;
  venue_name: string;
  row_label: string;
  col_number: number;
}

export default function MyTicketsPage() {
  return (
    <RequireRole role='CLIENT'>
      <MyTicketsContent />
    </RequireRole>
  );
}

function MyTicketsContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [qrByTicket, setQrByTicket] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Ticket[]>("/tickets/mine").then(setTickets);
  }, []);

  async function loadQr(ticketId: string) {
    if (qrByTicket[ticketId]) return;
    const { dataUrl } = await api.get<{ dataUrl: string }>(
      `/tickets/${ticketId}/qrcode`
    );
    setQrByTicket((prev) => ({ ...prev, [ticketId]: dataUrl }));
  }

  function copyShareLink(ticket: Ticket) {
    const url = `${window.location.origin}/ingresso/${ticket.share_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(ticket.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className='container'>
      <h1>Meus ingressos</h1>
      {tickets.length === 0 && (
        <div className='empty-state'>Você ainda não tem ingressos.</div>
      )}

      {tickets.map((t) => (
        <div
          key={t.id}
          className='stub-card'
          style={{ marginBottom: "1.5rem" }}
        >
          <div style={{ padding: "1.25rem" }}>
            <span
              className={`status-pill ${t.status === "VALID" ? "valid" : t.status === "USED" ? "used" : "invalid"}`}
            >
              {t.status === "VALID"
                ? "Válido"
                : t.status === "USED"
                  ? "Utilizado"
                  : "Cancelado"}
            </span>
            <h3 style={{ marginTop: "0.5rem" }}>{t.event_title}</h3>
            <p style={{ color: "var(--paper-dim)", margin: 0 }}>
              {new Date(t.starts_at).toLocaleString("pt-BR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
            <p style={{ color: "var(--paper-dim)" }}>
              {t.venue_name} — Assento {t.row_label}
              {t.col_number}
            </p>
          </div>
          <div className='stub-tear' />
          <div
            style={{
              padding: "1.25rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {qrByTicket[t.id] ? (
              <img
                src={qrByTicket[t.id]}
                alt='QR do ingresso'
                width={120}
                height={120}
                style={{ borderRadius: 4 }}
              />
            ) : (
              <button className='btn-secondary' onClick={() => loadQr(t.id)}>
                Mostrar QR
              </button>
            )}
            <button className='btn-secondary' onClick={() => copyShareLink(t)}>
              {copiedId === t.id
                ? "Link copiado!"
                : "Copiar link para compartilhar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
