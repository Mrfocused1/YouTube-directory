import React, { useState, useMemo } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useVideos } from './hooks/useVideos'
import { Login } from './components/Login'

// Header Component
const Header: React.FC<{
  onBackToHome: () => void
  onLoginClick: () => void
  onSignOut: () => void
  currentView: 'main' | 'admin' | 'login'
  isAdmin: boolean
  user: any
}> = ({ onBackToHome, onLoginClick, onSignOut, currentView, isAdmin, user }) => {
  return (
    <header className="flex items-center justify-between p-6">
      <div>
        <h1 className="site-title">MadeYouThink Directory</h1>
        <p className="site-subtitle">Discover amazing content</p>
      </div>

      <div className="flex items-center gap-4">
        {currentView === 'admin' && (
          <button
            onClick={onBackToHome}
            className="btn glass-button"
          >
            ← Back to Home
          </button>
        )}

        {isAdmin && (
          <button
            onClick={onSignOut}
            className="btn glass-button"
          >
            Sign Out
          </button>
        )}

        {!user && (
          <button
            onClick={onLoginClick}
            className="btn btn-primary"
          >
            Admin Login
          </button>
        )}
      </div>
    </header>
  )
}

// Search Bar Component
const SearchBar: React.FC<{
  value: string
  onChange: (value: string) => void
  placeholder?: string
}> = ({ value, onChange, placeholder = "Search videos, channels, or tags..." }) => {
  return (
    <div className="search-container">
      <label htmlFor="video-search" className="sr-only">
        Search videos
      </label>
      <input
        id="video-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-bar"
        aria-label="Search videos, channels, or tags"
      />
    </div>
  )
}

// Category Pills Component
const CategoryPills: React.FC<{
  categories: string[]
  selectedCategory: string
  onCategorySelect: (category: string) => void
}> = ({ categories, selectedCategory, onCategorySelect }) => {
  return (
    <div className="category-pills" role="tablist" aria-label="Video categories">
      {categories.map(category => (
        <button
          key={category}
          onClick={() => onCategorySelect(category)}
          className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
          role="tab"
          aria-selected={selectedCategory === category}
          aria-label={`Filter by ${category} category`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

// Video Card Component
const VideoCard: React.FC<{
  video: any
  onPlay: (video: any) => void
  onEdit?: (video: any) => void
  onDelete?: (videoId: string) => void
  isAdmin?: boolean
}> = ({ video, onPlay, onEdit, onDelete, isAdmin }) => {
  return (
    <article className="video-card glass-card" role="article" aria-labelledby={`video-title-${video.id}`}>
      <div className="video-thumbnail-container">
        <img
          src={video.thumbnail_url}
          alt={`Thumbnail for ${video.title} by ${video.channel}`}
          className="video-thumbnail"
        />

        {/* Play Button Overlay */}
        <button
          className="play-overlay"
          onClick={() => onPlay(video)}
          aria-label={`Play ${video.title}`}
          tabIndex={0}
        >
          <div className="play-icon"></div>
        </button>

        {/* Video Duration Badge */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
            4K
          </span>
        </div>
      </div>

      <div className="video-info">
        <h3 id={`video-title-${video.id}`} className="video-title">{video.title}</h3>
        <p className="video-channel">{video.channel}</p>

        {video.tags && video.tags.length > 0 && (
          <div className="video-meta">
            {video.tags.slice(0, 3).map((tag: string, index: number) => (
              <span key={index} className="text-xs">#{tag}</span>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onPlay(video)}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-3 py-2 rounded-xl text-sm transition-colors"
            >
              Play
            </button>
            <button
              onClick={() => onEdit?.(video)}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-2 rounded-xl text-sm transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(video.id)}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-xl text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

// Video Grid Component
const VideoGrid: React.FC<{
  videos: any[]
  onPlay: (video: any) => void
  onEdit?: (video: any) => void
  onDelete?: (videoId: string) => void
  isAdmin?: boolean
}> = ({ videos, onPlay, onEdit, onDelete, isAdmin }) => {
  return (
    <div className="video-grid">
      {videos.map(video => (
        <VideoCard
          key={video.id}
          video={video}
          onPlay={onPlay}
          onEdit={onEdit}
          onDelete={onDelete}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  )
}

// Upload Form Component
const UploadForm: React.FC<{
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
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
    <div className="modal-overlay">
      <div className="modal">
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
              className="flex-1 btn btn-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Video Player Modal Component
const VideoPlayerModal: React.FC<{
  video: any
  onClose: () => void
}> = ({ video, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold text-lg">{video.title}</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1`}
            width="100%"
            height="100%"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  )
}

// Pagination Component
const Pagination: React.FC<{
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn glass-button disabled:opacity-50"
      >
        ← Previous
      </button>

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`btn ${currentPage === page ? 'btn-primary' : 'glass-button'}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn glass-button disabled:opacity-50"
      >
        Next →
      </button>
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
  const [currentPage, setCurrentPage] = useState(1)

  const categories = ['All', 'News', 'Music', 'Podcast', 'Interview', 'Entertainment', 'Documentaries']
  const videosPerPage = 6

  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           video.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (video.tags && video.tags.some((tag: string) =>
                             tag.toLowerCase().includes(searchQuery.toLowerCase())
                           ))
      const matchesCategory = selectedCategory === 'All' ||
                             (video.tags && video.tags.some((tag: string) =>
                               tag.toLowerCase() === selectedCategory.toLowerCase()
                             ))
      return matchesSearch && matchesCategory
    })
  }, [videos, searchQuery, selectedCategory])

  const paginatedVideos = useMemo(() => {
    const startIndex = (currentPage - 1) * videosPerPage
    return filteredVideos.slice(startIndex, startIndex + videosPerPage)
  }, [filteredVideos, currentPage, videosPerPage])

  const totalPages = Math.ceil(filteredVideos.length / videosPerPage)

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

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1) // Reset to first page when category changes
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when search changes
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-lg">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Login
          onClose={() => {
            console.log('Login onClose called')
            setCurrentView('main')
          }}
          onLoginSuccess={() => {
            console.log('Login onLoginSuccess called')
            setCurrentView('admin')
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <Header
          onBackToHome={() => setCurrentView('main')}
          onLoginClick={() => setCurrentView('login')}
          onSignOut={signOut}
          currentView={currentView}
          isAdmin={isAdmin}
          user={user}
        />

        {/* Welcome Section */}
        {currentView === 'main' && (
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-light text-white mb-8">Welcome to the Directory</h1>
          </div>
        )}

        {/* Search and Filters */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search existing videos, channels, or tags..."
        />

        <CategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategoryChange}
        />

        {/* Admin Controls */}
        {currentView === 'admin' && isAdmin && (
          <div className="mb-8">
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="btn btn-primary"
                >
                  + Upload Video
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="video-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass-card">
                <div className="skeleton skeleton-card"></div>
                <div className="video-info">
                  <div className="skeleton skeleton-text"></div>
                  <div className="skeleton skeleton-text" style={{ maxWidth: '60%' }}></div>
                  <div className="skeleton skeleton-text" style={{ maxWidth: '40%' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8">
            <div className="glass-card p-6 text-center">
              <div className="text-red-400 text-2xl mb-3">⚠️</div>
              <h3 className="text-white text-lg font-semibold mb-2">Connection Issue</h3>
              <p className="text-white/70 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {!loading && !error && (
          <main className="main-content">
            <VideoGrid
              videos={paginatedVideos}
              onPlay={setPlayingVideo}
              onEdit={currentView === 'admin' ? (video) => console.log('Edit video:', video) : undefined}
              onDelete={currentView === 'admin' ? handleDeleteVideo : undefined}
              isAdmin={currentView === 'admin' && isAdmin}
            />

            {filteredVideos.length === 0 && !loading && !error && (
              <div className="text-center text-white/70 py-12">
                <div className="glass-card inline-block p-8 rounded-lg">
                  <div className="text-4xl mb-4">🎬</div>
                  <p className="text-xl mb-2 text-white">No videos found</p>
                  <p className="text-sm text-white/60 mb-4">
                    {searchQuery || selectedCategory !== 'All'
                      ? 'Try adjusting your search or category filter'
                      : 'No videos have been added yet'}
                  </p>
                  {(searchQuery || selectedCategory !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCategory('All')
                      }}
                      className="btn glass-button text-sm"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </main>
        )}

        {/* Video Player Modal */}
        {playingVideo && (
          <VideoPlayerModal
            video={playingVideo}
            onClose={() => setPlayingVideo(null)}
          />
        )}

        {/* Upload Form Modal */}
        {showUploadForm && (
          <UploadForm
            onClose={() => setShowUploadForm(false)}
            onSubmit={handleUploadVideo}
          />
        )}
      </div>
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