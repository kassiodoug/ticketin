export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
}

export interface TmdbResponse {
  results?: TmdbMovie[];
}