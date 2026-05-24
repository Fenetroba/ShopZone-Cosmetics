import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';

export default function ProductFilters({ onClose }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({ category: true, price: true, rating: true });

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    brand: searchParams.get('brand') || '',
  });

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories || []));
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    params.set('page', '1');
    setSearchParams(params);
    onClose?.();
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    ['category', 'minPrice', 'maxPrice', 'minRating', 'brand'].forEach((k) => params.delete(k));
    setSearchParams(params);
    setFilters({ category: '', minPrice: '', maxPrice: '', minRating: '', brand: '' });
    onClose?.();
  };

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const Section = ({ title, id, children }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
      <button
        onClick={() => toggle(id)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3"
      >
        {title}
        {expanded[id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded[id] && children}
    </div>
  );

  return (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline">
          Clear all
        </button>
      </div>

      {/* Category */}
      <Section title="Category" id="category">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={!filters.category}
              onChange={() => setFilters((f) => ({ ...f, category: '' }))}
              className="text-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat._id}
                checked={filters.category === cat._id}
                onChange={() => setFilters((f) => ({ ...f, category: cat._id }))}
                className="text-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Price Range */}
      <Section title="Price Range" id="price">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
            className="w-full h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            className="w-full h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Section>

      {/* Rating */}
      <Section title="Minimum Rating" id="rating">
        <div className="space-y-2">
          {[4, 3, 2, 1].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={r}
                checked={filters.minRating === String(r)}
                onChange={() => setFilters((f) => ({ ...f, minRating: String(r) }))}
                className="text-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                {'★'.repeat(r)}{'☆'.repeat(5 - r)} & up
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* Brand */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Brand</label>
        <input
          type="text"
          placeholder="Search brand..."
          value={filters.brand}
          onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
          className="w-full h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Button className="w-full" onClick={applyFilters}>Apply Filters</Button>
    </div>
  );
}
