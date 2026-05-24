import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Trash2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import api from '../../services/api';

export default function AdminUsers() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', {
        params: { page, limit: 20, search, role: roleFilter },
      });
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load users' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !isActive });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: !isActive } : u));
      dispatch(addToast({ type: 'success', message: `User ${!isActive ? 'activated' : 'deactivated'}` }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to update user' }));
    }
  };

  const deleteUser = async () => {
    try {
      await api.delete(`/admin/users/${deleteModal._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteModal._id));
      setDeleteModal(null);
      dispatch(addToast({ type: 'success', message: 'User deleted' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete' }));
    }
  };

  const roleColors = {
    customer: 'secondary',
    seller: 'default',
    admin: 'warning',
    superadmin: 'destructive',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{pagination.total} total users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-indigo-600">{user.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={roleColors[user.role] || 'secondary'}>{user.role}</Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-3">
                        <Badge variant={user.isActive ? 'success' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleUserStatus(user._id, user.isActive)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isActive
                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setDeleteModal(user)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete User" size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="destructive" onClick={deleteUser}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
