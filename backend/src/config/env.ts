import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  TICKET_SIGNING_SECRET: required("TICKET_SIGNING_SECRET"),
  TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY ?? "",
  TMDB_API_KEY: process.env.TMDB_API_KEY ?? "",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",
  RESERVATION_HOLD_MINUTES: Number(process.env.RESERVATION_HOLD_MINUTES ?? 10),
};
