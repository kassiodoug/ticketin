export interface ICreateEventInput {
  organizerId: string;
  source: "TICKETMASTER" | "TMDB" | "MANUAL";
  externalId?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  venueName: string;
  venueAddress?: string;
  startsAt: string;
  priceCents: number;
  capacity: number;
  seatRows: number;
  seatCols: number;
}

export interface IOrgEventUpdate {
  id: string;
  title: string;
  starts_at: string;
  venue_name?: string;
  venue_address?: string;
  price_cents: number;
  seat_rows: number;
  seat_cols: number;
  capacity: number;
  published: boolean;
}
