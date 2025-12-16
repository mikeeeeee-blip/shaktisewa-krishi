'use client';

import { useParams } from 'next/navigation';
import { productData } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { slugToCategory, categorizeProduct } from '@/lib/categories';
import { useState } from 'react';
import { Filter, Grid, List } from 'lucide-react';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const categoryName = slugToCategory[slug] || slug;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get all products in this category
  const categoryProducts = Object.values(productData).filter((product) => {
    const productCategory = categorizeProduct(product);
    return productCategory === categoryName;
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating' | 'discount'>('default');
  // Using categoryProducts directly for now, can add filtering later
  const filteredProducts = categoryProducts;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0);
      case 'price-high':
        return (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'discount':
        return (b.discountPercent || 0) - (a.discountPercent || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen w-screen overflow-x-hidden">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Category Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-5 md:py-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              {categoryName}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'} found
            </p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  aria-label="Grid view"
                >
                  <Grid size={18} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 sm:p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  aria-label="List view"
                >
                  <List size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={16} className="sm:w-4 sm:h-4.5 text-gray-600 flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                >
                  <option value="default">Default</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="discount">Highest Discount</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          {sortedProducts.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4'
                  : 'flex flex-col gap-2 sm:gap-3 md:gap-4'
              }
            >
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className={viewMode === 'list' ? 'w-full' : 'w-full h-full'}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-10 md:py-12">
              <p className="text-gray-500 text-base sm:text-lg">No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

