import { motion } from 'framer-motion'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex justify-center items-center space-x-2">
      {/* Previous button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
          currentPage === 1
            ? 'bg-gray-600/20 border-gray-600/30 text-gray-500 cursor-not-allowed'
            : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>

      {/* Page numbers */}
      <div className="flex space-x-1">
        {visiblePages.map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(page as number)}
                className={`px-4 py-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
                  currentPage === page
                    ? 'bg-purple-600/40 border-purple-400/50 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                }`}
              >
                {page}
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Next button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
          currentPage === totalPages
            ? 'bg-gray-600/20 border-gray-600/30 text-gray-500 cursor-not-allowed'
            : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </div>
  )
}

export default Pagination