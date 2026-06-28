'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavLink, SubItem } from '@/types';
import { useAuthStore } from '@/hooks/useAuth';

interface NavbarProps {
  scrolled: boolean;
}

const subItems: SubItem[] = [
  { name: "Children", id: "children" },
  { name: "Women", id: "women" },
  { name: "Men", id: "men" },
  { name: "Bridal", id: "bridal" },
  { name: "Groom", id: "groom" },
  { name: "Old People", id: "old-people" },
  { name: "Young", id: "young" },
  { name: "Formal Dress", id: "formal" },
  { name: "Informal", id: "informal" },
  { name: "Shoes Collection", id: "shoes" },
  { name: "Complete Dressing Sense", id: "complete-look" }
];

const navLinks: NavLink[] = [
  { name: 'Home', href: '/' },
  { name: 'Collections', href: '/collections' },
  { name: 'New Arrivals', href: '/new-arrivals' },
  { name: 'Editorial', href: '/editorial' },
  { name: 'Archive', href: '/archive' },
  { name: 'The Journal', href: '/journal' },
];

export default function Navbar({ scrolled }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isArrivalsOpen, setIsArrivalsOpen] = useState(false);
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
        {/* 1. LEFT SIDE: HAMBURGER MENU */}
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className={`transition-colors duration-500 ${
              scrolled ? "text-black" : "text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[28px] cursor-pointer">
              menu
            </span>
          </button>
        </div>

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
          {/* Search Icon - opens overlay input */}
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
                    {/* Dropdown Header */}
                    <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
                      <p className="text-sm font-semibold text-black">Admin Account</p>
                      {user?.email && (
                        <p className="text-xs text-stone-600 truncate">{user.email}</p>
                      )}
                    </div>

                    {/* Dropdown Items */}
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

      {/* --- SIDEBAR OVERLAY --- */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-500 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* --- SIDEBAR CONTENT --- */}
      <aside
        className={`fixed top-0 left-0 h-full w-[310px] bg-white shadow-2xl transition-transform duration-500 ease-in-out z-[60] overflow-y-auto p-8 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-end mb-10">
          <button
            onClick={() => setIsOpen(false)}
            className="text-black hover:rotate-90 transition-transform duration-300"
          >
            <span className="material-symbols-outlined text-[30px]">close</span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex flex-col space-y-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const linkName = link.name.toLowerCase();

            // Check for Collections or New Arrivals
            const isDropdownLink = linkName === 'collections' || linkName === 'new arrivals';
            const isOpenState = linkName === 'collections' ? isCollectionOpen : isArrivalsOpen;
            const setOpenState = linkName === 'collections' ? setIsCollectionOpen : setIsArrivalsOpen;

            if (isDropdownLink) {
              return (
                <div key={link.href} className="flex flex-col">
                  <div className="flex justify-between items-center w-full group">
                    {/* Main Page Link */}
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block text-sm uppercase tracking-[0.2em] transition-all duration-300 ${
                        isActive
                          ? "text-black font-bold"
                          : "text-stone-500 hover:text-black"
                      }`}
                    >
                      {link.name}
                    </Link>

                    {/* Arrow Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenState(!isOpenState);
                      }}
                      className="ml-3 p-1 hover:bg-stone-100 rounded-full transition-colors duration-300"
                      aria-label={`Toggle ${link.name} submenu`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] text-stone-400 transition-transform duration-300 ${
                          isOpenState ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>

                  {/* Dropdown Options */}
                  <div
                    className={`flex flex-col space-y-4 pl-4 overflow-hidden transition-all duration-500 ${
                      isOpenState
                        ? 'max-h-[600px] mt-6 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    {subItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={`${link.href}#${subItem.id}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] uppercase tracking-[0.15em] text-stone-400 hover:text-black transition-colors"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            // Normal Links (Home, Editorial, etc.)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-sm uppercase tracking-[0.2em] transition-all duration-300 ${
                  isActive
                    ? "text-black font-bold"
                    : "text-stone-500 hover:text-black"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <hr className="border-stone-100 my-4" />
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-black"
          >
            My Account
          </Link>
        </nav>
      </aside>
    </header>
  );
}
