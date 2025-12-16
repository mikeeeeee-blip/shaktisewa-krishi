'use client';

import { ChevronDown, ChevronUp, X, Home, FlaskConical, ChevronRight, User } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { categorySlugs, type CategoryType } from '@/lib/categories';

interface NavigationProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

interface Category {
  name: string;
  items?: string[];
}

const categories: Category[] = [
  {
    name: 'Growth Regulators',
    items: [
      'Humic Acid',
      'Yield Booster',
      'Fruit Quality Enhancer',
      'PGR / PGP / PGH',
      'Zymes',
      'Crop Special',
      'Root And Soil Fertility Booster',
      'Flowering Stimulants',
      'Humic & Fulvic Acid',
      'pH Balancer',
    ],
  },
  {
    name: 'Organic Farming',
    items: [
      'Organic Remedial Inputs',
      'Vermi Compost',
      'Organic Fertilizer',
      'Neem Oil',
      'Waste Decomposer',
      'Viricides',
    ],
  },
  {
    name: 'Crop Protection',
    items: [
      'Nematicide',
      'Adjuvants',
      'Bactericides',
      'Insecticides',
      'Animal Repellent',
      'Combo Product',
      'Herbicides',
      'Fungicides',
      'Acaricide | Miticide',
      'Bio Pesticides',
      'Disinfectant & Sanitation',
    ],
  },
  {
    name: 'Seeds',
    items: [
      'Onion',
      'Seeds Ball',
      'Cotton Seeds',
      'MARIGOLD',
      'Exotic Vegetable',
      'PULSE CROP',
      'VEGETABLE',
      'Leafy Vegetable',
      'FIELD CROP',
      'FRUIT CROP',
      'Desi Seeds',
      'Mushroom',
      'Root and Tuber Crop',
    ],
  },
  {
    name: 'Equipments',
    items: [
      'Earth Auger',
      'Vermicompost Bed',
      'Chain Saw',
      'Traps',
      'Hedge Trimmer',
      'Weed Mat',
      'Agricultural Hardware',
      'Pond Liner',
      'Azolla Bed',
      'Soil Testing Tools',
      'Torch',
      'Biofloc Tarpaulin',
      'Weeders',
      'Brush Cutter',
      'Spray Pump',
      'Water Pump',
      'Mulching Paper',
      'Fogging Machine',
      'Solar Agriculture Products',
      'Chaff Cutter',
      'Tarpaulin',
      'Crop Cover',
    ],
  },
  {
    name: 'Fertilizers',
    items: [
      'Chelated Micronutrient Fertilizer',
      'Water Soluble Fertilizers',
      'Bio Fertilizers',
      'Organic Fertilizers',
      'Liquid Fertilizers',
      'Bulk Fertilizer',
      'Root Fertility Booster',
      'Micronutrients Fertilizers',
    ],
  },
  {
    name: 'Irrigation',
    items: [
      'Rain Pipe',
      'Drip Irrigation Accessories',
      'Pipe & Fitting',
      'Sprinkler',
      'Drip Irrigation Kit',
    ],
  },
  {
    name: 'Gardening',
    items: [
      'Grow Bag',
      'Pesticides',
      'Gardening Kit',
      'Coco Peat',
      'Waste Compost Management',
      'Spray Pumps',
      'Accesssories',
      'Lawn Mowers',
      'Seeds',
      'FLOWER SEEDS',
      'Garden Shade Net',
      'Fertilizer',
      'Transplanting/ Repotting Mat',
      'Tools',
      'Pebbles',
      'Fertilizer Blend',
      'De Oiled Cake',
    ],
  },
  {
    name: 'Bulk',
    items: [
      'Remedies',
      'Mulching Sheet',
      'Seeds',
      'Equipments',
      'Organic Products',
      'Irrigation Parts',
      'Fertilizers',
      'Disinfectant & Sanitation',
    ],
  },
  {
    name: 'Cattle & Bird Care',
    items: [
      'Goat And Sheep Care',
      'Poultry Feed Supplements',
      'Aqua Care',
      'Mosquito Net',
      'Fodder Seed',
      'Animal Health Supplements',
      'Mineral Mixture',
      'Swine Supplement',
      'Aquaculture Feed Additives',
      'Bird Food',
      'Silage Bag (Murghas Bag)',
    ],
  },
];

export default function Navigation({ isMobileMenuOpen = false, onCloseMobileMenu }: NavigationProps) {
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Set mounted state - this is safe to call in useEffect for hydration detection
    const timer = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        onCloseMobileMenu?.();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseMobileMenu?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen, onCloseMobileMenu]);

  // Close dropdown when clicking outside (desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clickedCategory &&
        buttonRefs.current[clickedCategory] &&
        !buttonRefs.current[clickedCategory]?.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setClickedCategory(null);
      }
    };

    if (clickedCategory) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clickedCategory]);

  const updateDropdownPosition = useCallback(() => {
    if (clickedCategory && buttonRefs.current[clickedCategory]) {
      const button = buttonRefs.current[clickedCategory];
      if (button) {
        const rect = button.getBoundingClientRect();
        
        // Get viewport-relative position (for fixed positioning)
        // Position dropdown directly below the navbar, full width
        let top = rect.bottom;
        
        // Add a tiny gap to prevent any visual overlap
        top += 1;
        
        // Full screen width dropdown
        const dropdownWidth = window.innerWidth;
        const dropdownHeight = 350;
        
        // Full width from left edge
        const finalLeft = 0;
        
        setDropdownPosition({
          top: top,
          left: finalLeft,
          width: dropdownWidth,
          height: dropdownHeight,
        });
      }
    } else {
      setDropdownPosition(null);
    }
  }, [clickedCategory]);

  useEffect(() => {
    updateDropdownPosition();
    
    if (clickedCategory) {
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => {
        // Update position on resize to maintain full width
        updateDropdownPosition();
      };
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      // Also listen to nav container scroll
      const navContainer = navScrollRef.current;
      if (navContainer) {
        navContainer.addEventListener('scroll', handleScroll, true);
      }
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
        if (navContainer) {
          navContainer.removeEventListener('scroll', handleScroll, true);
        }
      };
    }
  }, [clickedCategory, updateDropdownPosition]);

  const currentCategory = categories.find(cat => cat.name === clickedCategory);
  const hasItems = currentCategory?.items && currentCategory.items.length > 0;

  // Dropdown content rendered inline to avoid creating components during render
  const dropdownContent = clickedCategory && hasItems && dropdownPosition ? (
    <div 
      ref={dropdownRef}
      className="bg-white text-gray-900 shadow-xl border border-gray-300 w-screen"
      style={{ 
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        height: `${dropdownPosition.height}px`,
        zIndex: 999999,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex flex-col md:flex-row h-full w-full">
        {/* Left side - Category items in two columns */}
        <div className="flex-1 p-3 md:p-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
              {currentCategory!.name}
            </h3>
            <div className="grid grid-cols-2 gap-x-3 md:gap-x-4 gap-y-0.5">
              {currentCategory!.items!.map((item, index) => {
                // Map category name to slug
                const categorySlug = categorySlugs[currentCategory!.name as CategoryType] || '';
                return (
                  <Link
                    key={index}
                    href={`/categories/${categorySlug}`}
                    className="block py-1 hover:text-green-600 transition-colors text-sm text-gray-700 hover:font-medium"
                  >
                    {item}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side - Placeholder message */}
        <div className="hidden md:flex items-center justify-center p-4 border-t md:border-t-0 md:border-l border-gray-200 w-[280px] bg-gray-50 flex-shrink-0">
          <div className="text-center">
            <div className="mb-2 flex justify-center">
              <svg 
                className="w-12 h-12 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium text-xs mb-1">
              Click on a category to see subcategories
            </p>
            <p className="text-gray-500 text-xs">
              Browse through our extensive product range
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <nav className="hidden lg:block bg-[#16a34a] text-white shadow-md relative w-full" style={{ zIndex: 1000, overflow: 'hidden', height: '44px', maxHeight: '44px' }}>
        <div className="w-full h-full" style={{ position: 'relative', overflow: 'hidden', height: '44px', maxHeight: '44px' }}>
          <div 
            ref={navScrollRef}
            className="flex items-center gap-0.5 sm:gap-1 md:gap-2 px-2 sm:px-3 md:px-4 scrollbar-hide h-full"
            style={{ 
              overflowX: 'auto',
              overflowY: 'hidden',
              position: 'relative',
              WebkitOverflowScrolling: 'touch',
              flexWrap: 'nowrap',
              height: '44px',
              maxHeight: '44px',
              minHeight: '44px',
            }}
          >
            {categories.map((category) => {
              const isClicked = clickedCategory === category.name;
              const hasItems = category.items && category.items.length > 0;
              
              return (
                <div
                  key={category.name}
                  className="relative flex-shrink-0"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (hasItems) {
                        // Toggle dropdown: if already open, close it; otherwise open it
                        setClickedCategory(isClicked ? null : category.name);
                      } else {
                        // If no items, navigate directly
                        window.location.href = `/categories/${categorySlugs[category.name as CategoryType] || category.name.toLowerCase().replace(/\s+/g, '-')}`;
                      }
                    }}
                    ref={(el) => { buttonRefs.current[category.name] = el as HTMLButtonElement | null; }}
                    className={`px-2 sm:px-2.5 md:px-3 lg:px-4 py-0 transition-colors flex items-center gap-0.5 sm:gap-1 whitespace-nowrap text-xs sm:text-sm md:text-base font-medium ${
                      isClicked ? 'bg-[#15803d]' : 'hover:bg-[#15803d]'
                    }`}
                    style={{ height: '44px', lineHeight: '44px', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="truncate max-w-[120px] sm:max-w-none">{category.name}</span>
                    {hasItems && (
                      isClicked ? (
                        <ChevronUp size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      )
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Side Menu - Slide in from left (for hamburger menu) */}
      {mounted && (
        <>
          {/* Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[9998] lg:hidden transition-opacity duration-300"
              onClick={onCloseMobileMenu}
            />
          )}

          {/* Mobile Side Menu */}
          <div
            ref={mobileMenuRef}
            className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[9999] lg:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Header - User Profile Section */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={20} className="text-gray-600" />
                </div>
                <span className="text-gray-800 font-medium">Guest User</span>
              </div>
              <button
                onClick={onCloseMobileMenu}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close menu"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="py-2">
              {/* Primary Navigation Links */}
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={() => onCloseMobileMenu?.()}
              >
                <Home size={20} className="text-[#16a34a]" strokeWidth={2} />
                <span className="font-medium text-base">Home</span>
              </Link>
              
              <Link
                href="/search"
                className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={() => onCloseMobileMenu?.()}
              >
                <FlaskConical size={20} className="text-[#16a34a]" strokeWidth={2} />
                <span className="font-medium text-base">Search by Technical Name</span>
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* Product Category Links */}
              {categories.map((category) => {
                const categoryInitial = category.name.charAt(0).toUpperCase();
                const hasItems = category.items && category.items.length > 0;
                const isExpanded = expandedMobileCategory === category.name;
                
                return (
                  <div key={category.name} className="border-b border-gray-200">
                    <Link
                      href={`/categories/${categorySlugs[category.name as CategoryType] || category.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center justify-between px-4 py-3 text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        if (hasItems) {
                          e.preventDefault();
                          setExpandedMobileCategory(isExpanded ? null : category.name);
                        } else {
                          onCloseMobileMenu?.();
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Circular icon with initial */}
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#15803d] font-bold text-lg">{categoryInitial}</span>
                        </div>
                        <span className="font-medium text-base text-gray-800">{category.name}</span>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                    </Link>
                    
                    {/* Subcategories */}
                    {hasItems && isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200">
                        {category.items!.map((item, index) => (
                          <Link
                            key={index}
                            href={`/categories/${categorySlugs[category.name as CategoryType] || category.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="block px-8 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#16a34a] transition-colors"
                            onClick={() => onCloseMobileMenu?.()}
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Policies & Support Section */}
              <div className="border-t border-gray-200 mt-2">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-[#16a34a] hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    // Toggle policies section if needed
                  }}
                >
                  <span className="font-semibold text-sm uppercase">Policies & Support</span>
                  <ChevronDown size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Render dropdown outside navbar using portal (Desktop only) */}
      {mounted && clickedCategory && hasItems && typeof window !== 'undefined' && createPortal(
        dropdownContent,
        document.body
      )}
    </>
  );
}
