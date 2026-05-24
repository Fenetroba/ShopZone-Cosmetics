import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { formatPrice, formatDate, getStatusColor } from '../../lib/utils';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import api from '../../services/api';

export default function AccountOrders() {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my-orders', { params: { page, status: statusFilter } });
      setOrders(data.orders || []);
      setPagination(data.pagination || {});
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load orders' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const downloadInvoice = async (orderId, orderNumber) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to download invoice' }));
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/cancel`, { reason: 'Cancelled by customer' });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: 'cancelled' } : o));
      dispatch(addToast({ type: 'success', message: 'Order cancelled' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Cannot cancel order' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Orders</option>
          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <Link to="/products" className="text-indigo-600 hover:underline">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-indigo-600">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)} · {order.items?.length} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="font-semibold">{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-2 mb-3">
                  {order.items?.slice(0, 4).map((item, i) => (
                    <img
                      key={i}
                      src={item.product?.images?.[0] || item.image || 'https://placehold.co/40x40'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ))}
                  {order.items?.length > 4 && (
                    <span className="text-xs text-gray-500">+{order.items.length - 4} more</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {expandedOrder === order._id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {expandedOrder === order._id ? 'Hide' : 'View'} details
                  </button>
                  <button
                    onClick={() => downloadInvoice(order._id, order.orderNumber)}
                    className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Invoice
                  </button>
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>

                {/* Expanded details */}
                {expandedOrder === order._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <img
                          src={item.product?.images?.[0] || item.image || 'https://placehold.co/40x40'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.title || item.product?.title}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.trackingNumber && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 pt-2">
                        Tracking: <span className="font-medium">{order.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={pagination.page || 1} pages={pagination.pages || 1} onPageChange={setPage} />
    </div>
  );
}
