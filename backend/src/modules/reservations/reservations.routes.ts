import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as reservationsService from "./reservations.service";

export const reservationsRouter = Router();

reservationsRouter.post(
  "/",
  requireAuth,
  requireRole("CLIENT"),
  async (req, res) => {
    const { eventId, seatIds } = req.body ?? {};
    if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res
        .status(400)
        .json({ error: "eventId e seatIds[] são obrigatórios" });
    }
    try {
      const reservation = await reservationsService.createReservation(
        eventId,
        req.user!.id,
        seatIds
      );
      res.status(201).json(reservation);
    } catch (err: any) {
      res.status(409).json({ error: err.message });
    }
  }
);

reservationsRouter.post(
  "/:id/pay",
  requireAuth,
  requireRole("CLIENT"),
  async (req, res) => {
    const { simulateOutcome } = req.body ?? {};
    try {
      const result = await reservationsService.payReservation(
        req.params.id,
        req.user!.id,
        simulateOutcome
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);
