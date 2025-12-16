'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Map, ChevronRight, ShoppingBag, FileText, Users, Phone } from 'lucide-react';

export default function SitemapPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const sitemapSections = [
    {
      title: "Categories",
      icon: ShoppingBag,
      links: [
        { name: "Seeds", href: "/categories/seeds" },
        { name: "Fertilizers", href: "/categories/fertilizers" },
        { name: "Crop Protection", href: "/categories/crop-protection" },
        { name: "Equipments", href: "/categories/equipments" },
        { name: "Irrigation", href: "/categories/irrigation" },
        { name: "Gardening", href: "/categories/gardening" },
        { name: "Organic Farming", href: "/categories/organic-farming" },
        { name: "Cattle & Bird Care", href: "/categories/cattle-bird-care" },
        { name: "Bulk Orders", href: "/categories/bulk" }
      ]
    },
    {
      title: "Know Us Better",
      icon: Users,
      links: [
        { name: "About Us", href: "/about-us" },
        { name: "Why ShaktiSewa", href: "/why-eclat-agroxglobal" },
        { name: "Careers", href: "/careers" },
        { name: "Contact Us", href: "/contact-us" },
        { name: "New Arrivals", href: "/new-arrivals" },
        { name: "ShaktiSewa Sale", href: "/eclat-sale" },
        { name: "Today's Offers", href: "/todays-offers" },
        { name: "ShaktiSewa Talk", href: "/eclat-talk" },
        { name: "Find Commodity Prices", href: "/find-commodity-prices" },
        { name: "How Referral Works", href: "/how-referral-works" },
        { name: "ShaktiSewa Blog", href: "/eclat-agroxglobal-blog" }
      ]
    },
    {
      title: "Our Policies",
      icon: FileText,
      links: [
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Shipping & Delivery", href: "/shipping-delivery" },
        { name: "Cancellation Policy", href: "/cancellation-policy" },
        { name: "Return Policy", href: "/return-policy" },
        { name: "FAQ", href: "/faq" },
        { name: "Terms of Use", href: "/terms-of-use" },
        { name: "Seller Terms & Conditions", href: "/seller-terms-and-conditions" }
      ]
    },
    {
      title: "Services",
      icon: Phone,
      links: [
        { name: "Sell on ShaktiSewa", href: "/sell-on-eclat-agroxglobal" },
        { name: "Customer Login", href: "/customer-login" }
      ]
    }
  ];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>Sitemap</h1>
          <p>Navigate All Pages on ShaktiSewa</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Sitemap</span>
        </div>

        {/* Introduction */}
        <div className="info-box mb-8">
          <div className="flex items-center gap-3">
            <Map className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Complete Website Navigation</h3>
              <p className="text-gray-600">
                Find all pages and sections of our website organized by category for easy navigation.
              </p>
            </div>
          </div>
        </div>

        {/* Sitemap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sitemapSections.map((section, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      href={link.href}
                      className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors py-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Home
            </Link>
            <Link href="/contact-us" className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              Contact Us
            </Link>
            <Link href="/faq" className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
