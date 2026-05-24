import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Star, Search, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../lib/utils';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import api from '../../services/api';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const dispatch = useDispatch();
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [approvedFilter, setApprovedFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);

  // Autocomplete state
  const [productSearch, setProductSearch] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [userSearch, setUserSearch] = useState('');
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (approvedFilter !== '') params.isApproved = approvedFilter;
      const { data } = await api.get('/admin/reviews', { params });
      setReviews(data.reviews || []);
      setPagination(data.pagination || {});
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load reviews' }));
    } finally {
      setLoading(false);
    }
  }, [page, approvedFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Product search autocomplete
  useEffect(() => {
    if (!productSearch || productSearch.length < 2) { setProductSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/products', { params: { search: productSearch, limit: 8 } });
        setProductSuggestions(data.products || []);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // User search autocomplete
  useEffect(() => {
    if (!userSearch || userSearch.length < 2) { setUserSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/admin/users', { params: { search: userSearch, limit: 8 } });
        setUserSuggestions(data.users || []);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const openCreate = () => {
    reset({ title: '', comment: '' });
    setRatingValue(5);
    setSelectedProduct(null);
    setSelectedUser(null);
    setProductSearch('');
    setUserSearch('');
    setProductSuggestions([]);
    setUserSuggestions([]);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (!selectedProduct) {
      dispatch(addToast({ type: 'error', message: 'Please select a product' }));
      return;
    }
    if (!selectedUser) {
      dispatch(addToast({ type: 'error', message: 'Please select a user' }));
      return;
    }
    if (!ratingValue) {
      dispatch(addToast({ type: 'error', message: 'Please select a rating' }));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        productId: selectedProduct._id,
        userId: selectedUser._id,
        rating: ratingValue,
        title: data.title,
        comment: data.comment,
        isVerifiedPurchase: data.isVerifiedPurchase || false,
      };
      const res = await api.post('/reviews/admin', payload);
      dispatch(addToast({ type: 'success', message: 'Review created successfully' }));
      setModalOpen(false);
      fetchReviews();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Failed to create review' }));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleApproval = async (review) => {
    try {
      await api.put(`/admin/reviews/${review._id}`, { isApproved: !review.isApproved });
      setReviews((prev) =>
        prev.map((r) => r._id === review._id ? { ...r, isApproved: !r.isApproved } : r)
      );
      dispatch(addToast({
        type: 'success',
        message: `Review ${!review.isApproved ? 'approved' : 'rejected'}`,
      }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update review' }));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/reviews/${deleteModal._id}`);
      setReviews((prev) => prev.filter((r) => r._id !== deleteModal._id));
      setDeleteModal(null);
      dispatch(addToast({ type: 'success', message: 'Review deleted' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete review' }));
    }
  };

  const totalReviews = pagination.total;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and create product reviews</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create Review
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalReviews}</p>
              <p className="text-sm text-gray-500">Total Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{approvedCount}</p>
              <p className="text-sm text-gray-500">Approved (this page)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-xl">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending (this page)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <Select
          value={approvedFilter}
          onChange={(e) => { setApprovedFilter(e.target.value); setPage(1); }}
          className="w-44"
        >
          <option value="">All Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </Select>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Reviewer</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Comment</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">No reviews found</td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-indigo-600">
                              {review.user?.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{review.user?.name}</p>
                            {review.isVerifiedPurchase && (
                              <span className="text-xs text-emerald-600">✓ Verified</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-[140px]">
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                          {review.product?.title || '—'}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-xs">{review.rating}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-[200px]">
                        {review.title && (
                          <p className="font-medium text-xs text-gray-900 dark:text-gray-100 mb-0.5">{review.title}</p>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2">{review.comment}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={review.isApproved ? 'success' : 'warning'}>
                          {review.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleApproval(review)}
                            title={review.isApproved ? 'Reject' : 'Approve'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              review.isApproved
                                ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                          >
                            {review.isApproved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setDeleteModal(review)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

      {/* Create Review Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Review" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            {selectedProduct ? (
              <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedProduct.images?.[0] || 'https://placehold.co/32x32'}
                    className="w-8 h-8 rounded object-cover"
                    alt=""
                  />
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 line-clamp-1">
                    {selectedProduct.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedProduct(null); setProductSearch(''); }}
                  className="text-xs text-red-500 hover:underline ml-2 flex-shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {productSuggestions.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => { setSelectedProduct(p); setProductSearch(p.title); setProductSuggestions([]); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                      >
                        <img
                          src={p.images?.[0] || 'https://placehold.co/32x32'}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                          alt=""
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200 line-clamp-1">{p.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* User search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reviewer (User) <span className="text-red-500">*</span>
            </label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <span className="text-xs font-semibold text-emerald-600">
                      {selectedUser.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedUser.name}</p>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setUserSearch(''); }}
                  className="text-xs text-red-500 hover:underline ml-2 flex-shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {userSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {userSuggestions.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => { setSelectedUser(u); setUserSearch(u.name); setUserSuggestions([]); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {u.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <StarRating value={ratingValue} onChange={setRatingValue} />
          </div>

          <Input
            label="Review Title"
            placeholder="Brief summary (optional)"
            {...register('title')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('comment', { required: 'Comment is required' })}
              rows={4}
              placeholder="Write the review comment here..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.comment && (
              <p className="mt-1 text-xs text-red-500">{errors.comment.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('isVerifiedPurchase')}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Mark as Verified Purchase</span>
          </label>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Review
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Review" size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this review by <strong>{deleteModal?.user?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
