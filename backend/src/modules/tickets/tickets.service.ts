import { pool } from "../../db/pool"

export async function listMyTickets(ownerId: string) {
  const result = await pool.query(
    `SELECT t.id, t.code, t.share_token, t.status, t.used_at,
            e.title AS event_title, e.starts_at, e.venue_name,
            s.row_label, s.col_number
     FROM tickets t
     JOIN events e ON e.id = t.event_id
     JOIN seats s ON s.id = t.seat_id
     WHERE t.owner_id = $1
     ORDER BY e.starts_at ASC`,
    [ownerId]
  )
  return result.rows
}

export async function getTicketForOwner(ticketId: string, ownerId: string) {
  const result = await pool.query(
    `SELECT t.*, e.title AS event_title, e.starts_at, e.venue_name, s.row_label, s.col_number
     FROM tickets t
     JOIN events e ON e.id = t.event_id
     JOIN seats s ON s.id = t.seat_id
     WHERE t.id = $1 AND t.owner_id = $2`,
    [ticketId, ownerId]
  )
  return result.rows[0] ?? null
}

// Usado pelo link público de compartilhamento — não exige autenticação,
// mas só expõe dados de exibição (nunca o `code` assinado, que é o que
// a portaria usa para validar; ver nota no README sobre essa decisão).
export async function getTicketByShareToken(shareToken: string) {
  const result = await pool.query(
    `SELECT t.id, t.status, t.used_at, e.title AS event_title, e.starts_at, e.venue_name,
            s.row_label, s.col_number
     FROM tickets t
     JOIN events e ON e.id = t.event_id
     JOIN seats s ON s.id = t.seat_id
     WHERE t.share_token = $1`,
    [shareToken]
  )
  return result.rows[0] ?? null
}
