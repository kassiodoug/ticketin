import { api, ApiError } from "@/api/client";
import { TCreateEventModal } from "@/types";
import { useState } from "react";

export default function CreateEventModal({
  item,
  loadMyEvents,
  ...props
}: TCreateEventModal) {
  const [venueAddress, setVenueAddress] = useState("");
  const [price, setPrice] = useState("");
  const [seatRows, setSeatRows] = useState(5);
  const [seatCols, setSeatCols] = useState(8);
  const [creating, setCreating] = useState(false);
  const [venueName, setVenueName] = useState(props.venueName);
  const [startsAt, setStartsAt] = useState(props.startAt);
  const [error, setError] = useState<string | null>(null);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setCreating(true);
    setError(null);

    try {
      const capacity = seatRows * seatCols;

      await api.post("/events", {
        source: item.source,
        externalId: item.externalId,
        title: item.title,
        imageUrl: item.imageUrl,
        venueName: venueName,
        venueAddress,
        startsAt: new Date(startsAt).toISOString(),
        priceCents: Math.round(parseFloat(price) * 100),
        capacity,
        seatRows,
        seatCols,
      });

      props.onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha ao criar evento");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className='container-modal'>
      <h2 style={{ fontSize: "1rem" }}>2. Configurar evento: {item.title}</h2>
      <form
        onSubmit={createEvent}
        className='stub-card form-create-event'
        style={{ padding: "1.25rem", maxWidth: 420 }}
      >
        <div className='btn-close-modal' onClick={props.onClose}>
          X
        </div>
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
        <button
          className='btn-primary w-full'
          type='submit'
          disabled={creating}
        >
          {creating ? "Publicando..." : "Publicar evento"}
        </button>

        {error && <div className='error-banner'>{error}</div>}
      </form>
    </div>
  );
}
