import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-ramsider-purple px-6 py-2 text-xs font-bold tracking-wider text-white',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
