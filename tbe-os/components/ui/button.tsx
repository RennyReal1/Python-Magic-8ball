import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          size === 'sm' && 'text-xs px-3 py-1.5 gap-1.5',
          size === 'md' && 'text-sm px-4 py-2.5 gap-2',
          size === 'lg' && 'text-base px-5 py-3 gap-2',
          variant === 'primary' && 'bg-gradient-brand text-white hover:opacity-90 shadow-glow',
          variant === 'secondary' && 'bg-surface border border-surface-border text-slate-300 hover:bg-surface-hover hover:text-white',
          variant === 'ghost' && 'text-slate-400 hover:text-white hover:bg-surface-hover',
          variant === 'danger' && 'bg-red-900/40 border border-red-800 text-red-300 hover:bg-red-900/70',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
