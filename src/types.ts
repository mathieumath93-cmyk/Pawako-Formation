export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  pdf_file_path: string;
  unique_slug: string;
  password_hash: string;
  created_at: string;
  views_count: number;
  ads_enabled: boolean;
  file_size?: number;
  original_filename?: string;
  password_plain?: string; // Stored in memory/admin view for convenience in demo mode
  video_url?: string; // Video course URL (YouTube, Vimeo, MP4)
}

export interface DocumentPublicInfo {
  id: string;
  title: string;
  description: string;
  unique_slug: string;
  created_at: string;
  views_count: number;
  ads_enabled: boolean;
  file_size?: number;
  video_url?: string;
}

export interface VerifyPasswordResponse {
  success: boolean;
  token?: string;
  message?: string;
  docInfo?: DocumentPublicInfo;
}

export type AdPosition = 'top' | 'bottom' | 'between-pages' | 'sidebar' | 'popunder' | 'social-bar';

export interface AdSettings {
  adsterraTopScript: string;
  adsterraBottomScript: string;
  adsterraBetweenScript: string;
  adsterraPopunderScript: string;
  adsterraSocialBarScript: string;
  globalAdsEnabled: boolean;
}

export type MediaType = 'movie' | 'series';

export interface Episode {
  id: string;
  episode_number: number;
  season_number: number;
  title: string;
  stream_url: string;
}

export interface Season {
  season_number: number;
  title?: string;
  episodes: Episode[];
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  description: string;
  genre: string;
  release_year: number | string;
  rating?: string;
  quality_badge?: string;
  poster_url: string;
  banner_url?: string;
  stream_url?: string; // Main stream link for movies
  seasons?: Season[]; // Seasons & episodes for series
  created_at: string;
  views_count: number;
  featured?: boolean;
}

