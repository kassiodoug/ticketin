import { describe, expect, it } from "@jest/globals";
import { signTicketCode, verifyTicketCode } from "../src/utils/ticketCode";

describe("ticketCode", () => {
  it("gera um código que a verificação aceita", () => {
    const code = signTicketCode("11111111-1111-1111-1111-111111111111");
    const result = verifyTicketCode(code);
    expect(result.valid).toBe(true);
    expect(result.ticketId).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("rejeita um código com assinatura adulterada", () => {
    const code = signTicketCode("11111111-1111-1111-1111-111111111111");
    const forged = code.slice(0, -2) + "xx";
    const result = verifyTicketCode(forged);
    expect(result.valid).toBe(false);
  });

  it('rejeita um UUID "chutado" sem assinatura válida', () => {
    const result = verifyTicketCode(
      "22222222-2222-2222-2222-222222222222.qualquercoisa"
    );
    expect(result.valid).toBe(false);
  });

  it("rejeita código sem o separador esperado", () => {
    const result = verifyTicketCode("codigo-sem-ponto");
    expect(result.valid).toBe(false);
  });
});
