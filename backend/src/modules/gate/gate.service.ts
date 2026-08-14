import { pool } from "@/db/pool";
import { verifyTicketCode } from "@/utils/ticketCode";
import { isCuid } from "@paralleldrive/cuid2";

export type GateResult =
  | { result: "INVALID"; reason: string }
  | { result: "ALREADY_USED"; usedAt: string }
  | { result: "WRONG_EVENT"; ticketEventTitle: string }
  | { result: "VALID"; ticket: any };

/**
 * `expectedEventId` é opcional: a portaria pode estar "amarrada" a um evento
 * específico (fluxo normal — QR aponta pro evento errado é comum quando o
 * mesmo local roda múltiplas sessões no mesmo dia) ou validar sem essa
 * restrição. Passar o eventId sempre que a tela de portaria souber qual
 * evento está checando.
 */
export async function validateTicket(
  rawCode: string,
  expectedEventId?: string
): Promise<GateResult> {
  const { valid, ticketId } = verifyTicketCode(rawCode.trim());

  const queryTicket = {
    colTarget: "t.id",
    value: ticketId,
  };

  if (rawCode.length === 9 && isCuid(rawCode?.toLowerCase())) {
    queryTicket.colTarget = "verif_code";
    queryTicket.value = rawCode;
  } else {
    if (!valid || !ticketId) {
      return {
        result: "INVALID",
        reason: "código não confere com a assinatura esperada",
      };
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ticketResult = await client.query(
      `SELECT t.*, e.title AS event_title, e.id AS event_id
       FROM tickets t JOIN events e ON e.id = t.event_id
       WHERE ${queryTicket.colTarget} = $1 FOR UPDATE`,
      [queryTicket.value]
    );
    const ticket = ticketResult.rows[0];

    if (!ticket) {
      await client.query("ROLLBACK");
      return { result: "INVALID", reason: "ingresso não existe" };
    }

    if (expectedEventId && ticket.event_id !== expectedEventId) {
      await client.query("ROLLBACK");
      return { result: "WRONG_EVENT", ticketEventTitle: ticket.event_title };
    }

    if (ticket.status === "USED") {
      await client.query("ROLLBACK");
      return { result: "ALREADY_USED", usedAt: ticket.used_at };
    }

    if (ticket.status === "CANCELED") {
      await client.query("ROLLBACK");
      return { result: "INVALID", reason: "ingresso cancelado" };
    }

    await client.query(
      `UPDATE tickets SET status = 'USED', used_at = now() WHERE id = $1`,
      [ticket.id]
    );
    await client.query("COMMIT");

    return { result: "VALID", ticket };
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

export async function getPublishedEvent(eventId: string) {
  const result = await pool.query(
    `SELECT * FROM events WHERE id = $1 AND published = true`,
    [eventId]
  );

  return result.rows[0];
}
