'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShoppingCart, Lock, Truck, AlertCircle, Check } from 'lucide-react';
import { TransparentPricingCard, CleanCTA, TrustworthyGuarantee } from './MinimalistUITheme';
import { formatCurrency } from '@/lib/price';
import toast from 'react-hot-toast';

/**
 * Guest Checkout Schema - comprehensive yet minimal
 */
const guestCheckoutSchema = z.object({
  // Contact Info
  email: z.string().email('Invalid email address'),
  
  // Shipping Address
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  address: z.string().min(5, 'Street address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State/Province required'),
  zipCode: z.string().min(3, 'Postal code required'),
  country: z.string().min(2, 'Country required'),
  
  // Shipping Method
  shippingMethod: z.enum(['standard', 'express', 'overnight']),
  
  // Billing Address
  sameAsShipping: z.boolean(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZipCode: z.string().optional(),
  billingCountry: z.string().optional(),
  
  // Payment
  cardName: z.string().min(2, 'Name on card required'),
  cardNumber: z.string().regex(/^\d{13,19}$/, 'Invalid card number'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
  
  // Consent
  termsAccepted: z.boolean().refine(val => val === true, 'Please accept terms'),
  emailOptIn: z.boolean().optional(),
});

type GuestCheckoutFormData = z.infer<typeof guestCheckoutSchema>;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OnePageGuestCheckoutProps {
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  onOrderComplete?: (orderId: string) => void;
}

export default function OnePageGuestCheckout({
  cartItems,
  subtotal,
  tax,
  onOrderComplete,
}: OnePageGuestCheckoutProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingCost, setShippingCost] = useState(9.99);
  const [orderError, setOrderError] = useState('');

  const {
    control,
    watch,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<GuestCheckoutFormData>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: {
      sameAsShipping: true,
      shippingMethod: 'standard',
      emailOptIn: true,
    },
  });

  const sameAsShipping = watch('sameAsShipping');
  const shippingMethod = watch('shippingMethod');
  const total = subtotal + tax + shippingCost;

  // Update shipping cost based on method
  useEffect(() => {
    switch (shippingMethod) {
      case 'standard':
        setShippingCost(9.99);
        break;
      case 'express':
        setShippingCost(24.99);
        break;
      case 'overnight':
        setShippingCost(49.99);
        break;
    }
  }, [shippingMethod]);

  const onSubmit = async (data: GuestCheckoutFormData) => {
    try {
      setIsProcessing(true);
      setOrderError('');

      // Call your order API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'guest',
          customer: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
          },
          shippingAddress: {
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
          },
          billingAddress: sameAsShipping
            ? undefined
            : {
                address: data.billingAddress,
                city: data.billingCity,
                state: data.billingState,
                zipCode: data.billingZipCode,
                country: data.billingCountry,
              },
          items: cartItems,
          shippingMethod: data.shippingMethod,
          shippingCost,
          subtotal,
          tax,
          total,
          emailOptIn: data.emailOptIn,
        }),
      });

      if (!response.ok) {
        throw new Error('Order creation failed');
      }

      const { orderId } = await response.json();

      toast.success('Order placed successfully!');
      onOrderComplete?.(orderId);

      // Redirect to order confirmation
      router.push(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Checkout error:', error);
      setOrderError(
        error instanceof Error ? error.message : 'Failed to place order. Please try again.'
      );
      toast.error('Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Your cart is empty</h2>
        <p className="text-stone-600 mb-6">Add items before checking out.</p>
        <button
          onClick={() => router.push('/products')}
          className="bg-stone-900 text-white px-6 py-3 rounded-lg hover:bg-stone-800"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg border border-stone-200">
      <h1 className="text-3xl font-bold text-stone-900 mb-8 flex items-center gap-3">
        <Lock className="w-8 h-8" />
        Secure Guest Checkout
      </h1>

      {orderError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-900">{orderError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <Section title="1. Contact Information">
              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className={inputStyles(!!errors.email)}
                />
                {errors.email && <ErrorMessage msg={errors.email.message} />}
              </div>
              <label className="flex items-center gap-3 mt-4 cursor-pointer">
                <input type="checkbox" {...register('emailOptIn')} />
                <span className="text-sm text-stone-700">
                  I'd like to receive updates about new arrivals and special offers
                </span>
              </label>
            </Section>

            {/* Shipping Address */}
            <Section title="2. Shipping Address">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">
                    First Name
                  </label>
                  <input
                    {...register('firstName')}
                    className={inputStyles(!!errors.firstName)}
                  />
                  {errors.firstName && <ErrorMessage msg={errors.firstName.message} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">
                    Last Name
                  </label>
                  <input
                    {...register('lastName')}
                    className={inputStyles(!!errors.lastName)}
                  />
                  {errors.lastName && <ErrorMessage msg={errors.lastName.message} />}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-stone-900 mb-2">
                  Street Address
                </label>
                <input
                  {...register('address')}
                  className={inputStyles(!!errors.address)}
                />
                {errors.address && <ErrorMessage msg={errors.address.message} />}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">
                    City
                  </label>
                  <input
                    {...register('city')}
                    className={inputStyles(!!errors.city)}
                  />
                  {errors.city && <ErrorMessage msg={errors.city.message} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">
                    State/Province
                  </label>
                  <input
                    {...register('state')}
                    className={inputStyles(!!errors.state)}
                  />
                  {errors.state && <ErrorMessage msg={errors.state.message} />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">
                    Postal Code
                  </label>
                  <input
                    {...register('zipCode')}
                    className={inputStyles(!!errors.zipCode)}
                  />
                  {errors.zipCode && <ErrorMessage msg={errors.zipCode.message} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">
                    Country
                  </label>
                  <input
                    {...register('country')}
                    className={inputStyles(!!errors.country)}
                  />
                  {errors.country && <ErrorMessage msg={errors.country.message} />}
                </div>
              </div>
            </Section>

            {/* Shipping Method */}
            <Section title="3. Shipping Method">
              <div className="space-y-3">
                {[
                  { value: 'standard', label: 'Standard (5-7 days)', cost: '$9.99' },
                  { value: 'express', label: 'Express (2-3 days)', cost: '$24.99' },
                  { value: 'overnight', label: 'Overnight', cost: '$49.99' },
                ].map((method) => (
                  <label
                    key={method.value}
                    className="flex items-center gap-3 p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50"
                  >
                    <input
                      type="radio"
                      {...register('shippingMethod')}
                      value={method.value}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{method.label}</p>
                    </div>
                    <p className="text-stone-700 font-medium">{method.cost}</p>
                  </label>
                ))}
              </div>
            </Section>

            {/* Billing Address */}
            <Section title="4. Billing Address">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input type="checkbox" {...register('sameAsShipping')} />
                <span className="text-stone-700">Same as shipping address</span>
              </label>

              {!sameAsShipping && (
                <div className="space-y-4 p-4 bg-stone-50 rounded-lg">
                  <input
                    {...register('billingAddress')}
                    placeholder="Street Address"
                    className={inputStyles(!!errors.billingAddress)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      {...register('billingCity')}
                      placeholder="City"
                      className={inputStyles(!!errors.billingCity)}
                    />
                    <input
                      {...register('billingState')}
                      placeholder="State"
                      className={inputStyles(!!errors.billingState)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      {...register('billingZipCode')}
                      placeholder="Postal Code"
                      className={inputStyles(!!errors.billingZipCode)}
                    />
                    <input
                      {...register('billingCountry')}
                      placeholder="Country"
                      className={inputStyles(!!errors.billingCountry)}
                    />
                  </div>
                </div>
              )}
            </Section>

            {/* Payment Information */}
            <Section title="5. Payment Information">
              <div>
                <label className="block text-sm font-medium text-stone-900 mb-2">
                  Name on Card
                </label>
                <input
                  {...register('cardName')}
                  placeholder="John Doe"
                  className={inputStyles(!!errors.cardName)}
                />
                {errors.cardName && <ErrorMessage msg={errors.cardName.message} />}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-stone-900 mb-2">
                  Card Number
                </label>
                <input
                  {...register('cardNumber')}
                  placeholder="1234 5678 9012 3456"
                  className={inputStyles(!!errors.cardNumber)}
                />
                {errors.cardNumber && <ErrorMessage msg={errors.cardNumber.message} />}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">
                    Expiry (MM/YY)
                  </label>
                  <input
                    {...register('expiryDate')}
                    placeholder="12/25"
                    className={inputStyles(!!errors.expiryDate)}
                  />
                  {errors.expiryDate && <ErrorMessage msg={errors.expiryDate.message} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">
                    CVV
                  </label>
                  <input
                    {...register('cvv')}
                    placeholder="123"
                    type="password"
                    className={inputStyles(!!errors.cvv)}
                  />
                  {errors.cvv && <ErrorMessage msg={errors.cvv.message} />}
                </div>
              </div>
            </Section>

            {/* Terms */}
            <Section title="6. Confirm Order">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="w-4 h-4 mt-1"
                />
                <span className="text-sm text-stone-700">
                  I agree to the{' '}
                  <a href="/terms" className="underline text-stone-900 hover:text-stone-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="underline text-stone-900 hover:text-stone-700">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.termsAccepted && (
                <ErrorMessage msg={errors.termsAccepted.message} />
              )}
            </Section>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Cart Items Summary */}
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-stone-900 mb-4">Order Summary</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pb-4 border-b border-stone-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="text-stone-900 font-medium">{item.name}</p>
                        <p className="text-stone-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-stone-900 font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-stone-700">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Shipping</span>
                    <span>{formatCurrency(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
                  <Lock className="w-4 h-4" />
                  SSL Encrypted
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded">
                  <Truck className="w-4 h-4" />
                  Tracked Shipping
                </div>
                <div className="flex items-center gap-2 text-sm text-stone-700 bg-stone-50 p-3 rounded">
                  <Check className="w-4 h-4" />
                  30-Day Returns
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className={`
                  w-full py-3 rounded-lg font-semibold transition-all
                  ${
                    isProcessing
                      ? 'bg-stone-400 text-stone-200 cursor-not-allowed'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }
                `}
              >
                {isProcessing ? 'Processing...' : `Place Order • ${formatCurrency(total)}`}
              </button>

              <p className="text-xs text-stone-500 text-center">
                No account required. Guest checkout only.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Trust Section */}
      <div className="mt-12 pt-8 border-t border-stone-200">
        <h2 className="text-xl font-bold text-stone-900 mb-6">Why Shop with Us</h2>
        <TrustworthyGuarantee />
      </div>
    </div>
  );
}

/* Helper Components */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-6 border-b border-stone-200 last:border-b-0">
      <h2 className="text-lg font-semibold text-stone-900 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ErrorMessage({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
    <AlertCircle className="w-3 h-3" /> {msg}
  </p>;
}

const inputStyles = (hasError: boolean) =>
  `w-full px-4 py-2 border rounded-lg text-sm transition-colors
   ${
     hasError
       ? 'border-red-300 bg-red-50 text-red-900'
       : 'border-stone-300 bg-white text-stone-900'
   }
   focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent`;
