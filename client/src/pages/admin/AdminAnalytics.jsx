import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatPrice } from '../../lib/utils';
import api from '../../services/api';

export default function AdminAnalytics() {
  const [salesData, setSalesData] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [salesRes, userRes, revenueRes] = await Promise.all([
          api.get(`/analytics/sales?period=${period}`),
          api.get(`/analytics/user-growth?period=${period}`),
          api.get('/analytics/revenue'),
        ]);
        setSalesData(salesRes.data.salesData || []);
        setUserGrowth(userRes.data.userGrowth || []);
        setMonthlyRevenue(revenueRes.data.monthlyRevenue || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = MONTHS.map((month, i) => {
    const found = monthlyRevenue.find((m) => m._id === i + 1);
    return { month, revenue: found?.revenue || 0, orders: found?.orders || 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Platform performance overview</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales & Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-72 w-full" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => [name === 'revenue' ? `$${v.toFixed(2)}` : v, name]} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Orders" radius={[4, 4, 0, 0]} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue ({new Date().getFullYear()})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} name="New Users" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
