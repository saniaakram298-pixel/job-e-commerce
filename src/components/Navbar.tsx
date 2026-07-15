'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import { Menu, X, Search, Heart, ShoppingBag, User, LayoutDashboard, LogOut, LogIn } from 'lucide-react';

interface NavbarProps {
  scrolled: boolean;
}

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'My Account', href: '/account' },
  { name: 'Editorial', href: '/editorial' },
];

export default function Navbar({ scrolled: parentScrolled }: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(true);
  
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuthStore();

  useEffect(() => {
    setScrolled(parentScrolled);
  }, [parentScrolled]);

  // Handle outside clicks for profile dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isProfileOpen]);

  // Prevent scroll and isolate viewport when mobile menu is active
  useEffect(() => {
    const handleMobileMenuClick = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleMobileMenuClick);
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const handleAdminDashboard = () => {
    router.push('/admin/dashboard');
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    // 'w-screen' ya static layouts overflow kar sakte hain, isliye hamesha 'w-full left-0 right-0 max-w-full' use karein
    <header
      className={`fixed top-0 left-0 right-0 w-full max-w-full z-50 transition-all duration-500 ease-in-out ${
        scrolled
          ? "bg-stone-100/95 backdrop-blur-md py-4 px-4 md:px-8 lg:px-12 shadow-sm"
          : "bg-transparent py-6 px-4 md:px-8 lg:px-12" 
      }`}
    >
      <div className="flex justify-between items-center max-w-[1440px] mx-auto gap-2">
        
        {/* --- 1. LEFT SIDE: Hamburger Button --- */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex items-center xl:hidden p-1.5 rounded-lg transition-colors duration-300 ${
              scrolled ? "text-black hover:bg-stone-200/50" : "text-white hover:bg-white/10"
            }`}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <nav className="hidden xl:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                    isActive
                      ? scrolled 
                        ? "text-black font-bold border-b border-black" 
                        : "text-white font-bold border-b border-white"
                      : scrolled 
                        ? "text-stone-600 hover:text-black" 
                        : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* --- 2. CENTER: LOGO --- */}
        <div className="flex-1 flex justify-center min-w-0">
          <Link
            href="/"
            className={`font-serif text-lg md:text-2xl font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase transition-colors duration-500 truncate ${
              scrolled ? "text-black" : "text-white"
            }`}
          >
            THE ATELIER
          </Link>
        </div>

        {/* --- 3. RIGHT SIDE: ICONS --- */}
        <div
          className={`flex items-center space-x-1 md:space-x-3 transition-colors duration-500 flex-shrink-0 ${
            scrolled ? "text-black" : "text-white"
          }`}
        >
          <button
            onClick={() => {
              const ev = new CustomEvent('atelier:toggle-search', { detail: true });
              window.dispatchEvent(ev);
            }}
            className={`p-1.5 rounded-lg transition ${
              scrolled ? "hover:bg-stone-200/50" : "hover:bg-white/10"
            }`}
            aria-label="Open search"
          >
            <Search className="w-5 h-5 md:w-5.5 md:h-5.5" />
          </button>
          
          <Link 
            href="/wishlist" 
            className={`p-1.5 rounded-lg transition ${
              scrolled ? "hover:bg-stone-200/50" : "hover:bg-white/10"
            }`}
          >
            <Heart className="w-5 h-5 md:w-5.5 md:h-5.5" />
          </Link>
          
          <Link 
            href="/cart" 
            className={`p-1.5 rounded-lg transition ${
              scrolled ? "hover:bg-stone-200/50" : "hover:bg-white/10"
            }`}
          >
            <ShoppingBag className="w-5 h-5 md:w-5.5 md:h-5.5" />
          </Link>

          {/* Profile Dropdown for Large Screen */}
          <div ref={profileRef} className="relative hidden xl:flex">
            {user ? (
              <>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`p-2 rounded-lg transition ${
                    scrolled ? "hover:bg-stone-200/50" : "hover:bg-white/10"
                  }`}
                  aria-label="Profile menu"
                >
                  <User className="w-5.5 h-5.5" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-10 w-48 bg-white rounded-lg shadow-xl z-[70] overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
                      <p className="text-sm font-semibold text-black">Admin Account</p>
                      {user?.email && (
                        <p className="text-xs text-stone-600 truncate">{user.email}</p>
                      )}
                    </div>

                    <div className="py-2">
                      <button
                        onClick={handleAdminDashboard}
                        className="w-full px-4 py-2 text-left text-sm text-black hover:bg-stone-100 transition-colors duration-200 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4.5 h-4.5" />
                        Admin Dashboard
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2 border-t border-stone-200"
                      >
                        <LogOut className="w-4.5 h-4.5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link 
                href="/login" 
                className={`p-2 rounded-lg transition ${
                  scrolled ? "hover:bg-stone-200/50" : "hover:bg-white/10"
                }`}
              >
                <User className="w-5.5 h-5.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ============================================== */}
      {/* MOBILE DRAWER (With strict translate and isolation) */}
      {/* ============================================== */}
      
      {/* Backdrop (Only mounts when open so it can never occupy physical scroll space) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] xl:hidden transition-opacity duration-300" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Side Menu (Uses 'fixed top-0 left-0' but completely translated out of screen boundary safely) */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[9999] p-6 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out xl:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ willChange: 'transform' }} // GPU acceleration taake animation lag free ho
      >
        <div className="flex justify-between items-center pb-6 border-b border-stone-100 mb-6">
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-[0.2em] uppercase text-black"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            THE ATELIER
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        <nav className="flex flex-col space-y-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={`mobile-${link.href}`}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-semibold uppercase tracking-[0.15em] py-1 ${
                  isActive
                    ? "text-black border-b-2 border-black w-fit"
                    : "text-stone-600 hover:text-black"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-stone-100">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5.5 h-5.5 text-black" />
                <div>
                  <p className="text-sm font-semibold text-black">Admin Account</p>
                  {user?.email && <p className="text-xs text-stone-600 truncate">{user.email}</p>}
                </div>
              </div>
              
              <button
                onClick={handleAdminDashboard}
                className="w-full px-4 py-2.5 text-left text-sm text-black bg-stone-50 rounded-md hover:bg-stone-100 transition-all flex items-center gap-2.5"
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                Admin Dashboard
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-all flex items-center gap-2.5"
              >
                <LogOut className="w-4.5 h-4.5" />
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full px-4 py-3 text-center text-sm text-white bg-black rounded-md hover:bg-stone-900 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}