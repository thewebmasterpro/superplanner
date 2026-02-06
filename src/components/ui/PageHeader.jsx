import { cn } from '@/lib/utils'

/**
 * PageHeader - Reusable page header component
 * Consistent header styling across all V3 pages
 *
 * @param {string} title - Page title
 * @param {string} description - Optional subtitle/description
 * @param {React.ReactNode} icon - Lucide icon component
 * @param {React.ReactNode} actions - Right-side action buttons
 * @param {string} dataTour - Optional data-tour attribute for guided tours
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  dataTour,
  className
}) {
  return (
    <div
      data-tour={dataTour}
      className={cn(
        "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-bold font-display flex items-center gap-2 text-primary">
          {Icon && <Icon className="w-8 h-8" />}
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
