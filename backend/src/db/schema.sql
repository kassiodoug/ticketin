-- Plataforma de Eventos e Ingressos — schema PostgreSQL
-- Decisões de modelagem estão explicadas no README (seção "Decisões técnicas").

CREATE TYPE user_role AS ENUM ('ORGANIZER', 'CLIENT', 'GATE');
CREATE TYPE event_source AS ENUM ('TICKETMASTER', 'TMDB', 'MANUAL');
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'HELD', 'SOLD');
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'EXPIRED');
CREATE TYPE ticket_status AS ENUM ('VALID', 'USED', 'CANCELED');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Um evento é criado pelo organizador a partir de um item de catálogo
-- (show do Ticketmaster ou filme do TMDb) ou manualmente.
CREATE TABLE events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id      UUID NOT NULL REFERENCES users(id),
  source            event_source NOT NULL,
  external_id       TEXT,              -- id do item no catálogo externo (nullable p/ MANUAL)
  title             TEXT NOT NULL,
  description       TEXT,
  image_url         TEXT,
  venue_name        TEXT NOT NULL,
  venue_address     TEXT,
  starts_at         TIMESTAMPTZ NOT NULL,
  price_cents       INTEGER NOT NULL CHECK (price_cents >= 0),
  capacity          INTEGER NOT NULL CHECK (capacity > 0),
  seat_rows         INTEGER NOT NULL,   -- geometria do mapa de assentos
  seat_cols         INTEGER NOT NULL,
  published         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cada assento do mapa. Gerado quando o evento é criado (seat_rows x seat_cols,
-- truncado pela capacity). É a linha travada via SELECT ... FOR UPDATE na
-- reserva, o que garante que o mesmo lugar não seja vendido duas vezes.
CREATE TABLE seats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  row_label   TEXT NOT NULL,      -- 'A', 'B', 'C'...
  col_number  INTEGER NOT NULL,
  status      seat_status NOT NULL DEFAULT 'AVAILABLE',
  UNIQUE (event_id, row_label, col_number)
);

-- Uma reserva agrupa 1+ assentos de um cliente para um evento, com pagamento simulado.
CREATE TABLE reservations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id),
  client_id     UUID NOT NULL REFERENCES users(id),
  status        reservation_status NOT NULL DEFAULT 'PENDING',
  total_cents   INTEGER NOT NULL,
  held_until    TIMESTAMPTZ NOT NULL, -- expira o "hold" se o pagamento não for concluído
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reservation_seats (
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  seat_id        UUID NOT NULL REFERENCES seats(id),
  PRIMARY KEY (reservation_id, seat_id)
);

-- Um ingresso é emitido por assento confirmado. O código do QR não é o id do
-- ticket puro: é um payload assinado (HMAC-SHA256) — ver src/utils/ticketCode.ts —
-- para que não possa ser forjado digitando um UUID aleatório na portaria.
CREATE TABLE tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID NOT NULL REFERENCES reservations(id),
  event_id        UUID NOT NULL REFERENCES events(id),
  seat_id         UUID NOT NULL REFERENCES seats(id),
  owner_id        UUID NOT NULL REFERENCES users(id),
  code            TEXT NOT NULL UNIQUE,   -- payload assinado, codificado no QR
  share_token     TEXT NOT NULL UNIQUE,   -- token opaco usado no link público de compartilhamento
  status          ticket_status NOT NULL DEFAULT 'VALID',
  used_at         TIMESTAMPTZ,
  used_by_gate_id UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_starts_at ON events (starts_at);
CREATE INDEX idx_seats_event ON seats (event_id);
CREATE INDEX idx_tickets_owner ON tickets (owner_id);
CREATE INDEX idx_tickets_share_token ON tickets (share_token);
