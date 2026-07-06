'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';

interface NavbarProps {
  scrolled: boolean;
}

// Sirf Home, My Account, aur Editorial ke links ko active rakha hai
const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'My Account', href: '/account' },
  { name: 'Editorial', href: '/editorial' },
];

export default function Navbar({ scrolled }: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuthStore();

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

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    router.push('/login');
  };

  // Handle admin dashboard navigation
  const handleAdminDashboard = () => {
    router.push('/admin/dashboard');
    setIsProfileOpen(false);
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 px-6 md:px-12 transition-all duration-500 ease-in-out ${
        scrolled
          ? "bg-stone-100/95 backdrop-blur-md py-4 shadow-sm"
          : "bg-transparent py-8"
      }`}
    >
      <div className="flex justify-between items-center max-w-[1440px] mx-auto">
        
        {/* 1. LEFT SIDE: DIRECT INLINE MODULES (No Sidebar Menu) */}
        <nav className="flex items-center space-x-8">
          {navLinks.map((link) => {
  const isActive = pathname === link.href;
  return (
    <Link
      key={link.href}
      href={link.href}
      prefetch={true}
      className={`text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
        isActive
          ? scrolled 
            ? "text-black font-bold border-b border-black" 
            : "text-white font-bold border-b border-white" // Active link on transparent banner (heading color)
          : scrolled 
            ? "text-stone-600 hover:text-black" 
            : "text-white/100 hover:text-white" // Heading jesa rich white base texture with smooth visibility
      }`}
    >
      {link.name}
    </Link>
  );
})}
        </nav>

        {/* 2. CENTER: LOGO */}
        <Link
          href="/"
          className={`font-serif text-2xl font-bold tracking-[0.3em] uppercase transition-colors duration-500 absolute left-1/2 -translate-x-1/2 ${
            scrolled ? "text-black" : "text-white"
          }`}
        >
          THE ATELIER
        </Link>

        {/* 3. RIGHT SIDE: ICONS */}
        <div
          className={`flex items-center space-x-6 transition-colors duration-500 ${
            scrolled ? "text-black" : "text-white"
          }`}
        >
          {/* Search Icon */}
          <button
            onClick={() => {
              const ev = new CustomEvent('atelier:toggle-search', { detail: true });
              window.dispatchEvent(ev);
            }}
            className="hover:scale-110 transition flex items-center"
            aria-label="Open search"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
          
          <Link href="/wishlist" className="hover:scale-110 transition flex items-center">
            <span className="material-symbols-outlined text-[22px]">favorite</span>
          </Link>
          
          <Link href="/cart" className="hover:scale-110 transition flex items-center">
            <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
          </Link>

          {/* Profile Icon with Dropdown */}
          <div ref={profileRef} className="relative hidden md:flex">
            {user ? (
              <>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="hover:scale-110 transition flex items-center"
                  aria-label="Profile menu"
                >
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </button>

                {/* Profile Dropdown Menu */}
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
                        <span className="material-symbols-outlined text-[18px]">
                          dashboard
                        </span>
                        Admin Dashboard
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2 border-t border-stone-200"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          logout
                        </span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link href="/login" className="hover:scale-110 transition flex items-center">
                <span className="material-symbols-outlined text-[22px]">person</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}