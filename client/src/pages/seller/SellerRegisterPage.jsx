import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import { getMe } from '../../redux/slices/authSlice';
import api from '../../services/api';

const schema = z.object({
  storeName: z.string().min(3, 'Store name must be at least 3 characters'),
  storeDescription: z.string().optional(),
  businessEmail: z.string().email('Invalid email'),
  businessPhone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export default function SellerRegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { street, city, country, ...rest } = data;
      await api.post('/sellers/register', {
        ...rest,
        businessAddress: { street, city, country },
      });
      await dispatch(getMe());
      setSuccess(true);
      setTimeout(() => navigate('/seller'), 2000);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Registration failed' }));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Seller Account Created!</h1>
        <p className="text-gray-500">Your application is under review. Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Become a Seller</h1>
        <p className="text-gray-500 mt-2">Set up your store and start selling today</p>
      </div>

      <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Store Information</h2>
          <Input label="Store Name" placeholder="My Awesome Store" {...register('storeName')} error={errors.storeName?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Description</label>
            <textarea
              {...register('storeDescription')}
              rows={3}
              placeholder="Tell customers about your store..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 pt-2">Business Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Business Email" type="email" {...register('businessEmail')} error={errors.businessEmail?.message} />
            <Input label="Business Phone" {...register('businessPhone')} />
            <Input label="Street Address" {...register('street')} />
            <Input label="City" {...register('city')} />
            <Input label="Country" {...register('country')} />
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Submit Application
          </Button>
        </form>
      </div>
    </div>
  );
}
