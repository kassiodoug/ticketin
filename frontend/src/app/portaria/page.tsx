"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import { RequireRole } from "../../components/RequireRole";

type GateResult =
  | { result: "INVALID"; reason: string }
  | { result: "ALREADY_USED"; usedAt: string }
  | { result: "WRONG_EVENT"; ticketEventTitle: string }
  | { result: "VALID"; ticket: any };

const SCANNER_ID = "gate-qr-reader";

export default function GateScannerPage() {
  return (
    <RequireRole role='GATE'>
      <GateScannerContent />
    </RequireRole>
  );
}

function GateScannerContent() {
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<GateResult | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const busyRef = useRef(false);

  async function validate(code: string) {
    if (!code.trim() || busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await api.post<GateResult>("/gate/validate", { code });
      setResult(res);
    } finally {
      busyRef.current = false;
    }
  }

  // html5-qrcode acessa a câmera do navegador — importado dinamicamente
  // porque depende de APIs do browser (não existe no server-side render do Next).
  useEffect(() => {
    if (!cameraOn) return;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      scanner = new Html5Qrcode(SCANNER_ID);
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText) => validate(decodedText),
          () => {} // erros de frame sem QR são esperados e ignorados
        )
        .catch(() =>
          setCameraError(
            "não foi possível acessar a câmera — use a digitação manual abaixo"
          )
        );
    });

    return () => {
      cancelled = true;
      scanner?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn]);

  return (
    <div className='container' style={{ maxWidth: 480 }}>
      <h1>Portaria</h1>
      <p style={{ color: "var(--paper-dim)" }}>
        Aponte a câmera para o QR do ingresso, ou digite o código manualmente.
      </p>

      {!cameraOn && (
        <button className='btn-secondary' onClick={() => setCameraOn(true)}>
          Ativar câmera
        </button>
      )}
      {cameraOn && (
        <div
          id={SCANNER_ID}
          style={{ width: "100%", borderRadius: 4, overflow: "hidden" }}
        />
      )}
      {cameraError && <div className='error-banner'>{cameraError}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          validate(manualCode);
          setManualCode("");
        }}
        style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}
      >
        <input
          placeholder='Código do ingresso (alternativa manual)'
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          style={{ flex: 1, fontFamily: "var(--font-mono)" }}
        />
        <button className='btn-primary' type='submit'>
          Validar
        </button>
      </form>

      {result && (
        <div
          className={`gate-result ${result.result}`}
          style={{ marginTop: "1.5rem" }}
        >
          {result.result === "VALID" && "Ingresso válido — entrada liberada"}
          {result.result === "ALREADY_USED" &&
            `Já utilizado em ${new Date(result.usedAt).toLocaleTimeString("pt-BR")}`}
          {result.result === "WRONG_EVENT" &&
            `Ingresso de outro evento: ${result.ticketEventTitle}`}
          {result.result === "INVALID" && `Inválido — ${result.reason}`}
        </div>
      )}
    </div>
  );
}
