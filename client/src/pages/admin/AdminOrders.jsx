import { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { formatPrice, formatDate, getStatusColor } from '../../lib/utils';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import api from '../../services/api';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrders() {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders', {
        params: { page, limit: 20, status: statusFilter, search },
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || {});
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load orders' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter, search]);

  const updateStatus = async () => {
    if (!newStatus || !selectedOrder) return;
    setUpdating(true);
    try {
      await api.put(`/orders/${selectedOrder._id}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => o._id === selectedOrder._id ? { ...o, status: newStatus } : o));
      setSelectedOrder(null);
      dispatch(addToast({ type: 'success', message: 'Order status updated' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to update status' }));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{pagination.total} total orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3 font-medium text-indigo-600">#{order.orderNumber}</td>
                      <td className="py-3 px-3">
                        <p className="font-medium">{order.user?.name}</p>
                        <p className="text-xs text-gray-500">{order.user?.email}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-3 font-semibold">{formatPrice(order.totalPrice)}</td>
                      <td className="py-3 px-3">
                        <Badge variant={order.isPaid ? 'success' : 'warning'}>
                          {order.isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => { setSelectedOrder(order); setNewStatus(order.status); }}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page || 1} pages={pagination.pages || 1} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.orderNumber}`} size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{selectedOrder.user?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-medium">{formatPrice(selectedOrder.totalPrice)}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-medium capitalize">{selectedOrder.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Update Status</p>
              <div className="flex gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
                <Button onClick={updateStatus} loading={updating}>Update</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
