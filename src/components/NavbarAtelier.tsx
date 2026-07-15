'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react'; // NEW: Added useEffect
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X } from 'lucide-react';
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

export default function NavbarAtelier({ scrolled: parentScrolled, cartCount = 0 }: NavbarAtelierProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // NEW: LOCAL STATE TO HOLD JS-CONTROLLED SCROLL STATE
  // Pre-setting true to avoid SSR white logic overlap on refresh
  const [scrolled, setScrolled] = useState(true); 
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  // NEW: Handle mount-time logic mismatch
  useEffect(() => {
    // Component jab client par mount ho gaya, JavaScript ready hai
    // Tab ham parent se aani wali scroll logic ko apply karen ge.
    // Jab tak, default true state header white background dikhaey ge refresh k waqt
    setScrolled(parentScrolled); 
  }, [parentScrolled]);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        // Default (refresh/lag state) is white, but will smoothly sync after JS mount
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200'
          : 'bg-stone-900/40 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Main Navigation Row */}
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* 1. LEFT SIDE: Hamburger Button (Visible on mobile/tablet) */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className={`p-2 rounded-lg transition-colors ${
                // Non-scrolled state icons will be white against darker overlay
                scrolled ? 'text-stone-900 hover:bg-stone-100' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* 2. CENTER-LEFT: Logo (Stays readable always) */}
          <Link
            href="/"
            className={`text-xl md:text-2xl font-light tracking-wider hover:opacity-80 transition-all absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 ${
              scrolled ? 'text-stone-900' : 'text-white font-medium'
            }`}
          >
            Atelier
          </Link>

          {/* 3. CENTER: Desktop Navigation (Hidden on mobile/tablet) */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors py-1 ${
                  isActive(link.href)
                    ? scrolled
                      ? 'text-stone-900 border-b-2 border-stone-900'
                      : 'text-white border-b-2 border-white'
                    : scrolled
                    ? 'text-stone-600 hover:text-stone-900'
                    : 'text-stone-200 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* 4. RIGHT SIDE: Cart Icon */}
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className={`relative p-2 rounded-lg transition-colors ${
                scrolled ? 'text-stone-900 hover:bg-stone-100' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Secondary Row: Search Bar (Responsive spacing) */}
        <div className="pb-4 flex justify-center">
          <div className="w-full max-w-md">
            <SmartSearchBar />
          </div>
        </div>
      </div>

      {/* --- Mobile Slide-Down Navigation Menu --- */}
      {isMobileOpen && (
        <nav className="lg:hidden bg-white border-t border-stone-200 px-6 py-6 shadow-xl max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors text-base ${
                  isActive(link.href)
                    ? 'bg-stone-100 text-stone-900 font-semibold'
                    : 'text-stone-700 hover:bg-stone-50 font-medium'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Trust Indicators inside mobile drawer */}
          <div className="mt-8 pt-6 border-t border-stone-200 space-y-3 text-xs text-stone-500">
            <p className="flex items-center gap-2">✓ 30-Day Returns</p>
            <p className="flex items-center gap-2">✓ Secure Checkout</p>
            <p className="flex items-center gap-2">✓ Real Customer Support</p>
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
