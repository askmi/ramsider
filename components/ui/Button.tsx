import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'group relative inline-flex items-center justify-start gap-2 whitespace-nowrap rounded-full px-6 py-4 text-left text-sm font-semibold tracking-wider transition-all duration-300',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-ramsider-black text-ramsider-white hover:shadow-[0_0_30px_rgba(200,38,211,0.4)] hover:scale-[1.02]':
              variant === 'primary',
            'border-2 border-ramsider-black bg-transparent text-ramsider-black hover:bg-ramsider-black hover:text-ramsider-white':
              variant === 'secondary',
            'bg-transparent text-ramsider-black hover:text-ramsider-purple':
              variant === 'ghost',
          },
          className
        )}
        {...props}
      >
        {children}
        {variant === 'primary' && (
          <span className="absolute right-6 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
            →
          </span>
        )}
        {variant === 'secondary' && (
          <span className="absolute right-6 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
            →
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
