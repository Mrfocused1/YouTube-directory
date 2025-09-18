export interface Video {
  id: string;
  youtube_id: string;
  youtube_url: string;
  title: string;
  channel: string;
  thumbnail_url: string;
  description: string;
  published_at: string;
  tags: string[];
  added_by_admin: boolean;
  created_at: string;
}