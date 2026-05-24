import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, ShoppingBag, Package, DollarSign, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { formatPrice, formatDate, getStatusColor } from '../../lib/utils';
import api from '../../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, salesRes, activityRes, topRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/sales?period=30'),
          api.get('/analytics/order-activity'),
          api.get('/analytics/top-products'),
        ]);
        setStats(overviewRes.data.stats);
        setSalesData(salesRes.data.salesData || []);
        setRecentOrders(activityRes.data.recentOrders || []);
        setTopProducts(topRes.data.topProducts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = stats ? [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', change: '+12%' },
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', change: '+8%' },
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', change: '+15%' },
    { label: 'Active Products', value: stats.totalProducts.toLocaleString(), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', change: '+5%' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map((card, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${card.bg}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {card.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product, i) => (
                  <div key={product._id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <img
                      src={product.images?.[0] || 'https://placehold.co/40x40'}
                      alt={product.title}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">{product.totalSold} sold</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600">{formatPrice(product.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link to="/admin/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="py-3 px-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">No orders yet</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3 font-medium text-indigo-600">#{order.orderNumber}</td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{order.user?.name}</td>
                      <td className="py-3 px-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-3 font-semibold">{formatPrice(order.totalPrice)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
