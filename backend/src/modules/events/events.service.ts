import { pool } from "@/db/pool";
import { ICreateEventInput, IOrgEventUpdate } from "@/types";

export async function createEvent(input: ICreateEventInput) {
  if (input.seatRows * input.seatCols < input.capacity) {
    throw new Error(
      "seatRows x seatCols precisa comportar a capacity informada"
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const eventResult = await client.query(
      `INSERT INTO events
        (organizer_id, source, external_id, title, description, image_url,
         venue_name, venue_address, starts_at, price_cents, capacity, seat_rows, seat_cols)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        input.organizerId,
        input.source,
        input.externalId ?? null,
        input.title,
        input.description ?? null,
        input.imageUrl ?? null,
        input.venueName,
        input.venueAddress ?? null,
        input.startsAt,
        input.priceCents,
        input.capacity,
        input.seatRows,
        input.seatCols,
      ]
    );
    const event = eventResult.rows[0];

    // Gera o mapa de assentos: linhas A, B, C... até seatRows, seatCols por linha,
    // truncado em `capacity` (permite mapas "incompletos" na última linha).
    const rowLabels = Array.from({ length: input.seatRows }, (_, i) =>
      String.fromCharCode(65 + i)
    );
    let seatsCreated = 0;
    for (const row of rowLabels) {
      for (let col = 1; col <= input.seatCols; col++) {
        if (seatsCreated >= input.capacity) break;
        await client.query(
          `INSERT INTO seats (event_id, row_label, col_number) VALUES ($1,$2,$3)`,
          [event.id, row, col]
        );
        seatsCreated++;
      }
    }

    await client.query("COMMIT");
    return event;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listPublishedEvents(filters: {
  q?: string;
  from?: string;
  to?: string;
}) {
  const conditions = ["published = true"];
  const params: any[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    conditions.push(`starts_at >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conditions.push(`starts_at <= $${params.length}`);
  }

  const result = await pool.query(
    `SELECT * FROM events WHERE ${conditions.join(" AND ")} ORDER BY starts_at ASC`,
    params
  );
  return result.rows;
}

export async function getEventWithSeats(eventId: string) {
  const eventResult = await pool.query(`SELECT * FROM events WHERE id = $1`, [
    eventId,
  ]);
  const event = eventResult.rows[0];
  if (!event) return null;

  const seatsResult = await pool.query(
    `SELECT id, row_label, col_number, status FROM seats WHERE event_id = $1 ORDER BY row_label, col_number`,
    [eventId]
  );
  return { ...event, seats: seatsResult.rows };
}

export async function listEventsByOrganizer(organizerId: string) {
  const result = await pool.query(
    `SELECT * FROM events WHERE organizer_id = $1 ORDER BY created_at DESC`,
    [organizerId]
  );
  return result.rows;
}

export async function updateEvent(input: IOrgEventUpdate) {
  if (input.seat_rows * input.seat_cols < input.capacity) {
    throw new Error(
      "Fileiras x Assentos por fileira precisa comportar a capacidade informada"
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const eventResult = await client.query(
      `UPDATE events
        SET title = $1,
            starts_at = $2,
            venue_name = $3,
            venue_address = $4,
            price_cents = $5,
            seat_rows = $6,
            seat_cols = $7,
            capacity = $8,
            published = $9
        WHERE id = $10
        RETURNING *`,
      [
        input.title,
        input.starts_at,
        input.venue_name ?? null,
        input.venue_address ?? null,
        input.price_cents,
        input.seat_rows,
        input.seat_cols,
        input.capacity,
        input.published,
        input.id,
      ]
    );
    const event = eventResult.rows[0];

    await client.query("COMMIT");
    return event;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
