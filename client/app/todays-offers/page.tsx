'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { productData } from '@/data/products';
import { Percent, Clock, Filter, Grid, List, Zap } from 'lucide-react';

export default function TodaysOffersPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Get products with discount
  const discountedProducts = Object.values(productData)
    .filter((product) => {
      return product.discountPercent && product.discountPercent >= 10;
    })
    .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))
    .slice(0, 20);

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>Today&apos;s Offers</h1>
          <p>Grab Amazing Discounts on Agricultural Products!</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Today&apos;s Offers</span>
        </div>

        {/* Countdown Banner */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12" />
              <div>
                <h2 className="text-2xl font-bold">Flash Sale!</h2>
                <p className="opacity-90">Limited time offers on top products</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6" />
              <div className="flex gap-2">
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                  <span className="text-2xl font-bold">12</span>
                  <p className="text-xs opacity-80">Hours</p>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                  <span className="text-2xl font-bold">45</span>
                  <p className="text-xs opacity-80">Mins</p>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                  <span className="text-2xl font-bold">30</span>
                  <p className="text-xs opacity-80">Secs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discount Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[10, 20, 30, 40, 50].map((discount) => (
            <button
              key={discount}
              className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold hover:bg-green-200 transition-colors"
            >
              <Percent className="w-4 h-4" />
              {discount}% OFF & Above
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{discountedProducts.length}</span> products on offer
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 border border-green-600 bg-green-50 rounded-lg">
              <Grid className="w-5 h-5 text-green-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <List className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
          {discountedProducts.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            View More Offers
          </button>
        </div>

        {/* Info Box */}
        <div className="info-box mt-12">
          <h3 className="font-semibold text-gray-900 mb-2">About Today&apos;s Offers</h3>
          <p className="text-gray-600">
            Our daily offers are updated regularly with fresh discounts on seeds, fertilizers, equipment, 
            and more. Subscribe to our newsletter to get notified about new deals directly in your inbox!
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
