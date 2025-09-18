import { useState, useMemo } from 'react'
import type { Video } from './types/video'
// import { glassStyles } from './glassmorphism-styles'

// Mock data
const videosData: Video[] = [
  {
    id: "1", youtube_id: "dQw4w9WgXcQ", youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up", channel: "Rick Astley",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    description: "The official video for Rick Astley's 'Never Gonna Give You Up' from 1987.",
    published_at: "2009-10-25T07:59:00Z", tags: ["Music", "Entertainment"],
    added_by_admin: false, created_at: new Date().toISOString()
  },
  {
    id: "2", youtube_id: "9bZkp7q19f0", youtube_url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE", channel: "officialpsy",
    thumbnail_url: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    description: "PSY's Gangnam Style became the first video to reach 1 billion views on YouTube.",
    published_at: "2012-07-15T08:34:00Z", tags: ["Music", "Entertainment"],
    added_by_admin: false, created_at: new Date().toISOString()
  },
  {
    id: "3", youtube_id: "fJ9rUzIMcZQ", youtube_url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    title: "Queen – Bohemian Rhapsody", channel: "Queen Official",
    thumbnail_url: "https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg",
    description: "The official remastered video for Queen's 'Bohemian Rhapsody'.",
    published_at: "2008-08-01T16:45:00Z", tags: ["Music", "Entertainment", "Documentaries"],
    added_by_admin: false, created_at: new Date().toISOString()
  },
  {
    id: "4", youtube_id: "kJQP7kiw5Fk", youtube_url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee", channel: "LuisFonsiVEVO",
    thumbnail_url: "https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
    description: "The official music video for Despacito, the most viewed video on YouTube.",
    published_at: "2017-01-12T21:30:00Z", tags: ["Music", "Entertainment"],
    added_by_admin: false, created_at: new Date().toISOString()
  },
  {
    id: "5", youtube_id: "YQHsXMglC9A", youtube_url: "https://www.youtube.com/watch?v=YQHsXMglC9A",
    title: "Adele - Hello", channel: "AdeleVEVO",
    thumbnail_url: "https://img.youtube.com/vi/YQHsXMglC9A/maxresdefault.jpg",
    description: "The official music video for Hello by Adele.",
    published_at: "2015-10-22T13:00:00Z", tags: ["Music", "Entertainment"],
    added_by_admin: false, created_at: new Date().toISOString()
  },
  {
    id: "6", youtube_id: "JGwWNGJdvx8", youtube_url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    title: "Ed Sheeran - Shape of You", channel: "Ed Sheeran",
    thumbnail_url: "https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg",
    description: "The official video for Ed Sheeran's single 'Shape of You'.",
    published_at: "2017-01-30T10:00:00Z", tags: ["Music", "Entertainment"],
    added_by_admin: false, created_at: new Date().toISOString()
  }
]

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [currentView, setCurrentView] = useState('main') // 'main', 'login', 'admin'
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [videos, setVideos] = useState(videosData)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadVideoData, setUploadVideoData] = useState<Video | null>(null)
  const [uploadStep, setUploadStep] = useState(1) // 1: URL only, 2: Show extracted data, 3: Confirm
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const videosPerPage = 6

  const categories = ['All', 'News', 'Music', 'Podcast', 'Interview', 'Entertainment', 'Documentaries']

  // Function to extract video data from YouTube URL
  const extractVideoDataFromUrl = async (url: string): Promise<Partial<Video> | null> => {
    try {
      // Extract YouTube ID properly from various URL formats
      const extractYouTubeId = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
      }

      const youtubeId = extractYouTubeId(url)
      if (!youtubeId) return null

      // Fetch real video data using YouTube oEmbed API
      try {
        const oEmbedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`)

        if (oEmbedResponse.ok) {
          const oEmbedData = await oEmbedResponse.json()

          return {
            id: `yt_${youtubeId}`,
            youtube_id: youtubeId,
            youtube_url: url,
            title: oEmbedData.title || `Video ${youtubeId}`,
            channel: oEmbedData.author_name || 'Unknown Channel',
            description: oEmbedData.title ? `${oEmbedData.title} by ${oEmbedData.author_name}` : 'Video description will be auto-populated',
            thumbnail_url: oEmbedData.thumbnail_url || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
            published_at: oEmbedData.upload_date ? new Date(oEmbedData.upload_date).toISOString() : new Date().toISOString(),
            tags: [],
            added_by_admin: false,
            created_at: new Date().toISOString()
          } as Video
        }
      } catch (fetchError) {
        console.log('oEmbed fetch failed, using fallback data:', fetchError)
      }

      // Fallback to basic data if oEmbed fails
      return {
        id: `yt_${youtubeId}`,
        youtube_id: youtubeId,
        youtube_url: url,
        title: `Video ${youtubeId}`,
        channel: 'Unknown Channel',
        description: 'Video description will be auto-populated',
        thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        published_at: new Date().toISOString(),
        tags: [],
        added_by_admin: false,
        created_at: new Date().toISOString()
      } as Video
    } catch (error) {
      console.error('Error extracting video data:', error)
      return null
    }
  }

  // Filter videos based on search query and category
  const filteredVideos = useMemo(() => {
    let filtered = videos

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(video =>
        video.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()))
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.channel.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [searchQuery, selectedCategory, videos])

  // Calculate pagination
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage)
  const startIndex = (currentPage - 1) * videosPerPage
  const currentVideos = filteredVideos.slice(startIndex, startIndex + videosPerPage)

  return (
    <div className="min-h-screen relative overflow-hidden font-sans bg-gray-950 text-white flex flex-col items-center justify-start p-4 md:p-8">
      {/* Removed the Tower Bridge Background div that was causing overflow issues */}

      {/* Removed secondary animated layer for simplicity and responsiveness. */}

      {/* Removed light overlay for simplicity and responsiveness. */}

      {/* Removed Paper Shader Background - Primary Layer for simplicity. */}

      {/* Removed Paper Shader Background - Wireframe Layer for simplicity. */}

      {/* Main content area */}
      <main className="relative z-10 w-full max-w-6xl mt-8 mb-8 px-4 md:px-0 flex flex-col items-center">
        {/* Header */}
        <header className="w-full text-center pb-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-2 leading-none" style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.6)' }}>
            MadeYouThin Directory
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Links to most videos posted on this page
          </p>

          {/* Search Bar */}
          <div className="max-w-600 mx-auto mb-8">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, channels, or tags..."
                className="w-full py-3 pl-12 pr-4 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="tag-scroll overflow-x-auto whitespace-nowrap mt-6 mb-4 flex justify-center">
            <div className="inline-flex gap-3 px-4 sm:px-0 min-w-max">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="px-4 py-2 bg-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.color = 'white'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        {currentView === 'main' && (
          <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Video Grid */}
            {filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8 justify-items-center">
                {currentVideos.map((video) => (
                  <div
                    key={video.id}
                    className="cursor-pointer transform transition-all"
                    onClick={() => setPlayingVideo(video)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    }}
                  >
                    <div className="relative overflow-hidden rounded-lg bg-gray-700 backdrop-blur-lg backdrop-saturate-180 border border-gray-600 shadow-lg transition-all duration-300 h-64 w-64 flex flex-col">
                      {/* Thumbnail */}
                      <div className="relative flex-0 auto h-40 overflow-hidden">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20"></div>

                        {/* HD Badge */}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-10 text-white text-xs px-2 py-1 rounded border border-gray-600">
                          HD
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <h3 className="text-white font-medium text-sm leading-6 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {video.title}
                        </h3>

                        <div className="flex items-center justify-end text-sm text-gray-400">
                          <span className="text-xs">
                            {new Date(video.published_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-2xl font-medium text-white mb-4">No videos found</h3>
                <p className="text-gray-400 font-light">Try adjusting your search terms</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center align-center gap-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all duration-300"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-gray-300 font-light">
                  {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        )}

        {/* Login Page */}
        {currentView === 'login' && (
          <main className="max-w-500 mx-auto px-4 pb-8 flex items-center justify-center min-h-60vh">
            <div className="bg-gray-700 backdrop-blur-20 border border-gray-600 rounded-2xl p-6 w-full shadow-lg">
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 leading-none">
                  Admin Login
                </h1>
                <div className="w-16 h-1 mx-auto border-b-2 rounded-full"></div>
              </div>

              <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const username = formData.get('username')
                const password = formData.get('password')

                if (username === 'Admin' && password === 'Admin') {
                  setIsLoggedIn(true)
                  setCurrentView('admin')
                } else {
                  alert('Invalid credentials')
                }
              }}>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    }}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentView('main')}
                    className="flex-1 px-4 py-3 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(31, 38, 135, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 24px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Login
                  </button>
                </div>
              </form>
            </div>
          </main>
        )}

        {/* Admin Dashboard */}
        {currentView === 'admin' && isLoggedIn && (
          <main className="max-w-1200 mx-auto px-4 pb-8">
            {/* Admin Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 leading-none">
                Welcome Admin
              </h1>

              <div className="w-32 h-1 mx-auto mb-4 border-b-2 rounded-full"></div>

              <div className="flex justify-center mb-4">
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(31, 38, 135, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 24px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  + Upload Video
                </button>
              </div>
            </div>

            {/* Local Video Search */}
            <div className="max-w-600 mx-auto mb-4">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search existing videos, channels, or tags..."
                  className="w-full py-3 pl-12 pr-4 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tags */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="px-4 py-2 bg-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300"
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.125)'
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Admin Video Grid */}
            {filteredVideos.length > 0 ? (
              <div className="grid grid-cols-auto-fit gap-8 mb-8 justify-center">
                {currentVideos.map((video) => (
                  <div
                    key={video.id}
                    className="transform transition-all"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-gray-700 backdrop-blur-lg backdrop-saturate-180 border border-gray-600 shadow-lg transition-all duration-300 h-64 w-64 flex flex-col">
                      {/* Admin Action Buttons */}
                      <div className="absolute top-2 right-2 flex gap-2 z-10">
                        <button
                          onClick={() => setPlayingVideo(video)}
                          className="w-10 h-10 p-0 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                            e.currentTarget.style.boxShadow = '0 6px 25px 0 rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                            e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.4)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 4px 20px 0 rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          ▶
                        </button>
                        <button
                          onClick={() => setEditingVideo(video)}
                          className="w-10 h-10 p-0 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)'
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                            e.currentTarget.style.boxShadow = '0 6px 25px 0 rgba(34, 197, 94, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                            e.currentTarget.style.border = '1px solid rgba(34, 197, 94, 0.4)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)'
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 4px 20px 0 rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.border = '1px solid rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this video?')) {
                              setVideos(prevVideos => prevVideos.filter(v => v.id !== video.id))
                            }
                          }}
                          className="w-10 h-10 p-0 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                            e.currentTarget.style.boxShadow = '0 6px 25px 0 rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                            e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.4)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 4px 20px 0 rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          ×
                        </button>
                      </div>

                      {/* Thumbnail */}
                      <div className="relative flex-0 auto h-40 overflow-hidden">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20"></div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <h3 className="text-white font-medium text-sm leading-6 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {video.title}
                        </h3>

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span className="text-xs">
                            {video.channel}
                          </span>
                          <span className="text-xs">
                            {new Date(video.published_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                  <h3 className="text-2xl font-medium text-white mb-4">No videos found</h3>
                  <p className="text-gray-400 font-light">Try adjusting your search terms</p>
              </div>
            )}

            {/* Admin Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center align-center gap-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all duration-300"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-gray-300 font-light">
                  {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        )}
      </main>

      {/* Edit Video Modal */}
      {editingVideo && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-20 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setEditingVideo(null)
            setSelectedThumbnail(null)
            setThumbnailPreview(null)
          }}
        >
          <div
            className="w-90vw max-w-600 max-h-90vh bg-black/40 backdrop-blur-20 border border-gray-600 rounded-2xl relative flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header with Close Button */}
            <div className="relative p-6 pb-4 flex-shrink-0">
              {/* Close Button */}
              <button
                onClick={() => {
                  setEditingVideo(null)
                  setSelectedThumbnail(null)
                  setThumbnailPreview(null)
                }}
                className="absolute top-4 right-4 w-10 h-10 p-0 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 25px 0 rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 20px 0 rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                ×
              </button>

              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 leading-none">
                  Edit Video
                </h2>
                <div className="w-16 h-1 mx-auto mb-4 border-b-2 rounded-full"></div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">

              <form id="edit-video-form" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const publishedDate = formData.get('published_date') as string | null

                // Handle thumbnail - use new upload if available, otherwise keep existing
                let thumbnailUrl = editingVideo.thumbnail_url
                if (selectedThumbnail) {
                  // In a real app, you would upload the file to a server/cloud storage
                  // For this demo, we'll use the base64 data URL
                  thumbnailUrl = thumbnailPreview ? (thumbnailPreview as string) : editingVideo.thumbnail_url
                }

                // Extract YouTube ID properly from various URL formats
                const extractYouTubeId = (url: string): string | null => {
                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                  const match = url.match(regExp)
                  return (match && match[2].length === 11) ? match[2] : null
                }

                const youtubeUrl = formData.get('youtube_url') as string | null
                const extractedId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null

                const updatedVideo = {
                  ...editingVideo,
                  title: formData.get('title') as string,
                  channel: formData.get('channel') as string,
                  description: formData.get('description') as string,
                  youtube_url: youtubeUrl as string,
                  youtube_id: (extractedId || editingVideo.youtube_id) as string, // Keep original ID if extraction fails
                  thumbnail_url: thumbnailUrl as string,
                  published_at: publishedDate ? new Date(publishedDate).toISOString() : editingVideo.published_at,
                  added_by_admin: editingVideo.added_by_admin, // Keep original value
                  created_at: editingVideo.created_at // Keep original value
                }

                setVideos(prevVideos =>
                  prevVideos.map(v => v.id === editingVideo.id ? updatedVideo : v)
                )
                setEditingVideo(null)
                setSelectedThumbnail(null)
                setThumbnailPreview(null)
              }}>
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingVideo.title}
                    required
                    className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Channel
                  </label>
                  <input
                    type="text"
                    name="channel"
                    defaultValue={editingVideo.channel}
                    required
                    className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    name="youtube_url"
                    defaultValue={editingVideo.youtube_url}
                    required
                    className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Published Date
                  </label>
                  <input
                    type="date"
                    name="published_date"
                    defaultValue={new Date(editingVideo.published_at).toISOString().split('T')[0]}
                    required
                    className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Thumbnail Image
                  </label>

                  {/* Current thumbnail preview */}
                  {(thumbnailPreview || editingVideo.thumbnail_url) && (
                    <div className="mb-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                      <p className="text-gray-400 text-sm mb-2">
                        {thumbnailPreview ? 'New thumbnail preview:' : 'Current thumbnail:'}
                      </p>
                      <img
                        src={thumbnailPreview || editingVideo.thumbnail_url}
                        alt="Thumbnail preview"
                        className="w-full max-w-200 h-auto rounded-md border border-gray-600"
                      />
                    </div>
                  )}

                  <div>
                    <input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files ? e.target.files[0] : null
                        if (file) {
                          setSelectedThumbnail(file)
                          const reader = new FileReader()
                          reader.onload = (event: ProgressEvent<FileReader>) => {
                            if (event.target && typeof event.target.result === 'string') {
                              setThumbnailPreview(event.target.result)
                            }
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="flex w-full p-3 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-all duration-300"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {selectedThumbnail ? selectedThumbnail.name : 'Click to upload new thumbnail image'}
                    </label>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingVideo.description}
                    rows={3}
                    className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </form>
            </div>

            {/* Fixed Footer with Action Buttons */}
            <div className="flex-shrink-0 p-6 pb-4 border-t border-gray-600 bg-black/20 backdrop-blur-20">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVideo(null)
                    setSelectedThumbnail(null)
                    setThumbnailPreview(null)
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-all duration-300"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(31, 38, 135, 0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 24px 0 rgba(31, 38, 135, 0.2)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-video-form"
                  className="flex-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(31, 38, 135, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 24px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Video Modal */}
      {showUploadForm && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-20 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowUploadForm(false)
            setUploadVideoData(null)
            setUploadStep(1)
          }}
        >
          <div
            className="w-90vw max-w-600 bg-black/40 backdrop-blur-20 border border-gray-600 rounded-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 leading-none">
                {uploadVideoData ? 'Add Video' : 'Upload New Video'}
              </h2>
              <div className="w-16 h-1 mx-auto mb-4 border-b-2 rounded-full"></div>
            </div>

            <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const youtubeUrl = formData.get('youtube_url') as string | null

              if (uploadStep === 1) {
                // Step 1: Extract video data from URL
                if (!youtubeUrl) {
                  alert('Please enter a YouTube URL')
                  return
                }
                const videoData = await extractVideoDataFromUrl(youtubeUrl)
                if (videoData) {
                  setUploadVideoData(videoData as Video)
                  setUploadStep(2)
                } else {
                  alert('Could not extract video data. Please check the URL.')
                }
              } else if (uploadStep === 2) {
                // Step 2: Final upload with extracted/edited data
                const youtubeId = uploadVideoData?.youtube_id as string
                const title = formData.get('title')

                if (!title) {
                  alert('Please fill in the title field')
                  return
                }

                const newVideo: Video = {
                  id: Date.now().toString(),
                  youtube_id: youtubeId as string,
                  youtube_url: uploadVideoData?.youtube_url as string,
                  title: (formData.get('title') || uploadVideoData?.title) as string,
                  channel: (formData.get('channel') || uploadVideoData?.channel) as string,
                  description: (formData.get('description') || uploadVideoData?.description || '') as string,
                  thumbnail_url: uploadVideoData?.thumbnail_url as string,
                  published_at: formData.get('published_date') ? new Date(formData.get('published_date') as string).toISOString() : new Date().toISOString(),
                  tags: uploadVideoData?.tags || [],
                  added_by_admin: true,
                  created_at: new Date().toISOString()
                }

                setVideos(prevVideos => [newVideo, ...prevVideos])
                setShowUploadForm(false)
                setUploadVideoData(null)
                setUploadStep(1)
              }
            }}>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  name="youtube_url"
                  defaultValue={uploadVideoData?.youtube_url || ''}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  disabled={uploadStep === 2}
                  className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onFocus={(e) => {
                    if (uploadStep !== 2) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                  onBlur={(e) => {
                    if (uploadStep !== 2) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
                />
              </div>

              {uploadStep === 2 && uploadVideoData && (
                <>
                  <div className="mb-4">
                    <label className="block text-white text-sm font-medium mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={uploadVideoData?.title || ''}
                      placeholder="Video title"
                      required
                      className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-white text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={uploadVideoData?.description || ''}
                      placeholder="Video description"
                      rows={3}
                      className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-white text-sm font-medium mb-2">
                      Channel
                    </label>
                    <input
                      type="text"
                      name="channel"
                      defaultValue={uploadVideoData?.channel || ''}
                      placeholder="Channel name"
                      required
                      className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-white text-sm font-medium mb-2">
                      Published Date
                    </label>
                    <input
                      type="date"
                      name="published_date"
                      defaultValue={uploadVideoData?.published_at ? new Date(uploadVideoData.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="w-full p-3 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false)
                    setUploadVideoData(null)
                    setUploadStep(1)
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-all duration-300"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(31, 38, 135, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 24px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {uploadStep === 1 ? 'Upload Video' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Video Player */}
      {playingVideo && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-20 z-50 flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="w-90vw h-80vh max-w-1200 bg-black/40 backdrop-blur-20 border border-gray-600 rounded-2xl overflow-hidden relative transition-all"
            onClick={(e) => e.stopPropagation()}
          >


            {/* YouTube Iframe */}
            <iframe
              src={`https://www.youtube.com/embed/${playingVideo.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

          * {
            font-family: "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          @keyframes meshFloat1 {
            0% { transform: translate(-10%, -10%) rotate(0deg) scale(1); }
            25% { transform: translate(-12%, -8%) rotate(0.5deg) scale(1.02); }
            50% { transform: translate(-8%, -12%) rotate(-0.3deg) scale(0.98); }
            75% { transform: translate(-11%, -9%) rotate(0.8deg) scale(1.01); }
            100% { transform: translate(-10%, -10%) rotate(0deg) scale(1); }
          }

          @keyframes meshFloat2 {
            0% { transform: translate(-10%, -10%) rotate(0.5deg) scale(1); }
            33% { transform: translate(-8%, -11%) rotate(-0.2deg) scale(1.01); }
            66% { transform: translate(-12%, -8%) rotate(0.7deg) scale(0.99); }
            100% { transform: translate(-10%, -10%) rotate(0.5deg) scale(1); }
          }

          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(10px, -15px) rotate(1deg); }
            50% { transform: translate(-5px, -25px) rotate(-0.5deg); }
            75% { transform: translate(15px, -10px) rotate(1.5deg); }
          }

          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            30% { transform: translate(-12px, 20px) rotate(-1deg); }
            60% { transform: translate(8px, -15px) rotate(0.8deg); }
          }

          @keyframes float3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            40% { transform: translate(20px, 10px) rotate(2deg); }
            80% { transform: translate(-10px, 25px) rotate(-1deg); }
          }

          @keyframes moveGradient1 {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            25% { transform: translate(100px, 50px) rotate(90deg) scale(1.1); }
            50% { transform: translate(150px, -30px) rotate(180deg) scale(0.9); }
            75% { transform: translate(50px, 80px) rotate(270deg) scale(1.05); }
            100% { transform: translate(0, 0) rotate(360deg) scale(1); }
          }

          @keyframes moveGradient2 {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            30% { transform: translate(-80px, 60px) rotate(60deg) scale(1.2); }
            60% { transform: translate(-120px, -40px) rotate(120deg) scale(0.8); }
            100% { transform: translate(0, 0) rotate(180deg) scale(1); }
          }

          @keyframes moveGradient3 {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            20% { transform: translate(70px, -50px) rotate(45deg) scale(1.15); }
            40% { transform: translate(-40px, -80px) rotate(90deg) scale(0.95); }
            60% { transform: translate(-100px, 30px) rotate(135deg) scale(1.1); }
            80% { transform: translate(20px, 70px) rotate(180deg) scale(0.9); }
            100% { transform: translate(0, 0) rotate(225deg) scale(1); }
          }

          @keyframes moveGradient4 {
            0% { transform: translate(0, 0) rotate(0deg) scale(1) skew(0deg); }
            25% { transform: translate(-60px, 40px) rotate(30deg) scale(1.1) skew(2deg); }
            50% { transform: translate(80px, 20px) rotate(60deg) scale(0.9) skew(-1deg); }
            75% { transform: translate(-30px, -50px) rotate(90deg) scale(1.05) skew(1deg); }
            100% { transform: translate(0, 0) rotate(120deg) scale(1) skew(0deg); }
          }

          @keyframes moveGradient5 {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            33% { transform: translate(90px, -70px) rotate(40deg) scale(1.2); }
            66% { transform: translate(-110px, 50px) rotate(80deg) scale(0.85); }
            100% { transform: translate(0, 0) rotate(120deg) scale(1); }
          }

          @keyframes moveGradient6 {
            0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
            25% { transform: translate(-30%, -70%) rotate(45deg) scale(1.1); }
            50% { transform: translate(-70%, -30%) rotate(90deg) scale(0.9); }
            75% { transform: translate(-60%, -60%) rotate(135deg) scale(1.05); }
            100% { transform: translate(-50%, -50%) rotate(180deg) scale(1); }
          }

          @keyframes colorPulse1 {
            0%, 100% { opacity: 0.15; transform: translate(0, 0) scale(1); }
            25% { opacity: 0.25; transform: translate(20px, -30px) scale(1.1); }
            50% { opacity: 0.08; transform: translate(-15px, 25px) scale(0.9); }
            75% { opacity: 0.2; transform: translate(25px, 10px) scale(1.05); }
          }

          @keyframes colorPulse2 {
            0%, 100% { opacity: 0.12; transform: translate(0, 0) scale(1); }
            30% { opacity: 0.2; transform: translate(-25px, 20px) scale(1.15); }
            60% { opacity: 0.06; transform: translate(30px, -15px) scale(0.85); }
          }

          @keyframes colorPulse3 {
            0%, 100% { opacity: 0.1; transform: scale(1); }
            33% { opacity: 0.18; transform: scale(1.2); }
            66% { opacity: 0.05; transform: scale(0.8); }
          }

          @keyframes colorPulse4 {
            0%, 100% { opacity: 0.08; transform: translate(0, 0) scale(1); }
            40% { opacity: 0.15; transform: translate(35px, -20px) scale(1.1); }
            80% { opacity: 0.04; transform: translate(-20px, 30px) scale(0.9); }
          }

          @keyframes colorPulse5 {
            0%, 100% { opacity: 0.12; transform: translate(0, 0) scale(1); }
            50% { opacity: 0.22; transform: translate(-30px, -25px) scale(1.3); }
          }

          @keyframes moveGradient7 {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(100px, 80px) rotate(90deg); }
            50% { transform: translate(-50px, 120px) rotate(180deg); }
            75% { transform: translate(-80px, -60px) rotate(270deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }

          @keyframes moveGradient8 {
            0% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(-70px, -90px) rotate(120deg); }
            66% { transform: translate(90px, -40px) rotate(240deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }

          @keyframes moveGradient9 {
            0% { transform: translate(0, 0) rotate(0deg); }
            20% { transform: translate(60px, -80px) rotate(72deg); }
            40% { transform: translate(-40px, -100px) rotate(144deg); }
            60% { transform: translate(-90px, 30px) rotate(216deg); }
            80% { transform: translate(20px, 90px) rotate(288deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }

          @keyframes moveGradient10 {
            0% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-120px, 70px) rotate(180deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }

          @keyframes spinSlow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
          }

          @keyframes videoFlow {
            0% {
              transform: translate(-5%, -5%) scale(1) rotate(0deg);
              filter: blur(80px) hue-rotate(0deg);
            }
            25% {
              transform: translate(2%, -2%) scale(1.05) rotate(1deg);
              filter: blur(85px) hue-rotate(90deg);
            }
            50% {
              transform: translate(5%, 3%) scale(1.1) rotate(0deg);
              filter: blur(90px) hue-rotate(180deg);
            }
            75% {
              transform: translate(-2%, 5%) scale(1.05) rotate(-1deg);
              filter: blur(85px) hue-rotate(270deg);
            }
            100% {
              transform: translate(-5%, -5%) scale(1) rotate(0deg);
              filter: blur(80px) hue-rotate(360deg);
            }
          }

          @keyframes videoFlow2 {
            0% {
              transform: translate(3%, 3%) scale(1.1) rotate(0deg);
              opacity: 0.4;
            }
            33% {
              transform: translate(-3%, 1%) scale(1.05) rotate(2deg);
              opacity: 0.6;
            }
            66% {
              transform: translate(1%, -3%) scale(1.15) rotate(-1deg);
              opacity: 0.5;
            }
            100% {
              transform: translate(3%, 3%) scale(1.1) rotate(0deg);
              opacity: 0.4;
            }
          }

          @keyframes particleFloat {
            0% {
              transform: translate(0, 0) rotate(0deg);
              background-position: 0% 0%, 0% 0%, 0% 0%;
            }
            25% {
              transform: translate(-20px, -10px) rotate(90deg);
              background-position: 25% 25%, 50% 25%, 75% 25%;
            }
            50% {
              transform: translate(0, -20px) rotate(180deg);
              background-position: 50% 50%, 100% 50%, 0% 50%;
            }
            75% {
              transform: translate(20px, -10px) rotate(270deg);
              background-position: 75% 75%, 50% 75%, 25% 75%;
            }
            100% {
              transform: translate(0, 0) rotate(360deg);
              background-position: 100% 100%, 100% 100%, 100% 100%;
            }
          }

          input::placeholder { color: #9ca3af; }

          /* Performance optimizations */
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }

          /* Backdrop filter support */
          @supports (backdrop-filter: blur(10px)) {
            .glassmorphic {
              backdrop-filter: blur(10px);
            }
          }

          /* Hide scrollbars for horizontal tag scrolling */
          .tag-scroll::-webkit-scrollbar {
            display: none;
          }

          .tag-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
            scroll-behavior: smooth;
          }

          /* Mobile and Desktop Background Control */
          .mobile-bg {
            display: none;
          }

          .desktop-bg {
            display: block;
          }

          @media (max-width: 1024px) {
            .mobile-bg {
              display: block !important;
              z-index: -1 !important;
            }
            .desktop-bg {
              display: none !important;
            }
          }

          @media (min-width: 1025px) {
            .mobile-bg {
              display: none !important;
            }
            .desktop-bg {
              display: block !important;
            }
          }
        `
      }} />
    </div>
  )
}

export default App
