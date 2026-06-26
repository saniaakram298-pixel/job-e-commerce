'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { X } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  size?: string;
  img: string;
}

interface OrderFormData {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  paymentMethod: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<OrderFormData>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Pakistan',
    paymentMethod: 'cash-on-delivery',
  });

  useEffect(() => {
    // Set cart items from context
    setCartItems(cart as CartItem[]);
  }, [cart]);

  // Calculate total price
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
      return total + price * item.quantity;
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setErrorMessage('Name is required');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Valid email is required');
      return false;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setErrorMessage('City is required');
      return false;
    }
    if (!formData.state.trim()) {
      setErrorMessage('State/Province is required');
      return false;
    }
    if (!formData.zipCode.trim()) {
      setErrorMessage('Zip Code is required');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Please verify your information:\n\nName: ${formData.name}\nEmail: ${formData.email}\nAddress: ${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}\nCountry: ${formData.country}\nPayment Method: Cash on Delivery\n\nIs this information correct?`
    );

    if (!confirmed) {
      return;
    }

    // Prepare order data
    setIsLoading(true);
    setErrorMessage('');

    // Validate cart items have required fields
    if (!cartItems.every(item => item.id || (item as any)._id)) {
      setErrorMessage('Cart items are missing product IDs. Please refresh and try again.');
      setIsLoading(false);
      return;
    }

    const orderData = {
      type: 'guest',
      customerName: formData.name,
      customerEmail: formData.email,
      customer: {
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' '),
        email: formData.email,
      },
      items: cartItems.map((item) => {
        const productId = item.id || (item as any)._id;
        const quantity = Number(item.quantity) || 1;
        const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, '')) || 0;

        return {
          productId,
          name: item.name,
          quantity,
          price,
          ...(item.size && { size: item.size }),
        };
      }),
      shippingAddress: {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      },
      billingAddress: {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      },
      paymentMethod: formData.paymentMethod,
      totalPrice: calculateTotal(),
    };

    try {
      console.log('Sending order data:', JSON.stringify(orderData, null, 2));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      console.log('API Response:', response.status, result);

      if (!response.ok) {
        const errorMessage = result.message || result.error || 'Failed to place order';
        throw new Error(errorMessage);
      }

      // Success!
      setSuccessMessage('Order placed successfully! You will be redirected to home page in 3 seconds.');
      clearCart();

      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred while placing the order';
      console.error('Order placement error:', errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleBackToCart = () => {
    setShowOrderForm(false);
    setErrorMessage('');
  };

  if (cartItems.length === 0 && !successMessage) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-serif text-4xl mb-4">Your Cart is Empty</h1>
          <p className="text-stone-600 mb-8">Add some items before checkout</p>
          <button
            onClick={handleContinueShopping}
            className="px-6 py-3 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Success message screen
  if (successMessage) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="font-serif text-3xl mb-4 text-green-600">Order Confirmed!</h1>
          <p className="text-stone-600 mb-4">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 px-6 md:px-12 py-6 flex justify-between items-center bg-white shadow-sm">
        <div className="font-serif text-2xl font-bold tracking-widest text-stone-900 uppercase">
          THE ATELIER
        </div>
        <button
          onClick={handleContinueShopping}
          className="text-stone-600 hover:text-stone-900"
        >
          ✕
        </button>
      </header>

      <main className="pt-32 pb-20 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-5xl tracking-tighter mb-12">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Summary - Left Side */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white rounded-lg p-6 shadow-sm sticky top-32">
                <h2 className="font-serif text-2xl mb-6 tracking-tighter">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 pb-6 border-b border-stone-200 max-h-96 overflow-y-auto">
                  {cartItems.map((item, idx) => (
                    <div key={`${item.id}-${item.size || idx}`} className="flex gap-3">
                      <div className="w-16 h-16 bg-stone-200 rounded overflow-hidden flex-shrink-0">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">{item.name}</p>
                        {item.size && <p className="text-xs text-stone-600">Size: {item.size}</p>}
                        <p className="text-xs text-stone-600">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-stone-900">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Subtotal</span>
                    <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Shipping</span>
                    <span className="font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-stone-200">
                    <span className="font-semibold">Total</span>
                    <span className="font-serif text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Right Side */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {!showOrderForm ? (
                // Cart Review & Proceed Button
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <div className="mb-8">
                    <h2 className="font-serif text-2xl mb-6 tracking-tighter">Review Your Cart</h2>
                    <div className="space-y-4">
                      {cartItems.map((item, idx) => (
                        <div key={`${item.id}-${item.size || idx}`} className="flex justify-between items-start py-3 border-b border-stone-100 last:border-b-0">
                          <div>
                            <p className="font-semibold text-stone-900">{item.name}</p>
                            <p className="text-sm text-stone-600">Quantity: {item.quantity}</p>
                            {item.size && <p className="text-sm text-stone-600">Size: {item.size}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-stone-900">
                              ${(parseFloat(String(item.price).replace(/[^0-9.-]+/g, '')) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="w-full px-6 py-4 bg-stone-900 text-white font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-stone-800 transition"
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    onClick={handleContinueShopping}
                    className="w-full mt-3 px-6 py-4 border border-stone-300 text-stone-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-stone-50 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                // Order Form
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="font-serif text-2xl tracking-tighter">Delivery & Payment</h2>
                    <button
                      onClick={handleBackToCart}
                      className="text-stone-600 hover:text-stone-900"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                      {errorMessage}
                    </div>
                  )}

                  <form className="space-y-6">
                    {/* Personal Information */}
                    <section>
                      <h3 className="text-lg font-semibold text-stone-900 mb-4">Personal Information</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          name="name"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                          required
                        />
                        <input
                          type="email"
                          name="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                          required
                        />
                      </div>
                    </section>

                    {/* Delivery Address */}
                    <section>
                      <h3 className="text-lg font-semibold text-stone-900 mb-4">Delivery Address</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          name="address"
                          placeholder="Street Address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                          required
                        />
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                          required
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="state"
                            placeholder="State/Province"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                            required
                          />
                          <input
                            type="text"
                            name="zipCode"
                            placeholder="Zip Code"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                            required
                          />
                        </div>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                        >
                          <option value="Pakistan">Pakistan</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                          <option value="India">India</option>
                        </select>
                      </div>
                    </section>

                    {/* Payment Method */}
                    <section>
                      <h3 className="text-lg font-semibold text-stone-900 mb-4">Payment Method</h3>
                      <label className="flex items-center gap-3 p-4 border-2 border-stone-900 rounded-lg cursor-pointer bg-stone-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash-on-delivery"
                          checked={formData.paymentMethod === 'cash-on-delivery'}
                          onChange={handleInputChange}
                          className="w-4 h-4"
                        />
                        <span className="font-semibold text-stone-900">Cash on Delivery</span>
                      </label>
                    </section>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6">
                      <button
                        type="button"
                        onClick={handleBackToCart}
                        className="flex-1 px-6 py-4 border border-stone-300 text-stone-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-stone-50 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={isLoading}
                        className="flex-1 px-6 py-4 bg-stone-900 text-white font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-stone-800 transition disabled:bg-stone-400 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Processing...' : 'Place Order'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
