/**
 * FilterButton - Styled button component for filters and navigation
 * Used across the app for consistent pill-shaped buttons with hover effects
 */
export function FilterButton({ active, onClick, children, className = '', icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer hover:scale-105 ${
        active
          ? 'bg-primary text-primary-content shadow-sm'
          : 'bg-base-200/60 hover:bg-base-300/80'
      } ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 mr-1.5" />}
      {children}
    </button>
  )
}
