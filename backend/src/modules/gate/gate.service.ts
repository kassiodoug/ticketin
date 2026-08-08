import { pool } from '../../db/pool';
import { verifyTicketCode } from '../../utils/ticketCode';

export type GateResult =
  | { result: 'INVALID'; reason: string }
  | { result: 'ALREADY_USED'; usedAt: string }
  | { result: 'WRONG_EVENT'; ticketEventTitle: string }
  | { result: 'VALID'; ticket: any };

/**
 * `expectedEventId` é opcional: a portaria pode estar "amarrada" a um evento
 * específico (fluxo normal — QR aponta pro evento errado é comum quando o
 * mesmo local roda múltiplas sessões no mesmo dia) ou validar sem essa
 * restrição. Passar o eventId sempre que a tela de portaria souber qual
 * evento está checando.
 */
export async function validateTicket(rawCode: string, expectedEventId?: string): Promise<GateResult> {
  const { valid, ticketId } = verifyTicketCode(rawCode.trim());
  if (!valid || !ticketId) {
    return { result: 'INVALID', reason: 'código não confere com a assinatura esperada' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ticketResult = await client.query(
      `SELECT t.*, e.title AS event_title, e.id AS event_id
       FROM tickets t JOIN events e ON e.id = t.event_id
       WHERE t.id = $1 FOR UPDATE`,
      [ticketId]
    );
    const ticket = ticketResult.rows[0];

    if (!ticket) {
      await client.query('ROLLBACK');
      return { result: 'INVALID', reason: 'ingresso não existe' };
    }

    if (expectedEventId && ticket.event_id !== expectedEventId) {
      await client.query('ROLLBACK');
      return { result: 'WRONG_EVENT', ticketEventTitle: ticket.event_title };
    }

    if (ticket.status === 'USED') {
      await client.query('ROLLBACK');
      return { result: 'ALREADY_USED', usedAt: ticket.used_at };
    }

    if (ticket.status === 'CANCELED') {
      await client.query('ROLLBACK');
      return { result: 'INVALID', reason: 'ingresso cancelado' };
    }

    await client.query(
      `UPDATE tickets SET status = 'USED', used_at = now() WHERE id = $1`,
      [ticketId]
    );
    await client.query('COMMIT');

    return { result: 'VALID', ticket };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
