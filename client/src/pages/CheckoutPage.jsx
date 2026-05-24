import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Truck, CheckCircle } from 'lucide-react';
import { clearCart } from '../redux/slices/cartSlice';
import { addToast } from '../redux/slices/uiSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { formatPrice } from '../lib/utils';
import api from '../services/api';

const addressSchema = z.object({
  name: z.string().min(2, 'Name required'),
  street: z.string().min(5, 'Street address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  country: z.string().min(2, 'Country required'),
  zip: z.string().min(3, 'ZIP code required'),
  phone: z.string().min(7, 'Phone required'),
});

const STEPS = ['Address', 'Payment', 'Confirm'];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      country: 'US',
    },
  });

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price || item.price;
    return sum + price * item.quantity;
  }, 0);
  const shippingPrice = subtotal > 50 ? 0 : 9.99;
  const taxPrice = subtotal * 0.1;
  const total = subtotal + shippingPrice + taxPrice;

  useEffect(() => {
    if (items.length === 0 && !order) navigate('/cart');
  }, [items, order, navigate]);

  const onAddressSubmit = () => setStep(1);

  const placeOrder = async () => {
    setLoading(true);
    try {
      const shippingAddress = getValues();
      const orderItems = items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));

      const { data } = await api.post('/orders', {
        items: orderItems,
        shippingAddress,
        paymentMethod,
      });

      setOrder(data.order);

      if (paymentMethod === 'stripe') {
        // Create payment intent
        const { data: intentData } = await api.post('/payments/stripe/create-intent', {
          orderId: data.order._id,
        });
        // In a real app, use Stripe.js to confirm payment
        // For MVP, we'll simulate success
        await api.post('/payments/stripe/confirm', {
          orderId: data.order._id,
          paymentIntentId: 'pi_simulated_' + Date.now(),
        });
      }

      dispatch(clearCart());
      setStep(2);
      dispatch(addToast({ type: 'success', title: 'Order placed!', message: `Order #${data.order.orderNumber}` }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.message || 'Order failed' }));
    } finally {
      setLoading(false);
    }
  };

  if (step === 2 && order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-2">Order #{order.orderNumber}</p>
        <p className="text-gray-500 mb-8">We'll send you a confirmation email shortly.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/account/orders')}>View Orders</Button>
          <Button variant="outline" onClick={() => navigate('/products')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
              i <= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${i <= step ? 'text-indigo-600' : 'text-gray-500'}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`mx-4 h-0.5 w-12 sm:w-20 ${i < step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 0: Address */}
          {step === 0 && (
            <form onSubmit={handleSubmit(onAddressSubmit)} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" {...register('name')} error={errors.name?.message} />
                <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
                <Input label="Street Address" {...register('street')} error={errors.street?.message} className="sm:col-span-2" />
                <Input label="City" {...register('city')} error={errors.city?.message} />
                <Input label="State / Province" {...register('state')} error={errors.state?.message} />
                <Input label="ZIP / Postal Code" {...register('zip')} error={errors.zip?.message} />
                <Input label="Country" {...register('country')} error={errors.country?.message} />
              </div>
              <Button type="submit" className="mt-6 w-full sm:w-auto">Continue to Payment</Button>
            </form>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Payment Method
              </h2>
              <div className="space-y-3 mb-6">
                {[
                  { value: 'stripe', label: 'Credit / Debit Card (Stripe)', icon: '💳' },
                  { value: 'paypal', label: 'PayPal', icon: '🅿️' },
                  { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      paymentMethod === method.value
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="text-indigo-600"
                    />
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={() => setStep(2)}>Review Order</Button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && !order && (
            <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4">Review Your Order</h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => {
                  const product = item.product;
                  const price = product?.discountPrice > 0 ? product.discountPrice : product?.price || item.price;
                  return (
                    <div key={item._id} className="flex items-center gap-3">
                      <img
                        src={product?.images?.[0] || 'https://placehold.co/60x60'}
                        alt={product?.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product?.title}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={placeOrder} loading={loading}>
                  Place Order ({formatPrice(total)})
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-4 h-fit">
          <h3 className="text-base font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal ({items.length} items)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Shipping</span>
              <span>{shippingPrice === 0 ? 'Free' : formatPrice(shippingPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tax</span>
              <span>{formatPrice(taxPrice)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
