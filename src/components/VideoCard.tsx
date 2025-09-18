import { motion } from 'framer-motion'
import type { Video } from '../types/video'

interface VideoCardProps {
  video: Video
  onClick: () => void
}

const VideoCard = ({ video, onClick }: VideoCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-red-600 rounded-full p-3 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover:text-purple-200 transition-colors duration-300">
            {video.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="font-medium">{video.channel}</span>
            <span>{formatDate(video.published_at)}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full border border-purple-400/30"
              >
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full border border-gray-400/30">
                +{video.tags.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Glassmorphic border glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  )
}

export default VideoCard