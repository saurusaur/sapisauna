'use client'

import { cn } from '@/lib/utils'

type ErrorBannerVariant = 'default' | 'inline'

interface ErrorBannerProps {
  message: string
  className?: string
  variant?: ErrorBannerVariant
}

export default function ErrorBanner({
  message,
  className,
  variant = 'default',
}: ErrorBannerProps) {
  if (variant === 'inline') {
    return (
      <p className={cn('text-xs text-center mb-4 text-red-600', className)}>
        {message}
      </p>
    )
  }

  return (
    <div
      className={cn(
        'bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2',
        className
      )}
    >
      {message}
    </div>
  )
}
