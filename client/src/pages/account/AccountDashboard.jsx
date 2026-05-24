import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, Heart, MapPin, CreditCard, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatPrice, formatDate, getStatusColor } from '../../lib/utils';
import api from '../../services/api';

export default function AccountDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my-orders?limit=5')
      .then(({ data }) => setRecentOrders(data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { icon: ShoppingBag, label: 'My Orders', to: '/account/orders', desc: 'Track and manage orders' },
    { icon: Heart, label: 'Wishlist', to: '/wishlist', desc: 'Saved items' },
    { icon: MapPin, label: 'Addresses', to: '/account/profile', desc: 'Manage addresses' },
    { icon: CreditCard, label: 'Payments', to: '/account/payments', desc: 'Payment history' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and orders</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl w-fit mb-3">
                  <link.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{link.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
          <Link to="/account/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500 text-sm">No orders yet</p>
              <Link to="/products" className="text-indigo-600 text-sm hover:underline">Start shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <img
                          key={i}
                          src={item.product?.images?.[0] || item.image || 'https://placehold.co/32x32'}
                          alt=""
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-600">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)} · {order.items?.length} items</p>
                    </div>
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
    </div>
  );
}
