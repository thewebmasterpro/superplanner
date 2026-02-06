import { cn } from '@/lib/utils'

/**
 * StatsCard - Reusable stats card component
 * Follows the glass morphism design pattern used across the app
 *
 * @param {string} title - Small uppercase label
 * @param {string|number} value - Main statistic value
 * @param {string} className - Additional classes for the stat-value
 * @param {React.ReactNode} icon - Optional icon to display
 * @param {string} description - Optional description below value
 */
export function StatsCard({
  title,
  value,
  className,
  icon,
  description
}) {
  return (
    <div className="stats shadow bg-base-100 dark:backdrop-blur-xl dark:bg-black/40 border border-base-300 dark:border-white/20 hover:border-primary/30 dark:hover:border-purple-500/50 transition-all">
      <div className="stat">
        {icon && (
          <div className="stat-figure text-primary">
            {icon}
          </div>
        )}
        <div className="stat-title text-[10px] uppercase font-bold opacity-50 tracking-widest">
          {title}
        </div>
        <div className={cn("stat-value font-black", className)}>
          {value}
        </div>
        {description && (
          <div className="stat-desc text-xs opacity-60">
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * StatsCardGroup - Container for multiple stats cards
 * Handles responsive grid layout
 *
 * @param {number} cols - Number of columns (1-4)
 * @param {React.ReactNode} children - StatsCard components
 */
export function StatsCardGroup({ cols = 3, children, className }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn(
      "grid gap-4 animate-stagger-fast",
      gridCols[cols] || gridCols[3],
      className
    )}>
      {children}
    </div>
  )
}
