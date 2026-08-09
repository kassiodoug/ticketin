import { env } from "../../config/env"

const BASE_URL = "https://app.ticketmaster.com/discovery/v2"

export interface CatalogItem {
  externalId: string
  source: "TICKETMASTER" | "TMDB"
  title: string
  imageUrl?: string
  suggestedVenue?: string
  suggestedDate?: string
}

export async function searchTicketmaster(
  keyword: string
): Promise<CatalogItem[]> {
  if (!env.TICKETMASTER_API_KEY) {
    throw new Error("TICKETMASTER_API_KEY não configurada no .env")
  }
  const url = new URL(`${BASE_URL}/events.json`)
  url.searchParams.set("apikey", env.TICKETMASTER_API_KEY)
  url.searchParams.set("keyword", keyword)
  url.searchParams.set("size", "10")
  url.searchParams.set("locale", "*")

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Ticketmaster respondeu ${response.status}`)
  }
  const data = await response.json()
  const events = data._embedded?.events ?? []

  return events.map((ev: any): CatalogItem => ({
    externalId: ev.id,
    source: "TICKETMASTER",
    title: ev.name,
    imageUrl: ev.images?.[0]?.url,
    suggestedVenue: ev._embedded?.venues?.[0]?.name,
    suggestedDate: ev.dates?.start?.dateTime,
  }))
}
