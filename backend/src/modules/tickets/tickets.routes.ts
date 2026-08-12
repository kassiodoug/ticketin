import { formatVerificationCode } from "@/utils/helpers";
import { Router } from "express";
import QRCode from "qrcode";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as ticketsService from "./tickets.service";

export const ticketsRouter = Router();

ticketsRouter.get(
  "/mine",
  requireAuth,
  requireRole("CLIENT"),
  async (req, res) => {
    const tickets = await ticketsService.listMyTickets(req.user!.id);
    res.json(tickets);
  }
);

ticketsRouter.get(
  "/:id",
  requireAuth,
  requireRole("CLIENT"),
  async (req, res) => {
    const ticket = await ticketsService.getTicketForOwner(
      req.params.id,
      req.user!.id
    );
    if (!ticket)
      return res.status(404).json({ error: "ingresso não encontrado" });

    res.json(ticket);
  }
);

// Retorna o QR já renderizado como PNG (data URL), pronto para <img src="...">.
ticketsRouter.get(
  "/:id/qrcode",
  requireAuth,
  requireRole("CLIENT"),
  async (req, res) => {
    const ticket = await ticketsService.getTicketForOwner(
      req.params.id,
      req.user!.id
    );

    if (!ticket)
      return res.status(404).json({ error: "ingresso não encontrado" });

    const dataUrl = await QRCode.toDataURL(ticket.code, {
      margin: 1,
      width: 320,
    });

    res.json({
      dataUrl,
      verifCode: formatVerificationCode(ticket.verif_code, "-"),
    });
  }
);

// Rota pública (sem auth) para o link compartilhável.
ticketsRouter.get("/share/:token", async (req, res) => {
  const ticket = await ticketsService.getTicketByShareToken(req.params.token);
  if (!ticket) return res.status(404).json({ error: "link inválido" });

  res.json(ticket);
});
