export interface CatalogItem {
  externalId: string;
  source: "TICKETMASTER" | "TMDB";
  title: string;
  imageUrl?: string;
  suggestedVenue?: string;
  suggestedDate?: string;
}