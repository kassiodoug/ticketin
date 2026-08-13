import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as eventsService from "./events.service";

export const eventsRouter = Router();

// Navegação pública (cliente não precisa estar logado para ver o catálogo).
eventsRouter.get("/", async (req, res) => {
  const { q, from, to } = req.query;
  const events = await eventsService.listPublishedEvents({
    q: q ? String(q) : undefined,
    from: from ? String(from) : undefined,
    to: to ? String(to) : undefined,
  });
  res.json(events);
});

eventsRouter.get(
  "/mine",
  requireAuth,
  requireRole("ORGANIZER"),
  async (req, res) => {
    const events = await eventsService.listEventsByOrganizer(req.user!.id);
    res.json(events);
  }
);

eventsRouter.get("/:id", async (req, res) => {
  const event = await eventsService.getEventWithSeats(req.params.id);
  if (!event) return res.status(404).json({ error: "evento não encontrado" });
  res.json(event);
});

eventsRouter.post(
  "/",
  requireAuth,
  requireRole("ORGANIZER"),
  async (req, res) => {
    const {
      source,
      externalId,
      title,
      description,
      imageUrl,
      venueName,
      venueAddress,
      startsAt,
      priceCents,
      capacity,
      seatRows,
      seatCols,
    } = req.body ?? {};

    if (
      !title ||
      !venueName ||
      !startsAt ||
      !priceCents ||
      !capacity ||
      !seatRows ||
      !seatCols
    ) {
      return res.status(400).json({
        error:
          "title, venueName, startsAt, priceCents, capacity, seatRows e seatCols são obrigatórios",
      });
    }

    try {
      const event = await eventsService.createEvent({
        organizerId: req.user!.id,
        source: source ?? "MANUAL",
        externalId,
        title,
        description,
        imageUrl,
        venueName,
        venueAddress,
        startsAt,
        priceCents,
        capacity,
        seatRows,
        seatCols,
      });
      res.status(201).json(event);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

eventsRouter.patch(
  "/update/:id",
  requireAuth,
  requireRole("ORGANIZER"),
  async (req, res) => {
    const {
      title,
      venue_name,
      venue_address,
      starts_at,
      price_cents,
      capacity,
      seat_rows,
      seat_cols,
      published,
    } = req.body;
    const { id } = req.params;

    if (
      !title ||
      !venue_name ||
      !starts_at ||
      !price_cents ||
      !capacity ||
      !seat_rows ||
      !seat_cols
    ) {
      return res.status(400).json({
        error:
          "Título, Local, Data e hora, preço, capacidade, quantidades de fileiras e assentos por fileira são obrigatórios",
      });
    }

    try {
      const event = await eventsService.updateEvent({
        id,
        title,
        venue_name,
        venue_address,
        starts_at,
        price_cents,
        capacity,
        seat_rows,
        seat_cols,
        published,
      });

      res.status(200).json(event);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);
