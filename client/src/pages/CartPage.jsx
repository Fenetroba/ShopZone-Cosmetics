import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, Tag, ArrowRight } from 'lucide-react';
import { fetchCart, updateCartItem, removeFromCart, applyCoupon } from '../redux/slices/cartSlice';
import { addToast } from '../redux/slices/uiSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPrice } from '../lib/utils';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice, coupon, loading } = useSelector((s) => s.cart);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    dispatch(updateCartItem({ productId, quantity }));
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
    dispatch(addToast({ type: 'info', message: 'Item removed from cart' }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const result = await dispatch(applyCoupon(couponCode));
    setCouponLoading(false);
    if (applyCoupon.fulfilled.match(result)) {
      dispatch(addToast({ type: 'success', message: 'Coupon applied!' }));
    } else {
      dispatch(addToast({ type: 'error', message: result.payload }));
    }
  };

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price || item.price;
    return sum + price * item.quantity;
  }, 0);

  const shippingPrice = subtotal > 50 ? 0 : 9.99;
  const taxPrice = subtotal * 0.1;
  const total = subtotal + shippingPrice + taxPrice;

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold mb-2">Please login to view your cart</h2>
        <Button onClick={() => navigate('/login')}>Login</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products to get started</p>
        <Button onClick={() => navigate('/products')}>
          <ShoppingBag className="h-4 w-4" />
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Shopping Cart ({items.length} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              const price = product.discountPrice > 0 ? product.discountPrice : product.price;

              return (
                <motion.div
                  key={item._id || product._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-4 p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800"
                >
                  <Link to={`/products/${product.slug}`} className="flex-shrink-0">
                    <img
                      src={product.images?.[0] || 'https://placehold.co/100x100'}
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${product.slug}`}>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-indigo-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    {product.brand && <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(product._id, item.quantity - 1)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(product._id, item.quantity + 1)}
                          disabled={item.quantity >= product.stock}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatPrice(price * item.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemove(product._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Coupon Code
            </h3>
            {coupon ? (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{coupon.code} applied!</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleApplyCoupon} loading={couponLoading}>
                  Apply
                </Button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span>{shippingPrice === 0 ? 'Free' : formatPrice(shippingPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                <span>{formatPrice(taxPrice)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link
              to="/products"
              className="block text-center text-sm text-indigo-600 hover:underline mt-3"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
