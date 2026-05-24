import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { addToCart } from '../../redux/slices/cartSlice';
import { toggleWishlist, selectIsWishlisted } from '../../redux/slices/wishlistSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatPrice, getDiscountPercent } from '../../lib/utils';

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const isWishlisted = useSelector(selectIsWishlisted(product._id));

  const discountPercent = getDiscountPercent(product.price, product.discountPrice);
  const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(addToast({ type: 'warning', message: 'Please login to add items to cart' }));
      return;
    }
    const result = await dispatch(addToCart({ productId: product._id }));
    if (addToCart.fulfilled.match(result)) {
      dispatch(addToast({ type: 'success', message: `${product.title} added to cart` }));
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(addToast({ type: 'warning', message: 'Please login to save items' }));
      return;
    }
    dispatch(toggleWishlist(product._id));
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <Link to={`/products/${product.slug}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {discountPercent > 0 && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              -{discountPercent}%
            </Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {product.brand && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.brand}</p>
          )}
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(product.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.numReviews || 0})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(displayPrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart */}
      <div className="px-4 pb-4">
        <Button
          className="w-full"
          size="sm"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <ShoppingCart className="h-4 w-4" />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </motion.div>
  );
}
