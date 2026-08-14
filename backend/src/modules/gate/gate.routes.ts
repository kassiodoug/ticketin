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

gateRouter.get("/", requireAuth, requireRole("GATE"), async (req, res) => {
  const { q, from, to } = req.query;

  const events = await gateService.listPublishedEvents({
    q: q ? String(q) : undefined,
    from: from ? String(from) : undefined,
    to: to ? String(to) : undefined,
  });

  return res.json(events);
});

gateRouter.get("/:id", requireAuth, requireRole("GATE"), async (req, res) => {
  const { id } = req.params;

  const events = await gateService.getPublishedEvent(id);

  return res.json(events);
});
