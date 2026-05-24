import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Store, Eye, EyeOff } from 'lucide-react';
import { register as registerUser, clearError } from '../../redux/slices/authSlice';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Divider from '../../components/ui/Divider';
import GoogleButton from '../../components/ui/GoogleButton';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'seller']),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer' },
  });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const onSubmit = ({ confirmPassword, ...data }) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create account</h1>
          <p className="text-gray-500 mt-1">Join thousands of shoppers</p>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Google Sign-Up */}
          <GoogleButton label="Sign up with Google" redirectTo="/" />

          <Divider label="or sign up with email" />

          {/* Email / Password form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              autoComplete="name"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'customer', label: '🛍️ Shop', desc: 'Buy products' },
                  { value: 'seller', label: '🏪 Sell', desc: 'Sell products' },
                ].map((option) => (
                  <label key={option.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      value={option.value}
                      {...register('role')}
                      className="sr-only peer"
                    />
                    <div className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 dark:peer-checked:bg-indigo-900/20 transition-colors text-center">
                      <div className="text-lg">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
