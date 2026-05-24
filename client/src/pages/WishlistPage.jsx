import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { fetchWishlist, toggleWishlist } from '../redux/slices/wishlistSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { addToast } from '../redux/slices/uiSlice';
import { Button } from '../components/ui/Button';
import { formatPrice } from '../lib/utils';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { products } = useSelector((s) => s.wishlist);
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated]);

  const handleRemove = (productId) => {
    dispatch(toggleWishlist(productId));
    dispatch(addToast({ type: 'info', message: 'Removed from wishlist' }));
  };

  const handleAddToCart = async (product) => {
    const result = await dispatch(addToCart({ productId: product._id }));
    if (addToCart.fulfilled.match(result)) {
      dispatch(addToast({ type: 'success', message: `${product.title} added to cart` }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold mb-2">Please login to view your wishlist</h2>
        <Link to="/login"><Button>Login</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        My Wishlist ({products.length} items)
      </h1>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6">Save items you love for later</p>
          <Link to="/products"><Button>Browse Products</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            if (typeof product === 'string') return null;
            const price = product.discountPrice > 0 ? product.discountPrice : product.price;
            return (
              <div key={product._id} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Link to={`/products/${product.slug}`}>
                    <img
                      src={product.images?.[0] || 'https://placehold.co/300x300'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => handleRemove(product._id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <div className="p-4">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-sm font-medium line-clamp-2 hover:text-indigo-600 transition-colors mb-2">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-3">{formatPrice(price)}</p>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
