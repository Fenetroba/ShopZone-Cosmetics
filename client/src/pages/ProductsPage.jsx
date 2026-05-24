import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Grid, List, X, Search } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import api from '../services/api';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-rating', label: 'Top Rated' },
  { value: '-totalSold', label: 'Best Selling' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(searchParams.get('page') || 1);
  const sort = searchParams.get('sort') || '-createdAt';
  const search = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(searchParams.entries());
      const { data } = await api.get('/products', { params });
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSort = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', p);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilters = ['category', 'minPrice', 'maxPrice', 'minRating', 'brand']
    .filter((k) => searchParams.get(k));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {search ? `Results for "${search}"` : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${pagination.total} products found`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1 bg-indigo-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </Button>
          <Select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="w-48"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((key) => (
            <span
              key={key}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
            >
              {key}: {searchParams.get(key)}
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete(key);
                  setSearchParams(params);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <ProductFilters />
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </motion.div>
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <Modal isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <ProductFilters onClose={() => setFiltersOpen(false)} />
      </Modal>
    </div>
  );
}
