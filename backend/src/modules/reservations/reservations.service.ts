import { env } from "../../config/env";
import { pool } from "../../db/pool";
import { generateShareToken, signTicketCode } from "../../utils/ticketCode";

/**
 * Cria uma reserva "segurando" os assentos escolhidos.
 *
 * A garantia de "mesmo lugar não vendido duas vezes" vem daqui: dentro de uma
 * transação, fazemos SELECT ... FOR UPDATE nas linhas de `seats`. Isso trava
 * essas linhas até o COMMIT/ROLLBACK — se duas requisições tentarem reservar
 * o mesmo assento ao mesmo tempo, a segunda espera a primeira terminar e,
 * ao reler o status, encontra o assento já HELD/SOLD e falha de forma segura.
 * Não dependemos de checar "está livre?" e só depois escrever (race condition
 * clássica) — checagem e trava acontecem atomicamente.
 */
export async function createReservation(
  eventId: string,
  clientId: string,
  seatIds: string[]
) {
  if (seatIds.length === 0) throw new Error("selecione ao menos um assento");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const eventResult = await client.query(
      `SELECT * FROM events WHERE id = $1`,
      [eventId]
    );
    const event = eventResult.rows[0];
    if (!event) throw new Error("evento não encontrado");

    const seatsResult = await client.query(
      `SELECT id, status FROM seats WHERE event_id = $1 AND id = ANY($2::uuid[]) FOR UPDATE`,
      [eventId, seatIds]
    );

    if (seatsResult.rows.length !== seatIds.length) {
      throw new Error("um ou mais assentos não pertencem a este evento");
    }
    const unavailable = seatsResult.rows.filter(
      (s) => s.status !== "AVAILABLE"
    );
    if (unavailable.length > 0) {
      throw new Error(
        "um ou mais assentos selecionados já não estão disponíveis"
      );
    }

    await client.query(
      `UPDATE seats SET status = 'HELD' WHERE id = ANY($1::uuid[])`,
      [seatIds]
    );

    const totalCents = event.price_cents * seatIds.length;
    const heldUntil = new Date(
      Date.now() + env.RESERVATION_HOLD_MINUTES * 60_000
    );

    const reservationResult = await client.query(
      `INSERT INTO reservations (event_id, client_id, status, total_cents, held_until)
       VALUES ($1,$2,'PENDING',$3,$4) RETURNING *`,
      [eventId, clientId, totalCents, heldUntil]
    );
    const reservation = reservationResult.rows[0];

    for (const seatId of seatIds) {
      await client.query(
        `INSERT INTO reservation_seats (reservation_id, seat_id) VALUES ($1,$2)`,
        [reservation.id, seatId]
      );
    }

    await client.query("COMMIT");
    return reservation;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Pagamento simulado. `simulateOutcome` deixa o front decidir o caminho
 * (aprovado/recusado) para exercitar os dois fluxos pedidos no desafio;
 * por padrão, 90% de aprovação para simular um gateway real.
 */
export async function payReservation(
  reservationId: string,
  clientId: string,
  simulateOutcome?: "APPROVE" | "DECLINE"
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reservationResult = await client.query(
      `SELECT * FROM reservations WHERE id = $1 AND client_id = $2 FOR UPDATE`,
      [reservationId, clientId]
    );
    const reservation = reservationResult.rows[0];
    if (!reservation) throw new Error("reserva não encontrada");
    if (reservation.status !== "PENDING")
      throw new Error(`reserva já está ${reservation.status}`);
    if (new Date(reservation.held_until) < new Date()) {
      await expireReservation(client, reservation);
      await client.query("COMMIT");
      throw new Error(
        "tempo para pagamento expirado, os assentos foram liberados"
      );
    }

    const approved = simulateOutcome
      ? simulateOutcome === "APPROVE"
      : Math.random() < 0.9;

    const seatsResult = await client.query(
      `SELECT seat_id FROM reservation_seats WHERE reservation_id = $1`,
      [reservationId]
    );
    const seatIds = seatsResult.rows.map((r) => r.seat_id);

    if (!approved) {
      await client.query(
        `UPDATE reservations SET status = 'DECLINED' WHERE id = $1`,
        [reservationId]
      );
      await client.query(
        `UPDATE seats SET status = 'AVAILABLE' WHERE id = ANY($1::uuid[])`,
        [seatIds]
      );
      await client.query("COMMIT");
      return {
        approved: false,
        reservation: { ...reservation, status: "DECLINED" },
      };
    }

    await client.query(
      `UPDATE reservations SET status = 'CONFIRMED' WHERE id = $1`,
      [reservationId]
    );
    await client.query(
      `UPDATE seats SET status = 'SOLD' WHERE id = ANY($1::uuid[])`,
      [seatIds]
    );

    const tickets = [];
    for (const seatId of seatIds) {
      const ticketResult = await client.query(
        `INSERT INTO tickets (reservation_id, event_id, seat_id, owner_id, code, share_token)
         VALUES ($1,$2,$3,$4,'PENDING','PENDING') RETURNING id`,
        [reservationId, reservation.event_id, seatId, clientId]
      );
      const ticketId = ticketResult.rows[0].id;
      const code = signTicketCode(ticketId);
      const shareToken = generateShareToken();
      await client.query(
        `UPDATE tickets SET code = $1, share_token = $2 WHERE id = $3`,
        [code, shareToken, ticketId]
      );
      tickets.push({ id: ticketId, code, shareToken });
    }

    await client.query("COMMIT");
    return {
      approved: true,
      reservation: { ...reservation, status: "CONFIRMED" },
      tickets,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function expireReservation(client: any, reservation: any) {
  const seatsResult = await client.query(
    `SELECT seat_id FROM reservation_seats WHERE reservation_id = $1`,
    [reservation.id]
  );
  const seatIds = seatsResult.rows.map((r: any) => r.seat_id);
  await client.query(
    `UPDATE reservations SET status = 'EXPIRED' WHERE id = $1`,
    [reservation.id]
  );
  await client.query(
    `UPDATE seats SET status = 'AVAILABLE' WHERE id = ANY($1::uuid[])`,
    [seatIds]
  );
}
