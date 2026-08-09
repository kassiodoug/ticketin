import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as gateService from "./gate.service";

export const gateRouter = Router();

gateRouter.post(
  "/validate",
  requireAuth,
  requireRole("GATE"),
  async (req, res) => {
    const { code, eventId } = req.body ?? {};
    if (!code) return res.status(400).json({ error: "code é obrigatório" });

    const result = await gateService.validateTicket(code, eventId);
    res.json(result);
  }
);
