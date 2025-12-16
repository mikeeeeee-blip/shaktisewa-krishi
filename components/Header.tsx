'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, User, Menu, X, LogOut, Package, LayoutDashboard, Home, UserCircle, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function Header({ onMenuToggle, isMenuOpen = false }: HeaderProps) {
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cartCount = getTotalItems();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 relative z-[1001] w-full sticky top-0 backdrop-blur-sm bg-white/95">
      <div className="w-full px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Top Row: Menu, Logo, Icons */}
          <div className="flex items-center justify-between py-2 sm:py-3 gap-2">
            {/* Menu Button */}
            <button
              onClick={onMenuToggle}
              className="flex-shrink-0 p-2.5 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X size={20} className="sm:w-5 sm:h-5" />
              ) : (
                <Menu size={20} className="sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Logo - Centered */}
            <Link href="/" className="flex items-center gap-1.5 flex-shrink-0 flex-1 justify-center">
              <Image src='/logo.png' alt='logo' className='object-cover' height={100} width={200}></Image>
            </Link>

            {/* Right Icons: Home, My Orders (if customer), Admin Dashboard (if admin), Shopping Cart, User */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link href="/" className="text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 p-2 active:scale-95" title="Home">
                <Home size={20} className="sm:w-5 sm:h-5" />
              </Link>
              {isAuthenticated && user?.role !== 'ADMIN' && (
                <Link href="/my-orders" className="text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 p-2 active:scale-95" title="My Orders">
                  <Package size={20} className="sm:w-5 sm:h-5" />
                </Link>
              )}
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link href="/admin/orders" className="text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 p-2 active:scale-95" title="Admin Dashboard">
                  <LayoutDashboard size={20} className="sm:w-5 sm:h-5" />
                </Link>
              )}
              <Link href="/cart" className="relative text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 p-2 active:scale-95">
                <ShoppingCart size={20} className="sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg border-2 border-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <Link
                  href={user?.role === 'ADMIN' ? '/admin/orders' : '/my-orders'}
                  className="text-gray-700 hover:text-green-600 transition-colors p-1.5 flex items-center justify-center"
                >
                  <User size={18} className="sm:w-5 sm:h-5" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-green-600 transition-colors p-1.5 flex items-center justify-center"
                >
                  <User size={18} className="sm:w-5 sm:h-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar - Below top row */}
          <div className="flex items-center gap-1 pb-2 sm:pb-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Desktop/Tablet Layout */}
        <div className="hidden lg:flex items-center justify-between py-3 md:py-4 gap-6 md:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-90 transition-opacity duration-200">
           <Image src='/logo.png' alt='logo' className='object-cover h-auto' height={100} width={200} priority></Image>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl flex items-center gap-3 mx-4 md:mx-6">
            <div className="flex-1 relative group">
              <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm md:text-base h-[46px] bg-gray-50 focus:bg-white transition-all duration-200"
              />
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-0 rounded-r-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center transition-all duration-200 h-[46px] min-w-[46px] flex-shrink-0 shadow-md hover:shadow-lg active:scale-95">
              <Search size={18} className="md:w-5 md:h-5" />
            </button>
            <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-3 rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap hidden xl:flex transition-all duration-200 font-semibold h-[46px] shadow-md hover:shadow-lg active:scale-95">
              <Search size={16} />
              <span>Search by Technical Name</span>
            </button>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link href="/" className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs md:text-sm px-3 py-2 group" title="Home">
              <Home size={20} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="whitespace-nowrap font-medium text-[11px] md:text-xs">Home</span>
            </Link>
            {isAuthenticated && user?.role !== 'ADMIN' && (
              <Link href="/my-orders" className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs md:text-sm px-3 py-2 group" title="My Orders">
                <Package size={20} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="whitespace-nowrap font-medium text-[11px] md:text-xs">My Orders</span>
              </Link>
            )}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link href="/admin/orders" className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs md:text-sm px-3 py-2 group" title="Admin Dashboard">
                <LayoutDashboard size={20} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="whitespace-nowrap font-medium text-[11px] md:text-xs">Admin</span>
              </Link>
            )}
            <Link href="/cart" className="relative flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs md:text-sm px-3 py-2 group">
              <ShoppingCart size={20} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="whitespace-nowrap font-medium text-[11px] md:text-xs">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-lg border-2 border-white px-1">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            <div className="relative z-[1002]">
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex flex-col items-center gap-1 text-gray-700 transition-all duration-200 text-xs md:text-sm px-3 py-2 rounded-lg ${
                      showUserMenu 
                        ? 'text-green-600 bg-green-50 shadow-sm ring-2 ring-green-200' 
                        : 'hover:text-green-600 hover:bg-gray-50'
                    }`}
                    aria-label="My Account"
                    aria-expanded={showUserMenu}
                  >
                    <User size={20} className="md:w-5 md:h-5" />
                    <span className="whitespace-nowrap font-medium text-[11px] md:text-xs">My Account</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[1002] transform transition-all duration-300 ease-out origin-top-right">
                      {/* User Info Section */}
                      <div className="px-5 py-4 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                              <User size={18} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {user?.firstName} {user?.lastName || ''}
                              </p>
                              <p className="text-xs text-gray-600 truncate mt-0.5">{user?.email}</p>
                            </div>
                          </div>
                          {user?.role === 'ADMIN' && (
                            <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full whitespace-nowrap shadow-sm">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        {/* My Profile - Always at top for all users */}
                        <Link
                          href="/my-profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group mx-2 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                            <UserCircle className="h-4 w-4 text-gray-600 group-hover:text-green-600 transition-colors" />
                          </div>
                          <span className="font-semibold">My Profile</span>
                        </Link>

                        {/* My Address - For all users */}
                        <Link
                          href="/my-addresses"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group mx-2 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                            <MapPin className="h-4 w-4 text-gray-600 group-hover:text-green-600 transition-colors" />
                          </div>
                          <span className="font-semibold">My Addresses</span>
                        </Link>

                        {user?.role === 'ADMIN' ? (
                          <Link
                            href="/admin/orders"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group mx-2 rounded-lg"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                              <LayoutDashboard className="h-4 w-4 text-gray-600 group-hover:text-green-600 transition-colors" />
                            </div>
                            <span className="font-semibold">Admin Dashboard</span>
                          </Link>
                        ) : (
                          <Link
                            href="/my-orders"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group mx-2 rounded-lg"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                              <Package className="h-4 w-4 text-gray-600 group-hover:text-green-600 transition-colors" />
                            </div>
                            <span className="font-semibold">My Orders</span>
                          </Link>
                        )}
                        
                        {/* Divider */}
                        <div className="my-2 mx-2 border-t border-gray-100"></div>
                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 transition-all duration-200 group mx-2 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                            <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
                          </div>
                          <span className="font-semibold">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex flex-col items-center gap-1 text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs md:text-sm px-3 py-2 group"
                >
                  <User size={20} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                  <span className="whitespace-nowrap font-medium text-[11px] md:text-xs">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

