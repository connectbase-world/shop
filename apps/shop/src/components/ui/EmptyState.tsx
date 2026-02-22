import { Link } from '@tanstack/react-router'
import { PackageOpen } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <PackageOpen className="w-12 h-12 text-gray-300 mb-4" />
      <p className="text-lg font-medium text-gray-900">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-6 px-6 py-2.5 bg-black text-white text-sm rounded-sm hover:bg-gray-800 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
