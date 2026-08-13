"use client";

export interface ICatalogItem {
  externalId: string;
  source: "TICKETMASTER" | "TMDB";
  title: string;
  imageUrl?: string;
  suggestedVenue?: string;
  suggestedDate?: string;
}

export interface IOrgEvent {
  id: string;
  title: string;
  starts_at: string;
  capacity: number;
  published: boolean;
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
  published: boolean;
}

export interface TCreateEventModal {
  item: ICatalogItem;
  startAt: string;
  venueName: string;
  seatRow?: number;
  seatCol?: number;
  loadMyEvents: () => void;
  onClose: () => void;
}
