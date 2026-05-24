import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const getPages = () => {
    const arr = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      arr.push(i);
    }
    return arr;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <Button variant="outline" size="icon" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {page > 3 && (
        <>
          <Button variant="outline" size="sm" onClick={() => onPageChange(1)}>1</Button>
          {page > 4 && <span className="px-2 text-text-subtle">...</span>}
        </>
      )}

      {getPages().map((p) => (
        <Button
          key={p}
          variant={p === page ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      {page < pages - 2 && (
        <>
          {page < pages - 3 && <span className="px-2 text-text-subtle">...</span>}
          <Button variant="outline" size="sm" onClick={() => onPageChange(pages)}>{pages}</Button>
        </>
      )}

      <Button variant="outline" size="icon" onClick={() => onPageChange(page + 1)} disabled={page === pages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
