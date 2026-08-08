import { env } from '../../config/env';
import { CatalogItem } from './ticketmaster.client';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export async function searchTmdb(keyword: string): Promise<CatalogItem[]> {
  if (!env.TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY não configurada no .env');
  }
  const url = new URL(`${BASE_URL}/search/movie`);
  url.searchParams.set('query', keyword);
  url.searchParams.set('language', 'pt-BR');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${env.TMDB_API_KEY}` },
  });
  if (!response.ok) {
    throw new Error(`TMDb respondeu ${response.status}`);
  }
  const data = await response.json();
  const results = data.results ?? [];

  return results.map((movie: any): CatalogItem => ({
    externalId: String(movie.id),
    source: 'TMDB',
    title: movie.title,
    imageUrl: movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : undefined,
  }));
}
