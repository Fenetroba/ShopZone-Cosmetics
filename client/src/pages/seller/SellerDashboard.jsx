import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Package, ShoppingBag, DollarSign, TrendingUp, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { formatPrice, formatDate, getStatusColor } from '../../lib/utils';
import api from '../../services/api';

export default function SellerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, ordersRes, productsRes] = await Promise.all([
          api.get('/sellers/analytics'),
          api.get('/orders/seller?limit=5'),
          api.get('/products/seller/my-products?limit=100'),
        ]);
        setAnalytics(analyticsRes.data.analytics);
        setOrders(ordersRes.data.orders || []);
        const products = productsRes.data.products || [];
        setLowStockProducts(products.filter((p) => p.stock <= p.lowStockThreshold));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const summary = analytics?.summary;

  const statCards = summary ? [
    { label: 'Total Revenue', value: formatPrice(summary.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Orders', value: summary.totalOrders, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Active Products', value: summary.totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Pending Orders', value: summary.pendingOrders, icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Seller Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your store and track performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map((card, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className={`p-2.5 rounded-xl ${card.bg} w-fit mb-3`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics?.revenueData || []}>
                <defs>
                  <linearGradient id="sellerRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#sellerRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/seller/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.user?.name} · {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPrice(order.totalPrice)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Low Stock Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">All products are well stocked ✓</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product._id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <img
                      src={product.images?.[0] || 'https://placehold.co/40x40'}
                      alt={product.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.title}</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">Only {product.stock} left</p>
                    </div>
                    <Link to="/seller/products" className="text-xs text-indigo-600 hover:underline">Restock</Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
