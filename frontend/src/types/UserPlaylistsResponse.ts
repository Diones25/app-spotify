// Tipos de Objeto Base Comum na API do Spotify
type ExternalUrls = {
  spotify: string;
};

// 1. Tipos de Imagem (para playlists)
type Image = {
  url: string;
  height: number | null;
  width: number | null;
};

// 2. Tipos de Proprietário (Owner)
type PlaylistOwner = {
  display_name: string;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  type: 'user'; // Ou 'artist', mas é 'user' para playlists de usuário
  uri: string;
};

// 3. Tipos de Rastreamento (Tracks)
type PlaylistTracksReference = {
  href: string;
  total: number;
};

// 4. Tipo de Item de Playlist (O objeto dentro do array 'items')
export type Playlist = {
  collaborative: boolean;
  description: string;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: PlaylistOwner;
  primary_color: string | null;
  public: boolean;
  snapshot_id: string;
  tracks: PlaylistTracksReference;
  type: 'playlist';
  uri: string;
};

// 5. Tipo Principal (Paging Object) - O objeto raiz
export type UserPlaylistsResponse = {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: Playlist[];
};