import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, BarChart2,
  Settings, LogOut, Menu, X, ChevronRight, Store, Star, Ticket,
  CreditCard, FileText, Shield, Bell,
} from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { ToastContainer } from '../ui/Toast';

const adminNav = [
  { label: 'Overview', icon: LayoutDashboard, to: '/admin' },
  { label: 'Users', icon: Users, to: '/admin/users' },
  { label: 'Sellers', icon: Store, to: '/admin/sellers' },
  { label: 'Products', icon: Package, to: '/admin/products' },
  { label: 'Orders', icon: ShoppingBag, to: '/admin/orders' },
  { label: 'Categories', icon: Tag, to: '/admin/categories' },
  { label: 'Reviews', icon: Star, to: '/admin/reviews' },
  { label: 'Coupons', icon: Ticket, to: '/admin/coupons' },
  { label: 'Analytics', icon: BarChart2, to: '/admin/analytics' },
  { label: 'Audit Logs', icon: Shield, to: '/admin/audit-logs', superadmin: true },
];

const sellerNav = [
  { label: 'Overview', icon: LayoutDashboard, to: '/seller' },
  { label: 'Products', icon: Package, to: '/seller/products' },
  { label: 'Orders', icon: ShoppingBag, to: '/seller/orders' },
  { label: 'Analytics', icon: BarChart2, to: '/seller/analytics' },
  { label: 'Store Profile', icon: Store, to: '/seller/profile' },
];

const accountNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/account' },
  { label: 'Orders', icon: ShoppingBag, to: '/account/orders' },
  { label: 'Wishlist', icon: Star, to: '/wishlist' },
  { label: 'Payments', icon: CreditCard, to: '/account/payments' },
  { label: 'Profile', icon: Settings, to: '/account/profile' },
];

export default function DashboardLayout({ type = 'account' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = type === 'admin' ? adminNav : type === 'seller' ? sellerNav : accountNav;
  const filteredNav = navItems.filter((item) => !item.superadmin || user?.role === 'superadmin');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-[#313b30]/20">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-[#313b30]">
                  <img src="https://www.iconpacks.net/icons/2/free-lipstick-icon-1598-thumb.png" className="bg-white rounded-full  h-6 w-6" />

          shopZone Cosmetics
        </Link>
        <p className="text-xs text-gray-500 mt-1 capitalize">{type} Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                ? 'bg-[#313b30]/50 dark:bg-indigo-900/30 text-white dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-indigo-600">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-black z-50 lg:hidden"
            >
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
              ← Back to Store
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
