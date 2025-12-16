'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { TrendingUp, TrendingDown, Search, MapPin, RefreshCw, Calendar, BarChart3 } from 'lucide-react';

export default function FindCommodityPricesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const commodities = [
    { name: "Wheat", price: 2450, unit: "per quintal", change: 2.5, trend: "up" },
    { name: "Rice (Basmati)", price: 3800, unit: "per quintal", change: -1.2, trend: "down" },
    { name: "Cotton", price: 6200, unit: "per quintal", change: 3.1, trend: "up" },
    { name: "Soybean", price: 4600, unit: "per quintal", change: -0.8, trend: "down" },
    { name: "Maize", price: 2100, unit: "per quintal", change: 1.5, trend: "up" },
    { name: "Groundnut", price: 5800, unit: "per quintal", change: 0.5, trend: "up" },
    { name: "Mustard", price: 5200, unit: "per quintal", change: -2.1, trend: "down" },
    { name: "Chana (Gram)", price: 5100, unit: "per quintal", change: 1.8, trend: "up" }
  ];

  const states = [
    "All India", "Maharashtra", "Punjab", "Haryana", "Uttar Pradesh", 
    "Madhya Pradesh", "Rajasthan", "Gujarat", "Karnataka", "Tamil Nadu"
  ];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>Commodity Prices</h1>
          <p>Live Mandi Prices Across India</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Commodity Prices</span>
        </div>

        {/* Last Updated */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>Last Updated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</span>
          </div>
          <button className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
            <RefreshCw className="w-4 h-4" /> Refresh Prices
          </button>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search commodity..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 appearance-none bg-white"
            >
              <option value="">Select State/Region</option>
              {states.map((state, index) => (
                <option key={index} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {commodities.map((commodity, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{commodity.name}</h3>
                <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                  commodity.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {commodity.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(commodity.change)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">₹{commodity.price.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{commodity.unit}</p>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="info-box mb-8">
          <div className="flex items-start gap-4">
            <BarChart3 className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About Commodity Prices</h3>
              <p className="text-gray-600 mb-3">
                Our commodity prices are sourced from major mandis across India and updated regularly. 
                Prices may vary based on quality, quantity, and local market conditions.
              </p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Prices are indicative and subject to market fluctuations</li>
                <li>• Contact local mandis for exact rates and availability</li>
                <li>• Historical data helps track price trends over time</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Market Insights */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Market Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="feature-card">
            <TrendingUp className="w-10 h-10 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Top Gainers</h3>
            <p className="text-gray-600 text-sm">
              Cotton and Groundnut showing strong upward momentum this week.
            </p>
          </div>
          <div className="feature-card">
            <TrendingDown className="w-10 h-10 text-red-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Under Pressure</h3>
            <p className="text-gray-600 text-sm">
              Rice and Mustard prices declined due to increased supply.
            </p>
          </div>
          <div className="feature-card">
            <BarChart3 className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Market Outlook</h3>
            <p className="text-gray-600 text-sm">
              Overall positive sentiment with Rabi season procurement in progress.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-banner">
          <h3>Get Price Alerts!</h3>
          <p>Subscribe to receive daily price updates for your selected commodities.</p>
          <Link href="/customer-login" className="cta-banner-btn">
            Subscribe Now
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
