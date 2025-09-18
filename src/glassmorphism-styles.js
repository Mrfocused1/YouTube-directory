// Glassmorphism Style Constants
export const glassStyles = {
  // Main glass effect for cards
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    borderRadius: '20px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Card hover effect
  cardHover: {
    background: 'rgba(255, 255, 255, 0.08)',
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 12px 48px 0 rgba(31, 38, 135, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },

  // Button glass effect
  button: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px) saturate(180%)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    borderRadius: '12px',
    color: 'white',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.2)'
  },

  // Button hover
  buttonHover: {
    background: 'rgba(255, 255, 255, 0.12)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 32px 0 rgba(31, 38, 135, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },

  // Selected button state
  buttonActive: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.4)'
  },

  // Search bar glass effect
  searchBar: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    boxShadow: 'inset 0 2px 8px 0 rgba(0, 0, 0, 0.2), 0 4px 24px 0 rgba(31, 38, 135, 0.2)'
  },

  // Modal/overlay glass effect
  modal: {
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    boxShadow: '0 16px 64px 0 rgba(31, 38, 135, 0.4)'
  },

  // Input field glass effect
  input: {
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: 'white',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Input focus state
  inputFocus: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.05)'
  },

  // Background gradient for main container
  backgroundGradient: {
    background: `linear-gradient(135deg,
      rgba(10, 10, 10, 1) 0%,
      rgba(26, 26, 46, 1) 50%,
      rgba(10, 10, 10, 1) 100%)`,
    minHeight: '100vh'
  },

  // Subtle animation for floating elements
  floatingElement: {
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
    filter: 'blur(40px)',
    borderRadius: '50%',
    animation: 'float 8s ease-in-out infinite'
  },

  // Pagination button styles
  paginationButton: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px) saturate(180%)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '14px'
  },

  // Disabled state
  disabled: {
    background: 'rgba(0, 0, 0, 0.2)',
    color: '#6b7280',
    cursor: 'not-allowed',
    opacity: 0.5
  }
};

// Helper function to apply glass morphism styles
export const applyGlassStyle = (baseStyle, hoverStyle = null) => {
  return {
    ...baseStyle,
    onMouseEnter: hoverStyle ? (e) => {
      Object.assign(e.currentTarget.style, hoverStyle);
    } : undefined,
    onMouseLeave: hoverStyle ? (e) => {
      Object.assign(e.currentTarget.style, baseStyle);
    } : undefined
  };
};