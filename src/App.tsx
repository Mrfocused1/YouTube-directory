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
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Tower Bridge Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -10,
          backgroundImage: 'url(/tower-bridge.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px) brightness(0.6) contrast(1.1)',
        }}
      />

      {/* Secondary animated layer */}
      <div
        style={{
          position: 'fixed',
          top: '-5%',
          left: '-5%',
          width: '110%',
          height: '110%',
          zIndex: -9,
          background: `
            radial-gradient(ellipse at 60% 40%, rgba(30, 41, 59, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(51, 65, 85, 0.5) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(71, 85, 105, 0.4) 0%, transparent 60%)
          `,
          filter: 'blur(30px)',
          animation: 'videoFlow2 25s ease-in-out infinite alternate-reverse',
          willChange: 'transform'
        }}
      />

      {/* Particle effect layer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -8,
          background: `
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 150px 150px, 80px 80px',
          animation: 'particleFloat 30s linear infinite',
          willChange: 'transform'
        }}
      />

      {/* Light overlay for readability */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -7,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Paper Shader Background - Primary Layer - Commented out to show Tower Bridge */}
      {/* <div
        className="desktop-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '120%',
          height: '120%',
          zIndex: -3,
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(219, 39, 119, 0.45) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 20%, rgba(147, 51, 234, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 10% 90%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
            linear-gradient(135deg,
              rgba(0, 0, 0, 0.8) 0%,
              rgba(30, 30, 30, 0.7) 25%,
              rgba(15, 15, 25, 0.75) 50%,
              rgba(25, 15, 30, 0.7) 75%,
              rgba(0, 0, 0, 0.8) 100%
            )
          `,
          transform: 'translate(-10%, -10%)',
          willChange: 'transform',
          animation: 'meshFloat1 20s ease-in-out infinite alternate'
        }}
      /> */}

      {/* Paper Shader Background - Wireframe Layer - Commented out to show Tower Bridge */}
      {/* <div
        className="desktop-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '120%',
          height: '120%',
          zIndex: -2,
          opacity: 0.6,
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 60%, rgba(167, 139, 250, 0.3) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 90%, rgba(255, 255, 255, 0.18) 0%, transparent 35%),
            radial-gradient(ellipse at 85% 30%, rgba(196, 181, 253, 0.25) 0%, transparent 40%),
            conic-gradient(from 0deg at 50% 50%,
              rgba(139, 92, 246, 0.2) 0deg,
              transparent 60deg,
              rgba(219, 39, 119, 0.18) 120deg,
              transparent 180deg,
              rgba(59, 130, 246, 0.2) 240deg,
              transparent 300deg,
              rgba(139, 92, 246, 0.2) 360deg
            )
          `,
          transform: 'translate(-10%, -10%) rotate(0.5deg)',
          willChange: 'transform',
          animation: 'meshFloat2 15s ease-in-out infinite alternate-reverse'
        }}
      /> */}

      {/* Paper Texture Overlay - Commented out to show Tower Bridge */}
      {/* <div
        className="desktop-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.01) 2px,
              rgba(255, 255, 255, 0.01) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.01) 2px,
              rgba(255, 255, 255, 0.01) 4px
            )
          `,
          mixBlendMode: 'overlay'
        }}
      /> */}

      {/* Floating Elements - Commented out to show Tower Bridge */}
      {/* <div className="desktop-bg" style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float1 8s ease-in-out infinite'
      }}></div> */}
      {/* <div className="desktop-bg" style={{
        position: 'absolute',
        top: '60%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(219, 39, 119, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(30px)',
        animation: 'float2 10s ease-in-out infinite reverse'
      }}></div> */}
      {/* <div className="desktop-bg" style={{
        position: 'absolute',
        bottom: '20%',
        left: '20%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(25px)',
        animation: 'float3 6s ease-in-out infinite'
      }}></div> */}

      {/* Moving Blurred Gradients Layer 1 - Commented out to show Tower Bridge */}
      {/* <div className="desktop-bg" style={{
        position: 'absolute',
        top: '0%',
        left: '0%',
        width: '400px',
        height: '300px',
        background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.35) 0%, rgba(79, 70, 229, 0.25) 50%, transparent 100%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'moveGradient1 25s ease-in-out infinite',
        willChange: 'transform'
      }}></div>

      {/* All gradient elements commented out to show Tower Bridge background */}
      {/*
      <div className="desktop-bg" style={{
        position: 'absolute',
        top: '40%',
        right: '0%',
        width: '350px',
        height: '250px',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(219, 39, 119, 0.22) 50%, transparent 100%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        animation: 'moveGradient2 30s ease-in-out infinite reverse',
        willChange: 'transform'
      }}></div>

      <div className="desktop-bg" style={{
        position: 'absolute',
        bottom: '0%',
        left: '30%',
        width: '300px',
        height: '200px',
        background: 'linear-gradient(225deg, rgba(59, 130, 246, 0.28) 0%, rgba(37, 99, 235, 0.2) 50%, transparent 100%)',
        borderRadius: '50%',
        filter: 'blur(45px)',
        animation: 'moveGradient3 35s ease-in-out infinite',
        willChange: 'transform'
      }}></div>
      */}

      {/* Moving Blurred Gradients Layer 2 - Commented out */}
      {/*
      <div className="desktop-bg" style={{
        position: 'absolute',
        top: '15%',
        right: '20%',
        width: '250px',
        height: '180px',
        background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.22) 0%, rgba(147, 51, 234, 0.15) 60%, transparent 100%)',
        borderRadius: '60% 40% 30% 70%',
        filter: 'blur(55px)',
        animation: 'moveGradient4 28s ease-in-out infinite reverse',
        willChange: 'transform'
      }}></div>

      <div className="desktop-bg" style={{
        position: 'absolute',
        top: '70%',
        left: '5%',
        width: '320px',
        height: '220px',
        background: 'conic-gradient(from 90deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.18) 25%, transparent 50%, rgba(219, 39, 119, 0.2) 75%, rgba(139, 92, 246, 0.25) 100%)',
        borderRadius: '40% 60% 70% 30%',
        filter: 'blur(70px)',
        animation: 'moveGradient5 40s ease-in-out infinite',
        willChange: 'transform'
      }}></div>

      <div className="desktop-bg" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '200px',
        height: '160px',
        background: 'linear-gradient(315deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.18) 40%, transparent 80%)',
        borderRadius: '30% 70% 60% 40%',
        filter: 'blur(40px)',
        animation: 'moveGradient6 32s ease-in-out infinite reverse',
        willChange: 'transform',
        transform: 'translate(-50%, -50%)'
      }}></div>
      */}

      {/* Additional Animated Color Elements - Commented out */}
      {/*
      <div className="desktop-bg" style={{
        position: 'absolute',
        top: '10%',
        left: '70%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255, 0, 128, 0.15) 0%, rgba(255, 105, 180, 0.1) 30%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'colorPulse1 25s ease-in-out infinite, moveGradient7 45s ease-in-out infinite',
        willChange: 'transform, opacity'
      }}></div>

      <div className="desktop-bg" style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(0, 255, 255, 0.12) 0%, rgba(64, 224, 208, 0.08) 40%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(75px)',
        animation: 'colorPulse2 30s ease-in-out infinite reverse, moveGradient8 35s ease-in-out infinite reverse',
        willChange: 'transform, opacity'
      }}></div>

      <div className="desktop-bg" style={{
        position: 'absolute',
        top: '60%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: 'conic-gradient(from 180deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.08) 25%, transparent 50%, rgba(255, 69, 0, 0.06) 75%, rgba(255, 215, 0, 0.1) 100%)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        animation: 'colorPulse3 20s ease-in-out infinite, spinSlow 60s linear infinite',
        willChange: 'transform, opacity'
      }}></div>

      <div className="desktop-bg" style={{
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '280px',
        height: '280px',
        background: 'linear-gradient(45deg, rgba(124, 252, 0, 0.08) 0%, rgba(50, 205, 50, 0.06) 50%, transparent 100%)',
        borderRadius: '50%',
        filter: 'blur(85px)',
        animation: 'colorPulse4 35s ease-in-out infinite reverse, moveGradient9 50s ease-in-out infinite',
        willChange: 'transform, opacity'
      }}></div>

      <div className="desktop-bg" style={{
        position: 'absolute',
        bottom: '30%',
        left: '60%',
        width: '380px',
        height: '250px',
        background: 'radial-gradient(ellipse, rgba(138, 43, 226, 0.12) 0%, rgba(75, 0, 130, 0.08) 50%, transparent 100%)',
        borderRadius: '70% 30% 60% 40%',
        filter: 'blur(95px)',
        animation: 'colorPulse5 28s ease-in-out infinite, moveGradient10 40s ease-in-out infinite reverse',
        willChange: 'transform, opacity'
      }}></div>
      */}

      {/* Admin Button */}
      {currentView === 'main' && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '2rem',
          zIndex: 50
        }}>
          <button
            onClick={() => setCurrentView('login')}
            className="apple-nav-button"
            aria-label="Admin Login"
          >
            <svg className="admin-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21C19 17.134 15.866 14 12 14Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      )}

      {/* Home Button on Admin Dashboard */}
      {currentView === 'admin' && isLoggedIn && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '2rem',
          zIndex: 50
        }}>
          <button
            onClick={() => {
              setCurrentView('main')
              setIsLoggedIn(false)
            }}
            className="apple-nav-button"
            aria-label="Return to Homepage"
          >
            <svg className="admin-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.02 2.84L3.63 7.04C2.73 7.74 2 9.23 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29 21.19 7.74 20.2 7.05L14.02 2.72C12.62 1.74 10.37 1.79 9.02 2.84Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
              <path d="M12 15.5V12.5" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      <div style={{
        position: 'relative',
        zIndex: 10,
        paddingTop: '4rem',
        paddingBottom: '2rem'
      }}>
        {/* Header */}
        <header style={{ paddingBottom: '2rem' }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1.5rem',
            position: 'relative'
          }}>

            {/* Title */}
            {currentView === 'main' && (
              <div style={{ textAlign: 'center' }}>
                <h1 style={{
                  fontSize: 'clamp(2rem, 8vw, 3rem)',
                  fontWeight: '200',
                  color: 'white',
                  marginBottom: '1rem',
                  letterSpacing: '-0.02em',
                  margin: 0,
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>
                  MadeYouThink Directory
                </h1>
              <p style={{
                fontSize: '18px',
                color: '#9ca3af',
                fontWeight: '400',
                margin: '0 0 2rem 0'
              }}>
                Links to most videos posted on this page
              </p>

              {/* Search Bar */}
              <div style={{
                maxWidth: '600px',
                margin: '0 auto 2rem auto'
              }}>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1rem 1.5rem',
                  boxShadow: 'inset 0 2px 8px 0 rgba(0, 0, 0, 0.2), 0 4px 24px 0 rgba(31, 38, 135, 0.2)'
                }}>
                  <svg style={{
                    width: '20px',
                    height: '20px',
                    color: '#9ca3af',
                    marginRight: '1rem'
                  }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search videos, channels, or tags..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '300',
                      border: 'none',
                      outline: 'none'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        marginLeft: '1rem',
                        padding: '0.5rem',
                        color: '#9ca3af',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer'
                      }}
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filters */}
              <div className="tag-scroll" style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                whiteSpace: 'nowrap',
                marginTop: '2rem',
                paddingBottom: '0.5rem',
                WebkitOverflowScrolling: 'touch'
              }}>
                <div style={{
                  display: 'inline-flex',
                  gap: '0.75rem',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  minWidth: 'max-content'
                }}>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedCategory === category
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(12px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                      border: selectedCategory === category
                        ? '1px solid rgba(255, 255, 255, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      color: selectedCategory === category ? 'white' : 'rgba(255, 255, 255, 0.8)',
                      fontSize: '13px',
                      fontWeight: selectedCategory === category ? '500' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
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
            </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        {currentView === 'main' && (
          <main style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1.5rem 5rem 1.5rem'
          }}>

          {/* Video Grid */}
          {filteredVideos.length > 0 ? (
            <div className="video-grid">
              {currentVideos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    cursor: 'pointer',
                    transform: 'translateY(0)',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setPlayingVideo(video)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  }}
                >
                  <div style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.125)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: '220px',
                    width: '220px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Thumbnail */}
                    <div style={{
                      position: 'relative',
                      flex: '0 0 auto',
                      height: '120px',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.7s ease'
                        }}
                        loading="lazy"
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                      }}></div>

                      {/* HD Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontSize: '12px',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        HD
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{
                      padding: '1.5rem',
                      flex: '1 1 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <h3 style={{
                        color: 'white',
                        fontWeight: '500',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        margin: '0 0 0.75rem 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {video.title}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        fontSize: '14px',
                        color: '#9ca3af'
                      }}>
                        <span style={{ fontSize: '12px' }}>
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
            <div style={{
              textAlign: 'center',
              paddingTop: '5rem',
              paddingBottom: '5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '300',
                color: 'white',
                marginBottom: '0.75rem',
                margin: '0 0 0.75rem 0'
              }}>No videos found</h3>
              <p style={{
                color: '#9ca3af',
                fontWeight: '300',
                margin: 0
              }}>Try adjusting your search terms</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.125)',
                  background: currentPage === 1 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: currentPage === 1 ? 'none' : '0 4px 24px 0 rgba(31, 38, 135, 0.2)',
                  color: currentPage === 1 ? '#6b7280' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px'
                }}
              >
                Previous
              </button>

              <span style={{
                padding: '0.75rem 1.5rem',
                color: 'white',
                fontWeight: '300'
              }}>
                {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  backdropFilter: 'blur(12px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.125)',
                  background: currentPage === totalPages ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: currentPage === totalPages ? 'none' : '0 4px 24px 0 rgba(31, 38, 135, 0.2)',
                  color: currentPage === totalPages ? '#6b7280' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px'
                }}
              >
                Next
              </button>
            </div>
          )}
        </main>
        )}

        {/* Login Page */}
        {currentView === 'login' && (
          <main style={{
            maxWidth: '500px',
            margin: '0 auto',
            padding: '0 1.5rem 5rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
          }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '3rem',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: '200',
                  color: 'white',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                  margin: '0 0 0.5rem 0'
                }}>
                  Admin Login
                </h1>
                <div style={{
                  width: '60px',
                  height: '2px',
                  display: 'none',
                  margin: '1rem auto',
                  borderRadius: '1px'
                }}></div>
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
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '400',
                    marginBottom: '0.5rem'
                  }}>
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
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

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '400',
                    marginBottom: '0.5rem'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
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

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentView('main')}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '16px',
                      fontWeight: '400',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
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
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
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
          <main style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1.5rem 5rem 1.5rem'
          }}>
            {/* Admin Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: '200',
                color: 'white',
                letterSpacing: '-0.02em',
                margin: '0 0 2rem 0'
              }}>
                Welcome Admin
              </h1>

              <div style={{
                width: '96px',
                height: '2px',
                display: 'none',
                margin: '1rem auto 2rem auto',
                borderRadius: '1px'
              }}></div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <button
                  onClick={() => setShowUploadForm(true)}
                  style={{
                    padding: '1rem 2rem',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.5px'
                  }}
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
            <div style={{
              maxWidth: '600px',
              margin: '0 auto 2rem auto'
            }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1rem 1.5rem',
                boxShadow: 'inset 0 2px 8px 0 rgba(0, 0, 0, 0.2), 0 4px 24px 0 rgba(31, 38, 135, 0.2)'
              }}>
                <svg style={{
                  width: '20px',
                  height: '20px',
                  color: '#9ca3af',
                  marginRight: '1rem'
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search existing videos, channels, or tags..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '300',
                    border: 'none',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      marginLeft: '1rem',
                      padding: '0.5rem',
                      color: '#9ca3af',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer'
                    }}
                  >
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tags */}
            <div className="tag-scroll" style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              marginTop: '2rem',
              marginBottom: '3rem',
              paddingBottom: '0.5rem',
              WebkitOverflowScrolling: 'touch'
            }}>
              <div style={{
                display: 'inline-flex',
                gap: '0.75rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                minWidth: 'max-content'
              }}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: selectedCategory === category
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                    border: selectedCategory === category
                      ? '1px solid rgba(255, 255, 255, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.125)',
                    borderRadius: '12px',
                    boxShadow: selectedCategory === category
                      ? '0 4px 24px 0 rgba(31, 38, 135, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                      : '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: selectedCategory === category ? '500' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.25px'
                  }}
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
            </div>

            {/* Admin Video Grid */}
            {filteredVideos.length > 0 ? (
              <div className="video-grid">
                {currentVideos.map((video) => (
                  <div
                    key={video.id}
                    style={{
                      transform: 'translateY(0)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.125)',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      height: '220px',
                    width: '220px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Admin Action Buttons */}
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        display: 'flex',
                        gap: '0.75rem',
                        zIndex: 10
                      }}>
                        <button
                          onClick={() => setPlayingVideo(video)}
                          style={{
                            width: '40px',
                            height: '40px',
                            padding: '0',
                            background: 'rgba(59, 130, 246, 0.15)',
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px 0 rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            color: 'rgba(59, 130, 246, 1)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
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
                          style={{
                            width: '40px',
                            height: '40px',
                            padding: '0',
                            background: 'rgba(34, 197, 94, 0.15)',
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px 0 rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            color: 'rgba(34, 197, 94, 1)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
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
                          style={{
                            width: '40px',
                            height: '40px',
                            padding: '0',
                            background: 'rgba(239, 68, 68, 0.15)',
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px 0 rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            color: 'rgba(239, 68, 68, 1)',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
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
                      <div style={{
                        position: 'relative',
                        flex: '0 0 auto',
                        height: '120px',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.7s ease'
                          }}
                          loading="lazy"
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                        }}></div>
                      </div>

                      {/* Content */}
                      <div style={{
                        padding: '1.5rem',
                        flex: '1 1 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <h3 style={{
                          color: 'white',
                          fontWeight: '500',
                          fontSize: '14px',
                          lineHeight: '1.4',
                          margin: '0 0 0.75rem 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {video.title}
                        </h3>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          color: '#9ca3af'
                        }}>
                          <span style={{ fontSize: '12px' }}>
                            {video.channel}
                          </span>
                          <span style={{ fontSize: '12px' }}>
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
              <div style={{
                textAlign: 'center',
                paddingTop: '5rem',
                paddingBottom: '5rem'
              }}>
                  <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '300',
                  color: 'white',
                  marginBottom: '0.75rem',
                  margin: '0 0 0.75rem 0'
                }}>No videos found</h3>
                <p style={{
                  color: '#9ca3af',
                  fontWeight: '300',
                  margin: 0
                }}>Try adjusting your search terms</p>
              </div>
            )}

            {/* Admin Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '50px',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: currentPage === 1 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: currentPage === 1 ? '#6b7280' : 'white',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '14px'
                  }}
                >
                  Previous
                </button>

                <span style={{
                  padding: '0.75rem 1.5rem',
                  color: 'white',
                  fontWeight: '300'
                }}>
                  {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '50px',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: currentPage === totalPages ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: currentPage === totalPages ? '#6b7280' : 'white',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '14px'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </main>
        )}
      </div>

      {/* Edit Video Modal */}
      {editingVideo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => {
            setEditingVideo(null)
            setSelectedThumbnail(null)
            setThumbnailPreview(null)
          }}
        >
          <div
            style={{
              width: '90vw',
              maxWidth: '600px',
              maxHeight: '90vh',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header with Close Button */}
            <div style={{
              position: 'relative',
              padding: '2rem 3rem 1rem 3rem',
              flexShrink: 0
            }}>
              {/* Close Button */}
            <button
              onClick={() => {
                setEditingVideo(null)
                setSelectedThumbnail(null)
                setThumbnailPreview(null)
              }}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                width: '40px',
                height: '40px',
                padding: '0',
                background: 'rgba(239, 68, 68, 0.15)',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px 0 rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                color: 'rgba(239, 68, 68, 1)',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10
              }}
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

              <div style={{ textAlign: 'center' }}>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '200',
                  color: 'white',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                  margin: '0 0 0.5rem 0'
                }}>
                  Edit Video
                </h2>
                <div style={{
                  width: '60px',
                  height: '2px',
                  display: 'none',
                  margin: '1rem auto',
                  borderRadius: '1px'
                }}></div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 3rem'
            }}>

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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '400',
                  marginBottom: '0.5rem'
                }}>
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingVideo.title}
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '400',
                  marginBottom: '0.5rem'
                }}>
                  Channel
                </label>
                <input
                  type="text"
                  name="channel"
                  defaultValue={editingVideo.channel}
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '400',
                  marginBottom: '0.5rem'
                }}>
                  YouTube URL
                </label>
                <input
                  type="url"
                  name="youtube_url"
                  defaultValue={editingVideo.youtube_url}
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '400',
                  marginBottom: '0.5rem'
                }}>
                  Published Date
                </label>
                <input
                  type="date"
                  name="published_date"
                  defaultValue={new Date(editingVideo.published_at).toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    colorScheme: 'dark'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '400',
                  marginBottom: '0.5rem'
                }}>
                  Thumbnail Image
                </label>

                {/* Current thumbnail preview */}
                {(thumbnailPreview || editingVideo.thumbnail_url) && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: '12px',
                      marginBottom: '0.5rem',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {thumbnailPreview ? 'New thumbnail preview:' : 'Current thumbnail:'}
                    </p>
                    <img
                      src={thumbnailPreview || editingVideo.thumbnail_url}
                      alt="Thumbnail preview"
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
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
                    style={{
                      display: 'none'
                    }}
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    style={{
                      display: 'flex',
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: '#9ca3af',
                      fontSize: '16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {selectedThumbnail ? selectedThumbnail.name : 'Click to upload new thumbnail image'}
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '400',
                  marginBottom: '0.5rem'
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingVideo.description}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    resize: 'vertical',
                    minHeight: '100px'
                  }}
                />
              </div>

            </form>
            </div>

            {/* Fixed Footer with Action Buttons */}
            <div style={{
              flexShrink: 0,
              padding: '1.5rem 3rem 2rem 3rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingVideo(null)
                    setSelectedThumbnail(null)
                    setThumbnailPreview(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '1.25rem 2rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.125)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.2)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '16px',
                    fontWeight: '400',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.5px'
                  }}
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
                  style={{
                    flex: 2,
                    padding: '1.25rem 2rem',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.5px'
                  }}
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => {
            setShowUploadForm(false)
            setUploadVideoData(null)
            setUploadStep(1)
          }}
        >
          <div
            style={{
              width: '90vw',
              maxWidth: '600px',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '3rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '200',
                color: 'white',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em',
                margin: '0 0 0.5rem 0'
              }}>
                {uploadVideoData ? 'Add Video' : 'Upload New Video'}
              </h2>
              <div style={{
                width: '60px',
                height: '2px',
                display: 'none',
                margin: '1rem auto',
                borderRadius: '1px'
              }}></div>
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '400',
                  marginBottom: '0.5rem'
                }}>
                  YouTube URL *
                </label>
                <input
                  type="url"
                  name="youtube_url"
                  defaultValue={uploadVideoData?.youtube_url || ''}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  disabled={uploadStep === 2}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: uploadStep === 2 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: uploadStep === 2 ? '#9ca3af' : 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    cursor: uploadStep === 2 ? 'not-allowed' : 'text'
                  }}
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
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '400',
                      marginBottom: '0.5rem'
                    }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={uploadVideoData?.title || ''}
                      placeholder="Video title"
                      required
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
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

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '400',
                      marginBottom: '0.5rem'
                    }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={uploadVideoData?.description || ''}
                      placeholder="Video description"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        resize: 'vertical',
                        minHeight: '100px'
                      }}
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

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '400',
                      marginBottom: '0.5rem'
                    }}>
                      Channel
                    </label>
                    <input
                      type="text"
                      name="channel"
                      defaultValue={uploadVideoData?.channel || ''}
                      placeholder="Channel name"
                      required
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
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

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '400',
                      marginBottom: '0.5rem'
                    }}>
                      Published Date
                    </label>
                    <input
                      type="date"
                      name="published_date"
                      defaultValue={uploadVideoData?.published_at ? new Date(uploadVideoData.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
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

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false)
                    setUploadVideoData(null)
                    setUploadStep(1)
                  }}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '16px',
                    fontWeight: '400',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
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
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setPlayingVideo(null)}
        >
          <div
            style={{
              width: 'min(90vw, 1280px)',
              height: 'min(50.625vw, 720px)',
              aspectRatio: '16/9',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >


            {/* YouTube Iframe */}
            <iframe
              src={`https://www.youtube.com/embed/${playingVideo.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
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
