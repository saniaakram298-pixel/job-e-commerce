'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { NavLink, SubItem } from '@/types';

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
  const pathname = usePathname();

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
          <Link href="/wishlist" className="hover:scale-110 transition flex items-center">
            <span className="material-symbols-outlined text-[22px]">favorite</span>
          </Link>
          <Link href="/cart" className="hover:scale-110 transition flex items-center">
            <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
          </Link>
          <Link href="/login" className="hover:scale-110 transition flex items-center hidden md:flex">
            <span className="material-symbols-outlined text-[22px]">person</span>
          </Link>
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
