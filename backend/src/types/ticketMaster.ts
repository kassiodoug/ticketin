export interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  images?: Array<{
    url: string;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
    }>;
  };
  dates?: {
    start?: {
      dateTime?: string;
    };
  };
}
