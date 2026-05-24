import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import api from '../../services/api';

export default function AdminCoupons() {
  const dispatch = useDispatch();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/coupons');
      setCoupons(data.coupons || []);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load coupons' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditCoupon(null);
    reset({});
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditCoupon(coupon);
    reset({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      usageLimit: coupon.usageLimit,
      endDate: coupon.endDate?.slice(0, 10),
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editCoupon) {
        const res = await api.put(`/coupons/${editCoupon._id}`, data);
        setCoupons((prev) => prev.map((c) => c._id === editCoupon._id ? res.data.coupon : c));
        dispatch(addToast({ type: 'success', message: 'Coupon updated' }));
      } else {
        const res = await api.post('/coupons', data);
        setCoupons((prev) => [res.data.coupon, ...prev]);
        dispatch(addToast({ type: 'success', message: 'Coupon created' }));
      }
      setModalOpen(false);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Failed' }));
    }
  };

  const deleteCoupon = async (id) => {
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      dispatch(addToast({ type: 'success', message: 'Coupon deleted' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Coupons</h1>
          <p className="text-gray-500 text-sm mt-1">{coupons.length} coupons</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Discount</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Used</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Expires</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">No coupons yet</td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3 font-mono font-semibold text-indigo-600">{coupon.code}</td>
                      <td className="py-3 px-3">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {coupon.usedCount}/{coupon.usageLimit || '∞'}
                      </td>
                      <td className="py-3 px-3 text-gray-500">{formatDate(coupon.endDate)}</td>
                      <td className="py-3 px-3">
                        <Badge variant={coupon.isActive && new Date() <= new Date(coupon.endDate) ? 'success' : 'destructive'}>
                          {coupon.isActive && new Date() <= new Date(coupon.endDate) ? 'Active' : 'Expired'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(coupon)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteCoupon(coupon._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCoupon ? 'Edit Coupon' : 'Create Coupon'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Coupon Code" placeholder="SAVE20" {...register('code', { required: 'Required' })} error={errors.code?.message} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Type</label>
              <select {...register('discountType', { required: true })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <Input label="Discount Value" type="number" {...register('discountValue', { required: 'Required', min: 0 })} error={errors.discountValue?.message} />
            <Input label="Min Order Amount" type="number" {...register('minOrderAmount')} />
            <Input label="Usage Limit" type="number" placeholder="Unlimited" {...register('usageLimit')} />
            <Input label="Expiry Date" type="date" {...register('endDate', { required: 'Required' })} error={errors.endDate?.message} />
          </div>
          <Input label="Description" {...register('description')} />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editCoupon ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
