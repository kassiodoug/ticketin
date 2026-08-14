export interface IEventPageProps {
  eventId: string;
}

export interface EventSummary {
  id: string;
  title: string;
  venue_name: string;
  starts_at: string;
  price_cents: number;
  image_url?: string;
}
