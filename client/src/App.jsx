import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './redux/slices/authSlice';
import { fetchCart } from './redux/slices/cartSlice';
import { fetchWishlist } from './redux/slices/wishlistSlice';

// Layouts
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Route Guard
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Account Pages
import AccountDashboard from './pages/account/AccountDashboard';
import AccountOrders from './pages/account/AccountOrders';
import AccountProfile from './pages/account/AccountProfile';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import SellerRegisterPage from './pages/seller/SellerRegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSellers from './pages/admin/AdminSellers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCategories from './pages/admin/AdminCategories';
import AdminReviews from './pages/admin/AdminReviews';

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);

  // Theme is already applied synchronously in uiSlice module init.
  // Only fetch user data here.
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getMe());
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main Layout Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/register"
          element={
            <ProtectedRoute>
              <SellerRegisterPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Account Dashboard */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <DashboardLayout type="account" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AccountDashboard />} />
        <Route path="orders" element={<AccountOrders />} />
        <Route path="profile" element={<AccountProfile />} />
        <Route path="payments" element={<AccountOrders />} />
      </Route>

      {/* Seller Dashboard */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute roles={['seller', 'admin', 'superadmin']}>
            <DashboardLayout type="seller" />
          </ProtectedRoute>
        }
      >
        <Route index element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="profile" element={<AccountProfile />} />
      </Route>

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin', 'superadmin']}>
            <DashboardLayout type="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="sellers" element={<AdminSellers />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="audit-logs" element={<AdminUsers />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
