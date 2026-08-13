"use client";

import { api, ApiError } from "@/api/client";
import { IEventPageProps, IOrgEventUpdate } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EventPage({}: IEventPageProps) {
  const { eventId } = useParams();
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [event, setEvent] = useState<IOrgEventUpdate>({
    id: "",
    title: "",
    venue_name: "",
    venue_address: "",
    starts_at: "",
    price_cents: 0,
    seat_rows: 1,
    seat_cols: 1,
    published: false,
  });

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;
    const numberFields = ["seat_rows", "seat_cols", "price_cents"];

    let parsedValue = numberFields.includes(name) ? Number(value) : value;

    setEvent((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleChangeCheckbox = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const checked = ev.target.checked;

    setEvent((prev) => ({ ...prev, published: checked }));
  };

  async function updateEvent(e: React.FormEvent) {
    e.preventDefault();

    setUpdating(true);
    setError(null);

    try {
      const capacity = event.seat_rows * event.seat_cols;

      await api.patch(`/events/update/${event.id}`, {
        ...event,
        starts_at: new Date(event.starts_at).toISOString(),
        price_cents: Math.round(event.price_cents * 100),
        capacity,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha ao criar evento");
    } finally {
      setUpdating(false);
    }
  }

  async function loadMyEvent() {
    const eventResult = await api.get<IOrgEventUpdate>(`/events/${eventId}`);

    setEvent({ ...eventResult, price_cents: eventResult.price_cents / 100 });
  }

  useEffect(() => {
    loadMyEvent();
  }, []);

  return (
    <div className='container-modal'>
      <h2 style={{ fontSize: "1rem" }}>2. Configurar evento: {event?.title}</h2>
      <form
        onSubmit={updateEvent}
        className='stub-card form-create-event'
        style={{ padding: "1.25rem", maxWidth: 420 }}
      >
        <div className='field'>
          <label>Local</label>
          <input
            value={event?.venue_name}
            name='venue_name'
            onChange={(ev) => handleChange(ev)}
            required
          />
        </div>
        <div className='field'>
          <label>Endereço</label>
          <input
            value={event.venue_address}
            name='venue_address'
            onChange={handleChange}
          />
        </div>
        <div className='field'>
          <label>Data e hora</label>
          <input
            type='datetime-local'
            name='starts_at'
            value={event.starts_at.slice(0, 16)}
            onChange={handleChange}
            required
          />
        </div>
        <div className='field'>
          <label>Preço por ingresso (R$)</label>
          <input
            type='number'
            name='price_cents'
            step='0.01'
            min='0'
            value={event.price_cents}
            onChange={handleChange}
            required
          />
        </div>
        <div className='container-checkobx-published'>
          <input
            type='checkbox'
            checked={event.published}
            onChange={handleChangeCheckbox}
            name='published'
            id='published'
          />
          <label htmlFor='published'>Publicado</label>
        </div>
        {/* <div style={{ display: "flex", gap: "1rem" }}>
          <div className='field' style={{ flex: 1 }}>
            <label>Fileiras</label>
            <input
              type='number'
              name='seat_rows'
              min={1}
              max={26}
              value={event.seat_rows}
              onChange={handleChange}
            />
          </div>
          <div className='field' style={{ flex: 1 }}>
            <label>Assentos por fileira</label>
            <input
              type='number'
              name='seat_cols'
              min={1}
              max={30}
              value={event.seat_cols}
              onChange={handleChange}
            />
          </div>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--paper-dim)" }}>
          Capacidade total: {event.seat_rows * event.seat_cols} assentos
        </p> */}
        <button
          className='btn-primary w-full'
          type='submit'
          disabled={updating}
        >
          {updating ? "Atualizando..." : "Atualizar evento"}
        </button>

        {error && <div className='error-banner'>{error}</div>}
      </form>
    </div>
  );
}
