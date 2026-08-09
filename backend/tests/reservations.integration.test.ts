/**
 * Teste de integração: garante que dois clientes disputando o mesmo assento
 * nunca resultam em dois "SOLD" para o mesmo lugar.
 *
 * Requer DATABASE_URL apontando para um Postgres com o schema aplicado
 * (rode `npm run migrate` antes). Pulado automaticamente se DATABASE_URL
 * não estiver definida, para não quebrar `npm test` num ambiente sem banco.
 */
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

const hasDb = !!process.env.DATABASE_URL;
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb("reservations - concorrência de assento", () => {
  let pool: any;
  let createReservation: any;
  let eventId: string;
  let seatId: string;
  let organizerId: string;
  let client1Id: string;
  let client2Id: string;

  beforeAll(async () => {
    ({ pool } = await import("../src/db/pool"));
    ({ createReservation } =
      await import("../src/modules/reservations/reservations.service"));

    const org = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Org Teste', 'org-teste@x.test', 'x', 'ORGANIZER') RETURNING id`
    );
    organizerId = org.rows[0].id;

    const c1 = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Cliente 1', 'c1-teste@x.test', 'x', 'CLIENT') RETURNING id`
    );
    client1Id = c1.rows[0].id;

    const c2 = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Cliente 2', 'c2-teste@x.test', 'x', 'CLIENT') RETURNING id`
    );
    client2Id = c2.rows[0].id;

    const ev = await pool.query(
      `INSERT INTO events (organizer_id, source, title, venue_name, starts_at, price_cents, capacity, seat_rows, seat_cols)
       VALUES ($1, 'MANUAL', 'Evento Teste', 'Local Teste', now() + interval '1 day', 1000, 1, 1, 1)
       RETURNING id`,
      [organizerId]
    );
    eventId = ev.rows[0].id;

    const seat = await pool.query(
      `INSERT INTO seats (event_id, row_label, col_number) VALUES ($1, 'A', 1) RETURNING id`,
      [eventId]
    );
    seatId = seat.rows[0].id;
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM events WHERE id = $1`, [eventId]);
    await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [
      [organizerId, client1Id, client2Id],
    ]);
    await pool.end();
  });

  it("só permite que um dos dois clientes reserve o assento disputado", async () => {
    const attempts = await Promise.allSettled([
      createReservation(eventId, client1Id, [seatId]),
      createReservation(eventId, client2Id, [seatId]),
    ]);

    const succeeded = attempts.filter((a) => a.status === "fulfilled");
    const failed = attempts.filter((a) => a.status === "rejected");

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);
  });
});
