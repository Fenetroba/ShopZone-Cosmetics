import { cn } from '../../lib/utils';

export function Select({ className, label, error, children, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-muted mb-1">
          {label}
        </label>
      )}
      <select
        className={cn(
          'flex h-10 w-full rounded-lg border px-3 py-2 text-sm',
          'bg-bg text-text border-border',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
