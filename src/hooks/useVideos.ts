import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setVideos(data || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch videos')
    } finally {
      setLoading(false)
    }
  }

  const addVideo = async (video: Omit<VideoInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([video])
        .select()
        .single()

      if (error) throw error

      setVideos(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      console.error('Error adding video:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add video'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const updateVideo = async (id: string, updates: VideoUpdate) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setVideos(prev => prev.map(video =>
        video.id === id ? { ...video, ...data } : video
      ))
      return { data, error: null }
    } catch (err) {
      console.error('Error updating video:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update video'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  const deleteVideo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setVideos(prev => prev.filter(video => video.id !== id))
      return { error: null }
    } catch (err) {
      console.error('Error deleting video:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete video'
      setError(errorMessage)
      return { error: errorMessage }
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
    const youtubeId = extractYouTubeId(url)
    if (!youtubeId) {
      return { data: null, error: 'Invalid YouTube URL' }
    }

    const videoData: Omit<VideoInsert, 'id' | 'created_at' | 'updated_at'> = {
      youtube_id: youtubeId,
      youtube_url: url,
      title: additionalData?.title || 'Untitled Video',
      channel: additionalData?.channel || 'Unknown Channel',
      thumbnail_url: generateThumbnailUrl(youtubeId),
      description: additionalData?.description || '',
      published_at: additionalData?.published_at || new Date().toISOString(),
      tags: additionalData?.tags || [],
      added_by_admin: true,
    }

    return addVideo(videoData)
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('videos')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'videos' },
        (payload) => {
          console.log('Real-time update:', payload)
          fetchVideos() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
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