import { motion } from 'framer-motion'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

const SearchBar = ({ searchQuery, onSearchChange }: SearchBarProps) => {
  return (
    <div className="relative">
      <motion.div
        whileFocus={{ scale: 1.02 }}
        className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10" />

        <div className="relative flex items-center">
          {/* Search icon */}
          <div className="pl-6 pr-4">
            <svg
              className="w-5 h-5 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Input field */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search videos, channels, or tags..."
            className="w-full py-4 pr-6 bg-transparent text-white placeholder-gray-300 focus:outline-none text-lg"
          />

          {/* Clear button */}
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onSearchChange('')}
              className="absolute right-4 p-2 text-gray-300 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Search suggestions or recent searches could go here */}
      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 text-sm text-gray-300"
        >
          <p className="text-center">
            Press Enter to search or click on a video card to view
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default SearchBar