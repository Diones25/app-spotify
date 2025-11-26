// --- 1. Tipos de Imagem e URLs Externas (Comuns em vários objetos do Spotify) ---

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface ExternalUrls {
  spotify: string;
  // Outras chaves podem existir, mas 'spotify' é a mais comum.
  [key: string]: string;
}

// --- 2. Tipos Aninhados (Followers e Cursors) ---

export interface Followers {
  href: string | null;
  total: number;
}

export interface Cursors {
  after: string | null;
}

// --- 3. Tipo do Item Principal (Artist) ---

export interface Artist {
  external_urls: ExternalUrls;
  followers: Followers;
  genres: string[];
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  popularity: number;
  type: 'artist';
  uri: string;
}

// --- 4. Tipo do Objeto de Paginação (Artists Paging Object) ---

export interface ArtistsPagingObject {
  href: string;
  limit: number;
  next: string | null;
  cursors: Cursors;
  total: number;
  items: Artist[];
}

// --- 5. Tipo da Resposta Raiz ---

export interface FollowedArtistsResponse {
  artists: ArtistsPagingObject;
}