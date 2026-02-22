type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-sm ${className}`} />
  )
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4]" />
      <Skeleton className="h-4 w-3/4 mt-3" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </div>
  )
}
