import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Heart, Star, Truck, Shield, RefreshCw,
  ChevronLeft, ChevronRight, Minus, Plus, Share2, Store,
} from 'lucide-react';
import { addToCart } from '../redux/slices/cartSlice';
import { toggleWishlist, selectIsWishlisted } from '../redux/slices/wishlistSlice';
import { addToast } from '../redux/slices/uiSlice';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import StarRating from '../components/product/StarRating';
import ProductCard from '../components/product/ProductCard';
import { formatPrice, getDiscountPercent, formatDate } from '../lib/utils';
import api from '../services/api';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  const isWishlisted = useSelector(selectIsWishlisted(product?._id));

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${slug}`);
        setProduct(data.product);
        setActiveImage(0);

        const [relatedRes, reviewsRes] = await Promise.all([
          api.get(`/products/${data.product._id}/related`),
          api.get(`/reviews/product/${data.product._id}`),
        ]);
        setRelated(relatedRes.data.products || []);
        setReviews(reviewsRes.data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      dispatch(addToast({ type: 'warning', message: 'Please login to add items to cart' }));
      navigate('/login');
      return;
    }
    const result = await dispatch(addToCart({ productId: product._id, quantity }));
    if (addToCart.fulfilled.match(result)) {
      dispatch(addToast({ type: 'success', title: 'Added to cart!', message: product.title }));
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      dispatch(addToast({ type: 'warning', message: 'Please login to save items' }));
      return;
    }
    dispatch(toggleWishlist(product._id));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <Link to="/products" className="text-indigo-600 hover:underline mt-2 block">
          Back to products
        </Link>
      </div>
    );
  }

  const discountPercent = getDiscountPercent(product.price, product.discountPrice);
  const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-indigo-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4">
            <motion.img
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={product.images?.[activeImage] || 'https://placehold.co/600x600?text=No+Image'}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.images?.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setActiveImage((prev) => (prev + 1) % product.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImage ? 'border-indigo-600' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.brand && (
            <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {product.title}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <StarRating value={product.rating} readonly />
            <span className="text-sm text-gray-500">
              {product.rating?.toFixed(1)} ({product.numReviews} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(displayPrice)}
            </span>
            {discountPercent > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                <Badge variant="destructive">-{discountPercent}%</Badge>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="text-sm text-emerald-600 font-medium">
                ✓ In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="text-sm text-red-500 font-medium">✗ Out of Stock</span>
            )}
          </div>

          {/* Quantity */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity:</span>
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-5 w-5" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlist}
              className={isWishlisted ? 'text-red-500 border-red-300' : ''}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Seller */}
          {product.seller && (
            <Link
              to={`/sellers/${product.seller._id}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition-colors mb-6"
            >
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden">
                {product.seller.storeLogo ? (
                  <img src={product.seller.storeLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-indigo-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.seller.storeName}</p>
                <p className="text-xs text-gray-500">View store</p>
              </div>
            </Link>
          )}

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'Over $50' },
              { icon: Shield, label: 'Secure', sub: 'Payment' },
              { icon: RefreshCw, label: 'Returns', sub: '30 days' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <item.icon className="h-5 w-5 text-indigo-600" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className="text-xs text-gray-500">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-12">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab} {tab === 'reviews' && `(${reviews.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p>{product.description}</p>
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {product.specifications?.length > 0 ? (
              product.specifications.map((spec, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">{spec.key}:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{spec.value}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No specifications available</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-600">
                          {review.user?.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{review.user?.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                  {review.title && <p className="text-sm font-medium mb-1">{review.title}</p>}
                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                  {review.isVerifiedPurchase && (
                    <Badge variant="success" className="mt-2">Verified Purchase</Badge>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
