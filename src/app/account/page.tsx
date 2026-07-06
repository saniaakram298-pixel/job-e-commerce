'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Mail,
  ShieldCheck,
  Package,
  ArrowRight,
  X,
  ShieldAlert,
  UserCircle2,
} from 'lucide-react';

const supportCards = [
  {
    id: 'help',
    title: 'Support Request',
    description: 'Ask a question or update your order status.',
    icon: Mail,
  },
  {
    id: 'returns',
    title: 'Returns & Disputes',
    description: 'Submit a return request or review dispute details.',
    icon: ShieldCheck,
  },
  {
    id: 'shipping',
    title: 'Order Tracking',
    description: 'Check shipping and delivery status for your orders.',
    icon: Package,
  },
];

type OrderItem = {
  _id?: string;
  name?: string;
  quantity?: number;
  price?: number;
  productId?: { img?: string; images?: string[]; name?: string; _id?: string } | string;
};

type Order = {
  _id: string;
  orderNumber?: number;
  totalPrice?: number;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt?: string;
  items?: OrderItem[];
};

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0);
}

export default function AccountPage() {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'idle' | 'codeSent' | 'verified'>('idle');
  const [orders, setOrders] = useState<Order[]>([]);

  const selectedCard = supportCards.find((card) => card.id === activeCard);

  const cardContent = useMemo(
    () => ({
      title: selectedCard?.title ?? 'Support',
      description: selectedCard?.description ?? 'Manage your account requests and orders.',
    }),
    [selectedCard]
  );

  const isEmailValid = (value: string) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value.trim());

  const handleSendCode = async () => {
    setStatusMessage('');
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !isEmailValid(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/account/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Unable to send verification code.');
        return;
      }

      setStep('codeSent');
      setStatusMessage('Verification code sent. Check your inbox and enter the 4-digit code below.');
    } catch (error) {
      setErrorMessage('Something went wrong while sending the code.');
      console.error('Send code error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    setStatusMessage('');
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !isEmailValid(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!/^[0-9]{4}$/.test(code.trim())) {
      setErrorMessage('Enter the 4-digit verification code.');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/account/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: code.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Verification failed.');
        return;
      }

      setOrders(data.data?.orders || []);
      setStep('verified');
      setStatusMessage('Email verified successfully. Your orders are shown below.');
    } catch (error) {
      setErrorMessage('Something went wrong while verifying the code.');
      console.error('Verify code error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_0.7fr] lg:items-start">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">My Account</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Secure order access.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Verify your email with a 4-digit code and view your order history instantly. This keeps account access secure while making order details easy to retrieve.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                {supportCards.map((card) => {
                  const Icon = card.icon;
                  const isActive = activeCard === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setActiveCard(card.id)}
                      className={`rounded-3xl border p-5 text-left transition-shadow duration-200 ${
                        isActive ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-900 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="mt-5 text-lg font-semibold">{card.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Email verification</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Verify your email</h2>
                </div>
                <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                  <UserCircle2 className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Enter the email address associated with your orders. We will send a 4-digit code that expires after 5 minutes.
              </p>

              <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {step !== 'verified' ? (
                  <div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={isSending}
                      className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isSending ? 'Sending code…' : 'Send verification code'}
                    </button>
                  </div>
                ) : null}

                {step === 'codeSent' || step === 'verified' ? (
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                      4-digit code
                    </label>
                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="1234"
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isVerifying}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isVerifying ? 'Verifying…' : 'Verify code and load orders'}
                    </button>
                  </div>
                ) : null}

                {statusMessage ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {statusMessage}
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    {errorMessage}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                    <ShieldAlert className="h-4 w-4" /> Secure access
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Only verified email owners can view orders. Your 4-digit code expires quickly so your account stays protected.
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {activeCard ? (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.25 }}
                className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white shadow-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Details</p>
                    <h3 className="mt-2 text-2xl font-semibold">{cardContent.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCard(null)}
                    className="rounded-full bg-slate-800 p-2 text-slate-200 transition hover:bg-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
                  Use your email address to verify your account and retrieve matching orders without a password.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {step === 'verified' ? (
            <div className="mt-10 space-y-6">
              <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Verified orders</p>
                  <h2 className="mt-2 text-3xl font-semibold">Your order history</h2>
                </div>
                <div className="rounded-3xl bg-slate-800 px-5 py-3 text-sm text-slate-100">
                  {orders.length > 0 ? `${orders.length} order${orders.length === 1 ? '' : 's'} found` : 'No orders found'}
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
                  <p className="text-lg font-semibold">No orders matched this email.</p>
                  <p className="mt-2 text-sm text-slate-500">If you believe this is an error, try verifying with another email address or contact support.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => (
                    <article key={order._id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Order #{order.orderNumber ?? '—'}</p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">{new Date(order.createdAt || '').toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{order.paymentStatus || 'Payment pending'}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{order.orderStatus || 'Status unknown'}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{formatCurrency(order.totalPrice)}</span>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {order.items?.map((item, index) => {
                          const productImage =
                            typeof item.productId === 'object' && item.productId
                              ? item.productId.img || item.productId.images?.[0]
                              : undefined;
                          return (
                            <div key={item._id || `${order._id}-${index}`} className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-200">
                                <img
                                  src={productImage || '/images/hero.png'}
                                  alt={item.name || 'Item image'}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">{item.name || 'Product'}</p>
                                <p className="mt-1 text-sm text-slate-500">Qty: {item.quantity || 1}</p>
                                <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.price)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 text-center text-sm text-slate-500 sm:flex-row sm:justify-center sm:text-left">
          <p>Need help with a past order?</p>
          <Link href="/" className="font-semibold text-slate-900 underline transition hover:text-slate-700">
            Back to shop
          </Link>
        </div>
      </section>
    </main>
  );
}
