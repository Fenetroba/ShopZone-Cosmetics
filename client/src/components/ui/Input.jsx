import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ className, type = 'text', error, label, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-muted mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border px-3 py-2 text-sm',
          'bg-bg text-text',
          'border-border',
          'placeholder:text-text-subtle',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          error && 'border-danger focus:ring-danger',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export { Input };
