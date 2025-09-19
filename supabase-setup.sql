-- YouTube Directory Database Setup Script
-- Run this script in your Supabase SQL Editor after creating your project

-- Create the videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    youtube_id VARCHAR(255) NOT NULL UNIQUE,
    youtube_url TEXT NOT NULL,
    title TEXT NOT NULL,
    channel TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    description TEXT DEFAULT '',
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    added_by_admin BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_tags ON videos USING gin(tags);

-- Enable Row Level Security (RLS)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Videos are viewable by everyone" ON videos
    FOR SELECT USING (true);

-- Create policies for admin write access (you'll need to set up authentication first)
-- For now, we'll allow all authenticated users to perform CRUD operations
-- You can restrict this further based on your authentication setup

CREATE POLICY "Authenticated users can insert videos" ON videos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update videos" ON videos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete videos" ON videos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample data (same as your current mock data)
INSERT INTO videos (youtube_id, youtube_url, title, channel, thumbnail_url, description, published_at, tags) VALUES
('dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Rick Astley - Never Gonna Give You Up', 'Rick Astley', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', 'The official video for Rick Astley - Never Gonna Give You Up', '2009-10-25T07:00:00Z', '{"music", "80s", "pop"}'),
('9bZkp7q19f0', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'PSY - GANGNAM STYLE', 'PSY', 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg', 'PSY - GANGNAM STYLE (강남스타일) M/V', '2012-07-15T15:30:00Z', '{"music", "k-pop", "viral"}'),
('L_jWHffIx5E', 'https://www.youtube.com/watch?v=L_jWHffIx5E', 'Smash Mouth - All Star', 'Smash Mouth', 'https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg', 'Official music video for All Star by Smash Mouth', '2009-06-17T02:00:00Z', '{"music", "90s", "rock"}'),
('fJ9rUzIMcZQ', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'Queen - Bohemian Rhapsody', 'Queen Official', 'https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg', 'Bohemian Rhapsody by Queen', '2008-08-01T12:00:00Z', '{"music", "classic rock", "queen"}'),
('kJQP7kiw5Fk', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'Luis Fonsi - Despacito ft. Daddy Yankee', 'Luis Fonsi', 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg', 'Despacito official music video', '2017-01-13T00:00:00Z', '{"music", "latin", "reggaeton"}'),
('YQHsXMglC9A', 'https://www.youtube.com/watch?v=YQHsXMglC9A', 'Adele - Hello', 'Adele', 'https://img.youtube.com/vi/YQHsXMglC9A/maxresdefault.jpg', 'Hello by Adele official music video', '2015-10-22T16:00:00Z', '{"music", "pop", "ballad"}');

-- Optional: Create a function to get videos with pagination
CREATE OR REPLACE FUNCTION get_videos_paginated(page_size INT DEFAULT 12, page_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID,
    youtube_id VARCHAR,
    youtube_url TEXT,
    title TEXT,
    channel TEXT,
    thumbnail_url TEXT,
    description TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    added_by_admin BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.youtube_id, v.youtube_url, v.title, v.channel,
           v.thumbnail_url, v.description, v.published_at, v.tags,
           v.added_by_admin, v.created_at
    FROM videos v
    ORDER BY v.created_at DESC
    LIMIT page_size
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION get_videos_paginated TO anon, authenticated;