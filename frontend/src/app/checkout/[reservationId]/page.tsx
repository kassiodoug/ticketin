"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "../../../api/client";

export default function CheckoutPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<"APPROVED" | "DECLINED" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // O desafio pede que os dois caminhos (confirmação e recusa) sejam
  // demonstráveis, então o botão de pagamento deixa a pessoa escolher o
  // desfecho aqui — num gateway real, é claro, isso não existiria.
  async function pay(outcome: "APPROVE" | "DECLINE") {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ approved: boolean }>(
        `/reservations/${reservationId}/pay`,
        {
          simulateOutcome: outcome,
        }
      );
      setResult(res.approved ? "APPROVED" : "DECLINED");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "falha no pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='container' style={{ maxWidth: 420 }}>
      <h1>Pagamento</h1>
      <p style={{ color: "var(--paper-dim)" }}>
        Pagamento simulado — nenhuma transação real é feita. Escolha o desfecho
        para testar os dois fluxos.
      </p>

      {error && <div className='error-banner'>{error}</div>}

      {!result && (
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button
            className='btn-primary'
            disabled={loading}
            onClick={() => pay("APPROVE")}
          >
            Simular aprovação
          </button>
          <button
            className='btn-danger'
            disabled={loading}
            onClick={() => pay("DECLINE")}
          >
            Simular recusa
          </button>
        </div>
      )}

      {result === "APPROVED" && (
        <div
          className='stub-card'
          style={{ padding: "1.5rem", marginTop: "1.5rem" }}
        >
          <p className='status-pill valid'>Pagamento aprovado</p>
          <p>Seus ingressos foram emitidos.</p>
          <button
            className='btn-primary'
            onClick={() => router.push("/meus-ingressos")}
          >
            Ver meus ingressos
          </button>
        </div>
      )}

      {result === "DECLINED" && (
        <div
          className='stub-card'
          style={{ padding: "1.5rem", marginTop: "1.5rem" }}
        >
          <p className='status-pill invalid'>Pagamento recusado</p>
          <p>Os assentos foram liberados de volta para o evento.</p>
          <button className='btn-secondary' onClick={() => router.back()}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
