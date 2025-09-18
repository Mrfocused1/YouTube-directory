import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import ReactPlayer from 'react-player'
import type { Video } from '../types/video'

interface VideoModalProps {
  video: Video
  isOpen: boolean
  onClose: () => void
}

const VideoModal = ({ video, isOpen, onClose }: VideoModalProps) => {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                onClick={onClose}
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, type: "spring", damping: 25 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl mx-4"
              >
                <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <Dialog.Title className="text-xl font-semibold text-white">
                      {video.title}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-gray-400 hover:text-white transition-colors duration-200 p-2"
                        aria-label="Close modal"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </Dialog.Close>
                  </div>

                  {/* Video Player */}
                  <div className="relative aspect-video bg-black">
                    <ReactPlayer
                      url={video.youtube_url}
                      width="100%"
                      height="100%"
                      controls={true}
                      playing={true}
                      pip={true}
                      config={{
                        youtube: {
                          // @ts-ignore
                          playerVars: {
                            showinfo: true,
                            origin: window.location.origin
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Video Details */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      {/* Left side - Video info */}
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">
                          {video.title}
                        </h2>

                        <div className="flex items-center gap-4 text-gray-300 mb-4">
                          <span className="font-semibold text-purple-300">{video.channel}</span>
                          <span>•</span>
                          <span>{formatDate(video.published_at)}</span>
                        </div>

                        <Dialog.Description className="text-gray-300 leading-relaxed mb-6">
                          {video.description}
                        </Dialog.Description>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {video.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-500/20 text-purple-200 text-sm rounded-full border border-purple-400/30"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right side - Actions */}
                      <div className="flex flex-col gap-3 lg:min-w-[200px]">
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={video.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          Watch on YouTube
                        </motion.a>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            navigator.clipboard.writeText(video.youtube_url)
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Link
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

export default VideoModal