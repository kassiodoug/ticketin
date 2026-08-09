import crypto from "crypto";
import { env } from "../config/env";

/**
 * O código dentro do QR não é o UUID do ticket puro — se fosse, qualquer um
 * poderia gerar um QR "válido" digitando um UUID no formato certo.
 *
 * O código é: `<ticketId>.<assinatura>`, onde a assinatura é um HMAC-SHA256
 * de `ticketId` usando um segredo que só o back-end conhece. Na portaria,
 * recalculamos o HMAC e comparamos (timing-safe) — se não bater, o código
 * foi forjado ou corrompido, e a resposta é "inválido" antes mesmo de
 * consultar o banco.
 */
export function signTicketCode(ticketId: string): string {
  const signature = crypto
    .createHmac("sha256", env.TICKET_SIGNING_SECRET)
    .update(ticketId)
    .digest("base64url");
  return `${ticketId}.${signature}`;
}

export function verifyTicketCode(code: string): {
  valid: boolean;
  ticketId?: string;
} {
  const [ticketId, signature] = code.split(".");
  if (!ticketId || !signature) return { valid: false };

  const expected = crypto
    .createHmac("sha256", env.TICKET_SIGNING_SECRET)
    .update(ticketId)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false };
  }
  return { valid: true, ticketId };
}

export function generateShareToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}
