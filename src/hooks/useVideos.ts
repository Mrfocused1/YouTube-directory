import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type VideoInsert = Database['public']['Tables']['videos']['Insert']
type VideoUpdate = Database['public']['Tables']['videos']['Update']

export interface Video {
  id: string
  youtube_id: string
  youtube_url: string
  title: string
  channel: string
  thumbnail_url: string
  description: string
  published_at: string
  tags: string[]
  added_by_admin: boolean
  created_at: string
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getDemoVideos = (): Video[] => [
    {
      id: 'demo-1',
      youtube_id: '9bZkp7q19f0',
      youtube_url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      title: 'PSY - GANGNAM STYLE',
      channel: 'officialpsy',
      thumbnail_url: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
      description: 'PSY - GANGNAM STYLE (강남스타일) Official Music Video',
      published_at: '2012-07-15T00:00:00Z',
      tags: ['Music', 'K-Pop', 'Dance'],
      added_by_admin: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      youtube_id: 'JGwWNGJdvx8',
      youtube_url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
      title: 'Queen – Bohemian Rhapsody',
      channel: 'Queen Official',
      thumbnail_url: 'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg',
      description: 'Official video for "Bohemian Rhapsody" by Queen',
      published_at: '2008-10-01T00:00:00Z',
      tags: ['Music', 'Rock', 'Classic'],
      added_by_admin: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-3',
      youtube_id: 'hT_nvWreIhg',
      youtube_url: 'https://www.youtube.com/watch?v=hT_nvWreIhg',
      title: 'Lord Huron - The Night We Met',
      channel: 'Lord Huron',
      thumbnail_url: 'https://img.youtube.com/vi/hT_nvWreIhg/maxresdefault.jpg',
      description: 'Official music video for "The Night We Met" by Lord Huron',
      published_at: '2017-01-01T00:00:00Z',
      tags: ['Music', 'Indie', 'Folk'],
      added_by_admin: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-4',
      youtube_id: 'kJQP7kiw5Fk',
      youtube_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      title: 'Despacito ft. Daddy Yankee',
      channel: 'Luis Fonsi',
      thumbnail_url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
      description: 'Official music video for "Despacito" by Luis Fonsi ft. Daddy Yankee',
      published_at: '2017-01-12T00:00:00Z',
      tags: ['Music', 'Latin', 'Pop'],
      added_by_admin: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-5',
      youtube_id: 'fJ9rUzIMcZQ',
      youtube_url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
      title: 'Queen – Bohemian Rhapsody (Official Video)',
      channel: 'Queen Official',
      thumbnail_url: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg',
      description: 'Bohemian Rhapsody by Queen',
      published_at: '2008-08-01T00:00:00Z',
      tags: ['Music', 'Rock', 'Queen'],
      added_by_admin: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-6',
      youtube_id: 'YQHsXMglC9A',
      youtube_url: 'https://www.youtube.com/watch?v=YQHsXMglC9A',
      title: 'Adele - Hello',
      channel: 'Adele',
      thumbnail_url: 'https://img.youtube.com/vi/YQHsXMglC9A/maxresdefault.jpg',
      description: 'Official music video for Hello by Adele',
      published_at: '2015-10-22T00:00:00Z',
      tags: ['Music', 'Pop', 'Ballad'],
      added_by_admin: true,
      created_at: new Date().toISOString()
    }
  ]

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Always use demo data for now to avoid connection issues
      const demoVideos = getDemoVideos()
      setVideos(demoVideos)
      setError(null)
    } catch (err) {
      console.error('Error fetching videos:', err)
      // Always fall back to demo data on error
      const demoVideos = getDemoVideos()
      setVideos(demoVideos)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const addVideo = async (video: Omit<VideoInsert, 'id' | 'created_at' | 'updated_at'>) => {
    return { data: null, error: 'Demo mode - Cannot add videos. Configure Supabase to enable this feature.' }
  }

  const updateVideo = async (id: string, updates: VideoUpdate) => {
    return { data: null, error: 'Demo mode - Cannot update videos. Configure Supabase to enable this feature.' }
  }

  const deleteVideo = async (id: string) => {
    try {
      // Remove from current videos array
      setVideos(prevVideos => prevVideos.filter(video => video.id !== id))
      return { error: null }
    } catch (err) {
      return { error: 'Failed to delete video' }
    }
  }

  // YouTube URL helper functions
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const generateThumbnailUrl = (youtubeId: string): string => {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
  }

  const addVideoFromUrl = async (url: string, additionalData?: Partial<VideoInsert>) => {
    try {
      const youtubeId = extractYouTubeId(url)
      if (!youtubeId) {
        return { data: null, error: 'Invalid YouTube URL' }
      }

      // Create new video object for demo mode
      const newVideo: Video = {
        id: `demo-${Date.now()}`,
        youtube_id: youtubeId,
        youtube_url: url,
        title: additionalData?.title || 'New Video',
        channel: additionalData?.channel || 'Unknown Channel',
        thumbnail_url: generateThumbnailUrl(youtubeId),
        description: additionalData?.description || '',
        published_at: new Date().toISOString(),
        tags: Array.isArray(additionalData?.tags) ? additionalData.tags : [],
        added_by_admin: true,
        created_at: new Date().toISOString()
      }

      // Add to current videos array
      setVideos(prevVideos => [newVideo, ...prevVideos])
      return { data: newVideo, error: null }
    } catch (err) {
      return { data: null, error: 'Failed to add video' }
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  return {
    videos,
    loading,
    error,
    fetchVideos,
    addVideo,
    updateVideo,
    deleteVideo,
    addVideoFromUrl,
    extractYouTubeId,
    generateThumbnailUrl,
  }
}