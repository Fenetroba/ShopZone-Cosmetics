import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Search, Sun, Moon, Menu, X,
  User, LogOut, Package, LayoutDashboard, Store, ChevronDown,
} from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { toggleTheme } from '../../redux/slices/uiSlice';
import { selectCartCount } from '../../redux/slices/cartSlice';
import { Button } from '../ui/Button';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const cartCount = useSelector(selectCartCount);
  const wishlistCount = useSelector((s) => s.wishlist.products.length);
  const theme = useSelector((s) => s.ui.theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setUserMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (user?.role === 'superadmin' || user?.role === 'admin') return '/admin';
    if (user?.role === 'seller') return '/seller';
    return '/account';
  };

  return (
    <nav className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <img src="https://www.iconpacks.net/icons/2/free-lipstick-icon-1598-thumb.png" className="bg-white rounded-full  h-6 w-6" />
            <span>ShopZone</span>
          </Link>

          {/* Search — Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 h-10 rounded-full border border-border bg-bg-subtle text-text text-sm
                           placeholder:text-text-subtle
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                           transition-all"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1">

            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg hover:bg-bg-muted transition-colors text-text-muted hover:text-text"
              aria-label="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun className="h-5 w-5" />
                : <Moon className="h-5 w-5" />}
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="relative p-2 rounded-lg hover:bg-bg-muted transition-colors text-text-muted hover:text-text"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-bg-muted transition-colors text-text-muted hover:text-text"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-fg text-xs rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-primary">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 hidden sm:block text-text-muted" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-bg-subtle rounded-xl shadow-lg border border-border py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-semibold text-text">{user?.name}</p>
                        <p className="text-xs text-text-muted capitalize">{user?.role}</p>
                      </div>

                      {[
                        { to: getDashboardLink(), icon: LayoutDashboard, label: 'Dashboard' },
                        { to: '/account/orders', icon: Package, label: 'My Orders' },
                        { to: '/account', icon: User, label: 'Profile' },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-bg-muted transition-colors"
                        >
                          <Icon className="h-4 w-4 text-text-muted" />
                          {label}
                        </Link>
                      ))}

                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger-light w-full transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/register')}>Sign Up</Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-bg-muted transition-colors text-text-muted"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="py-4 space-y-3">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-subtle" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 h-10 rounded-full border border-border bg-bg-subtle text-text text-sm
                                 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </form>
                {!isAuthenticated && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { navigate('/login'); setMobileOpen(false); }}>Login</Button>
                    <Button className="flex-1 bg-[#f59e0b]" onClick={() => { navigate('/register'); setMobileOpen(false); }}>Sign Up</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
