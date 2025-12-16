'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { productData } from '@/data/products';
import { Tag, Percent, ShoppingBag, Grid, List } from 'lucide-react';

export default function EclatSalePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Get products with best discounts
  const saleProducts = Object.values(productData)
    .filter((product) => {
      return product.discountPercent && product.discountPercent >= 15;
    })
    .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))
    .slice(0, 24);

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>KRISHANSHECLAT Sale</h1>
          <p>Mega Discounts on Agricultural Products!</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>KRISHANSHECLAT Sale</span>
        </div>

        {/* Sale Banner */}
        <div className="highlight-box mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-yellow-700" />
              <div>
                <h3>Mega Sale - Up to 50% OFF!</h3>
                <p>On Seeds, Fertilizers, Equipment & More!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {["All Products", "Seeds", "Fertilizers", "Equipment", "Irrigation", "Gardening"].map((category, index) => (
            <button
              key={index}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-full font-medium transition-colors ${
                index === 0 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-gray-600">
            <ShoppingBag className="w-5 h-5 inline mr-2" />
            Showing <span className="font-semibold text-gray-900">{saleProducts.length}</span> sale products
          </p>
          <div className="flex items-center gap-2">
            <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500">
              <option>Sort by: Discount</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest First</option>
            </select>
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
          {saleProducts.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            Load More Sale Items
          </button>
        </div>

        {/* Info Box */}
        <div className="info-box mt-12">
          <div className="flex items-center gap-3">
            <Percent className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Sale Terms & Conditions</h3>
              <p className="text-gray-600">
                Sale prices are valid while stocks last. Discounts cannot be combined with other offers. 
                Check individual product pages for specific terms.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
