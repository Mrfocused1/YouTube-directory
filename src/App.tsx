import React, { useState, useMemo } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useVideos } from './hooks/useVideos'
import { Login } from './components/Login'

// Video Card Component
const VideoCard: React.FC<{
  video: any
  onPlay: (video: any) => void
  onEdit?: (video: any) => void
  onDelete?: (videoId: string) => void
  isAdmin?: boolean
}> = ({ video, onPlay, onEdit, onDelete, isAdmin }) => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="relative">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={() => onPlay(video)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
        >
          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold mb-2 line-clamp-2">{video.title}</h3>
        <p className="text-white/70 text-sm mb-2">{video.channel}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {video.tags?.slice(0, 3).map((tag: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => onPlay(video)}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Play
            </button>
            <button
              onClick={() => onEdit?.(video)}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(video.id)}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Upload Form Component
const UploadForm: React.FC<{
  onClose: () => void
  onSubmit: (data: any) => void
}> = ({ onClose, onSubmit }) => {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const videoData = {
      url,
      title: title || 'Untitled Video',
      channel: channel || 'Unknown Channel',
      description,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
    }

    await onSubmit(videoData)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Upload Video</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              YouTube URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Video title (optional)"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Channel
            </label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Channel name (optional)"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Video description (optional)"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="music, entertainment, viral (comma separated)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url || loading}
              className="flex-1 glass-button px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main App Content
const AppContent: React.FC = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth()
  const { videos, loading, error, deleteVideo, addVideoFromUrl } = useVideos()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [playingVideo, setPlayingVideo] = useState<any>(null)
  const [currentView, setCurrentView] = useState<'main' | 'admin' | 'login'>('main')
  const [showUploadForm, setShowUploadForm] = useState(false)

  const categories = ['All', 'News', 'Music', 'Podcast', 'Interview', 'Entertainment', 'Documentaries']

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           video.channel.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' ||
                             video.tags.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase())
      return matchesSearch && matchesCategory
    })
  }, [videos, searchQuery, selectedCategory])

  const handleUploadVideo = async (data: any) => {
    const { error } = await addVideoFromUrl(data.url, {
      title: data.title,
      channel: data.channel,
      description: data.description,
      tags: data.tags,
    })

    if (error) {
      alert(`Error adding video: ${error}`)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      const { error } = await deleteVideo(videoId)
      if (error) {
        alert(`Error deleting video: ${error}`)
      }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Login onClose={() => setCurrentView('main')} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Castillo Logo" className="h-16" />
            <h1 className="text-3xl font-bold text-white">YouTube Directory</h1>
          </div>

          <div className="flex items-center gap-4">
            {currentView === 'main' && (
              <button
                onClick={() => setCurrentView('admin')}
                className="apple-nav-button"
                title="Admin Panel"
              >
                <svg className="admin-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {currentView === 'admin' && (
              <button
                onClick={() => setCurrentView('main')}
                className="glass-button px-4 py-2"
              >
                ← Back to Home
              </button>
            )}

            {isAdmin && (
              <button
                onClick={signOut}
                className="glass-button px-4 py-2"
              >
                Sign Out
              </button>
            )}

            {!user && (
              <button
                onClick={() => setCurrentView('login')}
                className="glass-button px-4 py-2"
              >
                Admin Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, channels, or tags..."
              className="w-full px-4 py-3 bg-white/10 backdrop-filter backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div className="tags-container">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`standard-button ${selectedCategory === category ? 'bg-white/20' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      {currentView === 'admin' && isAdmin && (
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              <button
                onClick={() => setShowUploadForm(true)}
                className="glass-button px-6 py-2"
              >
                + Upload Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="text-white text-xl">Loading videos...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg">
            Error: {error}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {!loading && (
        <main className="main-content">
          <div className="video-grid">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onPlay={setPlayingVideo}
                onDelete={currentView === 'admin' ? handleDeleteVideo : undefined}
                isAdmin={currentView === 'admin' && isAdmin}
              />
            ))}
          </div>

          {filteredVideos.length === 0 && !loading && (
            <div className="text-center text-white/70 py-12">
              <p className="text-xl">No videos found</p>
              <p className="text-sm mt-2">Try adjusting your search or category filter</p>
            </div>
          )}
        </main>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-4xl w-full rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">{playingVideo.title}</h3>
              <button
                onClick={() => setPlayingVideo(null)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo.youtube_id}?autoplay=1`}
                width="100%"
                height="100%"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <UploadForm
          onClose={() => setShowUploadForm(false)}
          onSubmit={handleUploadVideo}
        />
      )}
    </div>
  )
}

// Main App with Auth Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App