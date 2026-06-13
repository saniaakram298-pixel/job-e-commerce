'use client';

import React from 'react';
import { AlertCircle, Check, Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/lib/price';

/**
 * Atelier Design System - Minimalist UI
 * 
 * Key Principles:
 * ✓ Clear language - no deceptive copy
 * ✓ Honest pricing - no hidden fees shown at checkout
 * ✓ No fake urgency - avoid scarcity tactics
 * ✓ Accessibility first - high contrast, clear hierarchy
 * ✓ Transparency - all information upfront
 */

// Trust Badge - displays genuine certifications
export function TrustBadge() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg">
      <Check className="w-5 h-5 text-green-600" />
      <div className="text-sm">
        <p className="font-medium text-stone-900">Authentic & Certified</p>
        <p className="text-stone-600">100% genuine products with guarantee</p>
      </div>
    </div>
  );
}

// Transparent Pricing Card - shows breakdown clearly
export function TransparentPricingCard({ 
  productName, 
  basePrice, 
  tax, 
  shipping 
}: { 
  productName: string; 
  basePrice: number; 
  tax: number; 
  shipping: number;
}) {
  const total = basePrice + tax + shipping;

  return (
    <div className="w-full max-w-md p-6 bg-white border border-stone-300 rounded-lg">
      <h3 className="text-lg font-semibold text-stone-900 mb-4">Price Breakdown</h3>
      
      <div className="space-y-3 mb-4 pb-4 border-b border-stone-200">
        <div className="flex justify-between items-center">
          <span className="text-stone-700">{productName}</span>
          <span className="font-medium text-stone-900">{formatCurrency(basePrice)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-stone-600 text-sm">Sales Tax</span>
          <span className="text-stone-700 text-sm">{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-stone-600 text-sm">Shipping</span>
          <span className="text-stone-700 text-sm">{formatCurrency(shipping)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-semibold text-stone-900">Total</span>
        <span className="text-xl font-bold text-stone-900">{formatCurrency(total)}</span>
      </div>

      <p className="text-xs text-stone-500 mt-4 text-center">
        No hidden fees. This is your final price.
      </p>
    </div>
  );
}

// Honest Product Info - no exaggeration or false urgency
export function HonestProductInfo({ 
  productName, 
  description, 
  stockLevel,
  leadTime 
}: { 
  productName: string; 
  description: string; 
  stockLevel: number; 
  leadTime: string;
}) {
  const inStock = stockLevel > 0;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-stone-900">{productName}</h2>
      <p className="text-stone-700 leading-relaxed">{description}</p>

      <div className="space-y-3 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <div className="flex items-start gap-3">
          {inStock ? (
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium text-stone-900">
              {inStock ? `${stockLevel} in stock` : 'Currently out of stock'}
            </p>
            <p className="text-sm text-stone-600">
              {inStock 
                ? `Ships within ${leadTime}` 
                : `Available in ${leadTime}`}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-900">
          This product is ethically sourced and sustainably manufactured.
        </p>
      </div>
    </div>
  );
}

// Clean Call-to-Action - no manipulation
export function CleanCTA({ 
  label, 
  onClick, 
  disabled = false,
  variant = 'primary'
}: { 
  label: string; 
  onClick: () => void; 
  disabled?: boolean; 
  variant?: 'primary' | 'secondary';
}) {
  const buttonStyles = {
    primary: `
      bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-400
      px-6 py-3 rounded-lg font-medium transition-colors duration-200
      disabled:cursor-not-allowed
    `,
    secondary: `
      bg-white text-stone-900 border border-stone-300 hover:bg-stone-50
      disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition-colors duration-200
      disabled:cursor-not-allowed
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonStyles[variant]}
      aria-disabled={disabled}
    >
      {label}
    </button>
  );
}

// Guarantee Section - builds trust through transparency
export function TrustworthyGuarantee() {
  const guarantees = [
    {
      title: '30-Day Returns',
      description: 'Return any item within 30 days for a full refund, no questions asked.',
    },
    {
      title: 'Secure Checkout',
      description: 'Your payment data is encrypted with industry-standard SSL security.',
    },
    {
      title: 'Real Customer Support',
      description: 'Contact a real person Monday-Friday, 9am-5pm EST.',
    },
    {
      title: 'Transparent Pricing',
      description: 'Final price shown before checkout. No surprise fees added later.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {guarantees.map((item, idx) => (
        <div key={idx} className="p-4 border border-stone-200 rounded-lg">
          <h4 className="font-semibold text-stone-900 mb-2">{item.title}</h4>
          <p className="text-sm text-stone-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

// Global Minimalist Styles
export const minimalistStyles = `
  /* Avoid dark patterns */
  body {
    background-color: rgb(245, 241, 236);
    color: rgb(41, 37, 36);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* High contrast for accessibility */
  button:focus-visible, input:focus-visible, a:focus-visible {
    outline: 2px solid rgb(120, 113, 108);
    outline-offset: 2px;
  }

  /* No automatic hover effects that might trick users */
  .no-dark-pattern {
    /* Disabled default */
    pointer-events: none;
  }

  /* Transparent cards - show all information */
  .transparent-card {
    background: transparent;
    border: 1px solid rgb(209, 213, 219);
    padding: 1.5rem;
  }
`;
