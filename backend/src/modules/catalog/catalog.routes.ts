import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { searchTicketmaster } from "./ticketmaster.client";
import { searchTmdb } from "./tmdb.client";

export const catalogRouter = Router();

// Só o organizador precisa navegar pelo catálogo externo para montar um evento.
catalogRouter.get(
  "/search",
  requireAuth,
  requireRole("ORGANIZER"),
  async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    const source = String(req.query.source ?? "both"); // 'ticketmaster' | 'tmdb' | 'both'
    if (!q) return res.status(400).json({ error: "parâmetro q é obrigatório" });

    try {
      const tasks: Promise<any[]>[] = [];
      if (source === "ticketmaster" || source === "both")
        tasks.push(searchTicketmaster(q));
      if (source === "tmdb" || source === "both") tasks.push(searchTmdb(q));

      const results = await Promise.allSettled(tasks);
      const items = results.flatMap((r) =>
        r.status === "fulfilled" ? r.value : []
      );
      const errors = results
        .filter((r) => r.status === "rejected")
        .map((r: any) => r.reason?.message);

      return res.json({ items, errors });
    } catch (err: any) {
      return res.status(502).json({
        error: "falha ao consultar catálogo externo",
        detail: err.message,
      });
    }
  }
);
