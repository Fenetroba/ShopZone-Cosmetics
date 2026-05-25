import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Shield, Truck, RefreshCw, Star, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import ProductCard from '../components/product/ProductCard';
import api from '../services/api';
import { AndroidDemo } from '../components/layout/AndroidDemo';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/categories'),
        ]);
        setFeaturedProducts(productsRes.data.products || []);
        setCategories(categoriesRes.data.categories?.slice(0, 8) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
    { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
    { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
    { icon: Star, title: 'Top Quality', desc: 'Verified products' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#ffffff] via-[#313b30]/90 to-[#ffffff] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative  mx-auto px-4 sm:px-6  lg:pt-18">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="w-full justify-around sm:flex max-sm:mt-17 "
          >

            <div>
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                ShopZone
                <span className="block text-[#f59e0b]">COSMETICS STORE</span>
              </motion.h1>


              <motion.div variants={fadeUp} className="flex items-center gap-6 max-sm:mt-28 text-sm text-[#fff]">
                <span>✓ 5,000+ Products</span>
                <span>✓ 1000+ Sellers</span>
                <span>✓ 100+ Happy Customers</span>
              </motion.div>
            </div>
            <AndroidDemo />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex-shrink-0">
                  <f.icon className="h-5 w-5 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Shop by Category</h2>
            <Link to="/products" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/products?category=${cat._id}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-indigo-600" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Featured Products</h2>
          <Link to="/products" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
        </div>
        {!loading && featuredProducts.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No featured products yet</p>
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#313b30] to-[#313b30] rounded-2xl p-8 sm:p-12 text-white text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Start Selling Today</h2>
          <p className="text-white text-sm mb-6 max-w-md mx-auto">
            Join thousands of sellers and reach millions of customers worldwide.
          </p>
          <Button
            onClick={() => navigate('/seller/register')}
            className="bg-[#f59e0b] text-white hover:bg-[#f59e0b]/70 font-semibold px-8"
          >
            Become a Seller <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
