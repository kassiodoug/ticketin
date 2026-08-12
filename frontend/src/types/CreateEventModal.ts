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

export interface TCreateEventModal {
  item: ICatalogItem;
  startAt: string;
  venueName: string;
  loadMyEvents: () => void;
  onClose: () => void;
}
