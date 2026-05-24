import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { User, Lock, Save } from 'lucide-react';
import { updateProfile } from '../../redux/slices/authSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import api from '../../services/api';

export default function AccountProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone, language: user?.language || 'en' },
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm();

  const onProfileSubmit = async (data) => {
    const result = await dispatch(updateProfile(data));
    if (updateProfile.fulfilled.match(result)) {
      dispatch(addToast({ type: 'success', message: 'Profile updated' }));
    } else {
      dispatch(addToast({ type: 'error', message: 'Update failed' }));
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      dispatch(addToast({ type: 'error', message: "Passwords don't match" }));
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      dispatch(addToast({ type: 'success', message: 'Password changed' }));
      resetPwd();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Failed' }));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-600">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-indigo-600 capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
              <Input label="Phone Number" {...register('phone')} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                <select {...register('language')} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                  <option value="fr">French</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePwd(onPasswordSubmit)} className="space-y-4">
            <Input label="Current Password" type="password" {...regPwd('currentPassword', { required: 'Required' })} error={pwdErrors.currentPassword?.message} />
            <Input label="New Password" type="password" {...regPwd('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} error={pwdErrors.newPassword?.message} />
            <Input label="Confirm New Password" type="password" {...regPwd('confirmPassword', { required: 'Required' })} error={pwdErrors.confirmPassword?.message} />
            <Button type="submit" loading={passwordLoading}>Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
