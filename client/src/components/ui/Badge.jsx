import { cn } from '../../lib/utils';

// Colors come from CSS variables in index.css
const variants = {
  default:     'bg-primary-light text-primary',
  secondary:   'bg-bg-muted text-text-muted',
  success:     'bg-success-light text-success-fg',
  destructive: 'bg-danger-light text-danger-fg',
  warning:     'bg-warning-light text-warning-fg',
  info:        'bg-info-light text-info-fg',
  outline:     'border border-border text-text-muted',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
