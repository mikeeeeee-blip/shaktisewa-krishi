'use client';

import { ChevronDown, Phone } from 'lucide-react';
import { useState } from 'react';

export default function TopBar() {
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  return (
    <div className="bg-[#2563eb] text-white text-sm w-full border-b border-blue-600">
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between py-2 sm:py-2.5 md:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            <a href="tel:7065060162" className="flex items-center gap-1 sm:gap-1.5 hover:opacity-90 transition-opacity font-medium text-[11px] xs:text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
              <Phone size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Missed call to order: </span>
              <span>7065060162</span>
            </a>
            <a href="tel:7428208822" className="flex items-center gap-1 sm:gap-1.5 hover:opacity-90 transition-opacity font-medium text-[11px] xs:text-xs sm:text-sm hidden sm:inline whitespace-nowrap flex-shrink-0">
              <span>Need help? Call us: 7428208822</span>
            </a>
            <span className="whitespace-nowrap font-medium text-[11px] xs:text-xs sm:text-sm hidden md:inline flex-shrink-0">Order: 7065060162 | Help: 7428208822</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-0.5 sm:gap-1 hover:opacity-90 transition-opacity font-medium text-[11px] xs:text-xs sm:text-sm px-1 sm:px-2 py-0.5 rounded hover:bg-blue-700"
              >
                <span>EN</span>
                <ChevronDown size={10} className={`sm:w-3.5 sm:h-3.5 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <a href="#" className="hover:underline whitespace-nowrap text-[10px] xs:text-xs sm:text-sm font-medium hidden xl:inline">Experts</a>
            <a href="#" className="hover:underline whitespace-nowrap text-[10px] xs:text-xs sm:text-sm font-medium hidden xl:inline">Track</a>
            <a href="#" className="hover:underline whitespace-nowrap text-[10px] xs:text-xs sm:text-sm font-medium hidden xl:inline">APP</a>
          </div>
        </div>
      </div>
    </div>
  );
}

