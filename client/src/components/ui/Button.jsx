import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

// All colors reference CSS variables defined in index.css.
// To change the primary color globally, edit --color-primary in index.css.
const variants = {
  default:     'bg-primary text-primary-fg hover:bg-primary-hover focus-visible:ring-primary',
  destructive: 'bg-danger text-white hover:opacity-90 focus-visible:ring-danger',
  outline:     'border border-border bg-transparent hover:bg-bg-muted text-text',
  secondary:   'bg-bg-muted text-text hover:bg-bg-subtle border border-border',
  ghost:       'hover:bg-bg-muted text-text',
  link:        'text-primary underline-offset-4 hover:underline p-0 h-auto',
  success:     'bg-success text-white hover:opacity-90 focus-visible:ring-success',
  warning:     'bg-warning text-white hover:opacity-90 focus-visible:ring-warning',
};

const sizes = {
  default: 'h-10 px-4 py-2 text-sm',
  sm:      'h-8 px-3 text-xs',
  lg:      'h-12 px-6 text-base',
  icon:    'h-10 w-10',
};

const Button = forwardRef(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
