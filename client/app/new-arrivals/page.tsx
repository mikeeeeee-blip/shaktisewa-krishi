'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { productData } from '@/data/products';
import { Sparkles, Filter, Grid, List } from 'lucide-react';

export default function NewArrivalsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Get newest products (last 20 products by ID)
  const newArrivals = Object.values(productData)
    .sort((a, b) => parseInt(b.id) - parseInt(a.id))
    .slice(0, 20);

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>New Arrivals</h1>
          <p>Discover the Latest Products Added to Our Collection</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>New Arrivals</span>
        </div>

        {/* Highlight */}
        <div className="highlight-box mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-700" />
            <div>
              <h3>Fresh Additions to Our Catalog!</h3>
              <p>Check out the newest products we&apos;ve added for your farming and gardening needs.</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{newArrivals.length}</span> new products
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
          {newArrivals.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            Load More Products
          </button>
        </div>

        {/* CTA */}
        <div className="cta-banner mt-12">
          <h3>Can&apos;t Find What You&apos;re Looking For?</h3>
          <p>Browse our complete catalog or contact us for assistance!</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="cta-banner-btn">
              Browse All Products
            </Link>
            <Link href="/contact-us" className="cta-banner-btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
