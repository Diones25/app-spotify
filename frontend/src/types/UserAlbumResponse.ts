// Tipos auxiliares
type ExternalUrls = {
  spotify: string;
};

type Image = {
  url: string;
  height: number;
  width: number;
};

type Copyright = {
  text: string;
  type: "C" | "P"; 
};

type ExternalIds = {
  upc: string; 
};

type Artist = {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: "artist";
  uri: string;
};

type Track = {
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
  is_local: boolean;
};

type TracksObject = {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: Track[];
};

type Album = {
  album_type: string; 
  total_tracks: number;
  available_markets: string[];
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string; 
  release_date_precision: string; 
  type: "album";
  uri: string;
  artists: Artist[];
  tracks: TracksObject;
  copyrights: Copyright[];
  external_ids: ExternalIds;
  genres: string[]; 
  label: string;
  popularity: number;
};

type PlaylistItem = {
  added_at: string; 
  album: Album;
};

export type UserAlbumResponse = {
  href: string;
  items: PlaylistItem[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
};