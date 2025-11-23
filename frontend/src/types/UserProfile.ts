// Tipos Aninhados
type ExplicitContent = {
  filter_enabled: boolean;
  filter_locked: boolean;
};

type ExternalUrls = {
  spotify: string;
};

type Followers = {
  href: string | null;
  total: number;
};

type Image = {
  height: number | null; 
  url: string;
  width: number | null; 
};

export type UserProfile = {
  country: string;
  display_name: string;
  email: string;
  explicit_content: ExplicitContent;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  product: string;
  type: 'user'; 
  uri: string;
};