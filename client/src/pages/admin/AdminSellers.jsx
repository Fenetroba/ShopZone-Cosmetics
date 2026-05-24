import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatDate, getStatusColor } from '../../lib/utils';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import api from '../../services/api';

export default function AdminSellers() {
  const dispatch = useDispatch();
  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/sellers', { params: { page, status: statusFilter } });
      console.log(data.sellers)
      setSellers(data.sellers || []);
      setPagination(data.pagination || {});
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load sellers' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSellers(); }, [page, statusFilter]);

  const updateStatus = async (sellerId, status) => {
    try {
      await api.put(`/admin/sellers/${sellerId}/status`, { status, rejectionReason });
      setSellers((prev) => prev.map((s) => s._id === sellerId ? { ...s, status } : s));
      setSelectedSeller(null);
      dispatch(addToast({ type: 'success', message: `Seller ${status}` }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to update seller' }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sellers</h1>
        <p className="text-gray-500 text-sm mt-1">{pagination.total} total sellers</p>
      </div>

      <Card>
        <CardHeader>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Store</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                ) : sellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">No sellers found</td>
                  </tr>
                ) : (
                  sellers.map((seller) => (
                    <tr key={seller._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3">
                        <p className="font-medium">{seller.storeName}</p>
                        <p className="text-xs text-gray-500">{seller.businessEmail}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium">{seller.user?.name}</p>
                        <p className="text-xs text-gray-500">{seller.user?.email}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-500">{formatDate(seller.createdAt)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(seller.status)}`}>
                          {seller.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {seller.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(seller._id, 'approved')}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setSelectedSeller(seller)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {seller.status === 'approved' && (
                            <button
                              onClick={() => updateStatus(seller._id, 'suspended')}
                              className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                              title="Suspend"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          {seller.status === 'suspended' && (
                            <button
                              onClick={() => updateStatus(seller._id, 'approved')}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              title="Reactivate"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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

      <Modal isOpen={!!selectedSeller} onClose={() => setSelectedSeller(null)} title="Reject Seller" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Provide a reason for rejecting <strong>{selectedSeller?.storeName}</strong>:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Rejection reason..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setSelectedSeller(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => updateStatus(selectedSeller._id, 'rejected')}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
