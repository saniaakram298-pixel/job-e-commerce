'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import SmartSearchBar from './SmartSearchBar';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'My Account', href: '/account' },
  { name: 'New Arrivals', href: '/new-arrivals' },
  { name: 'Editorial', href: '/editorial' },
  { name: 'The Journal', href: '/journal' },
];

interface NavbarAtelierProps {
  scrolled: boolean;
  cartCount?: number;
}

/**
 * Updated Navbar with Atelier Features
 * 
 * Features:
 * ✓ Smart Search Bar with Fuse.js (handles typos)
 * ✓ Minimalist design (no dark patterns)
 * ✓ Clear navigation
 * ✓ Trust indicators
 * ✓ Mobile responsive
 */
export default function NavbarAtelier({ scrolled, cartCount = 0 }: NavbarAtelierProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Main Navigation Row */}
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-light tracking-wider text-stone-900 hover:text-stone-700 transition-colors"
          >
            Atelier
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-stone-900 border-b-2 border-stone-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Section: Search + Cart + Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 text-stone-900 hover:bg-stone-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Secondary Row: Search Bar (visible on all screens) */}
        <div className="pb-4 flex justify-center">
          <div className="w-full max-w-md">
            <SmartSearchBar />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileOpen && (
        <nav className="lg:hidden bg-white border-t border-stone-200 px-4 py-6">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'bg-stone-100 text-stone-900 font-medium'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Trust Message in Mobile Menu */}
          <div className="mt-6 pt-6 border-t border-stone-200 space-y-2 text-xs text-stone-600">
            <p>✓ 30-Day Returns</p>
            <p>✓ Secure Checkout</p>
            <p>✓ Real Customer Support</p>
          </div>
        </nav>
      )}
    </header>
  );
}

/**
 * Alternative: Navbar with Enhanced Trust Badges
 * 
 * Use this version if you want more prominent trust indicators
 */
export function NavbarAtelierWithTrust({ 
  scrolled, 
  cartCount = 0 
}: NavbarAtelierProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Trust Bar - Optional: Show on scroll */}
        {scrolled && (
          <div className="flex justify-center gap-6 text-xs text-stone-600 py-2 border-b border-stone-200/50">
            <span className="flex items-center gap-1">✓ SSL Encrypted</span>
            <span className="flex items-center gap-1">✓ 30-Day Returns</span>
            <span className="flex items-center gap-1">✓ Tracked Shipping</span>
          </div>
        )}

        {/* Main Navigation */}
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link
            href="/"
            className="text-2xl font-light tracking-wider text-stone-900"
          >
            Atelier
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-stone-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pb-4 flex justify-center">
          <div className="w-full max-w-md">
            <SmartSearchBar />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <nav className="lg:hidden bg-white border-t border-stone-200 px-4 py-6">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-2"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
