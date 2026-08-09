import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { catalogRouter } from "./modules/catalog/catalog.routes";
import { eventsRouter } from "./modules/events/events.routes";
import { gateRouter } from "./modules/gate/gate.routes";
import { reservationsRouter } from "./modules/reservations/reservations.routes";
import { ticketsRouter } from "./modules/tickets/tickets.routes";

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/catalog", catalogRouter);
app.use("/events", eventsRouter);
app.use("/reservations", reservationsRouter);
app.use("/tickets", ticketsRouter);
app.use("/gate", gateRouter);

// Handler de erro genérico — evita vazar stack trace e garante resposta JSON
// consistente mesmo em falhas não previstas.
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "erro interno" });
  }
);
