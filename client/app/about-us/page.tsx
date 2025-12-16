'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CheckCircle, Users, Award, Truck, ShieldCheck, Headphones, Leaf, Target, Heart } from 'lucide-react';

export default function AboutUsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>About Us</h1>
          <p>Your Trusted Partner in Agricultural Excellence Since 2015</p>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="page-content">
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>About Us</span>
        </div>

        {/* Introduction Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              India&apos;s Leading Agricultural Marketplace
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              KRISHANSHECLAT AGROXGLOBAL is India&apos;s premier online agricultural marketplace, dedicated to serving farmers, 
              agricultural professionals, and gardening enthusiasts across the nation. Founded with a vision 
              to revolutionize agricultural commerce, we bring together quality products, competitive prices, 
              and exceptional service under one roof.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              With over 10,000+ products across categories including seeds, fertilizers, pesticides, 
              farm equipment, and irrigation systems, we are committed to making agriculture more 
              accessible and profitable for everyone.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/categories/seeds" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                <Leaf className="w-5 h-5" />
                Explore Products
              </Link>
              <Link href="/contact-us" className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <Image
                src="https://agribegri.com/static/uploads/eclatagro_logo.png"
                alt="KRISHANSHECLAT AGROXGLOBAL - Agricultural Excellence"
                width={400}
                height={200}
                className="object-contain p-8"
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Products Available</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Happy Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Cities Served</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">8+</div>
            <div className="stat-label">Years of Service</div>
          </div>
        </div>

        {/* Our Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
          <div className="info-box">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Our Mission</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To empower farmers and agricultural professionals across India by providing easy access 
              to quality agricultural products, expert guidance, and innovative solutions that drive 
              productivity, sustainability, and profitability in farming.
            </p>
          </div>
          <div className="info-box info-box-blue">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Our Vision</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To become India&apos;s most trusted agricultural platform, connecting every farmer with 
              the resources they need to succeed, while promoting sustainable farming practices 
              and contributing to the nation&apos;s food security.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Why Choose KRISHANSHECLAT AGROXGLOBAL?
        </h2>
        <div className="feature-grid mb-12">
          <div className="feature-card">
            <CheckCircle className="feature-card-icon text-green-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
            <p className="text-gray-600 text-sm">
              All products are sourced from certified manufacturers and undergo strict quality checks.
            </p>
          </div>
          <div className="feature-card">
            <Truck className="feature-card-icon text-blue-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Free Shipping</h3>
            <p className="text-gray-600 text-sm">
              Enjoy free delivery across India on all orders with no minimum purchase required.
            </p>
          </div>
          <div className="feature-card">
            <ShieldCheck className="feature-card-icon text-purple-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600 text-sm">
              Multiple payment options with 100% secure transaction processing.
            </p>
          </div>
          <div className="feature-card">
            <Headphones className="feature-card-icon text-orange-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Expert Support</h3>
            <p className="text-gray-600 text-sm">
              Our agricultural experts are available to help you with product selection and advice.
            </p>
          </div>
          <div className="feature-card">
            <Award className="feature-card-icon text-yellow-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Best Prices</h3>
            <p className="text-gray-600 text-sm">
              Competitive prices on all products with regular offers and discounts.
            </p>
          </div>
          <div className="feature-card">
            <Users className="feature-card-icon text-teal-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Trusted by Thousands</h3>
            <p className="text-gray-600 text-sm">
              Join over 50,000+ satisfied customers who trust KRISHANSHECLAT AGROXGLOBAL for their agricultural needs.
            </p>
          </div>
        </div>

        {/* Our Categories */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          What We Offer
        </h2>
        <div className="benefits-list mb-12">
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text"><strong>Seeds:</strong> Vegetable seeds, flower seeds, fruit seeds, and hybrid varieties</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text"><strong>Fertilizers:</strong> Organic and chemical fertilizers for all crop types</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text"><strong>Crop Protection:</strong> Pesticides, fungicides, and plant growth regulators</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text"><strong>Farm Equipment:</strong> Sprayers, tools, and agricultural machinery</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text"><strong>Irrigation:</strong> Drip systems, sprinklers, and water management solutions</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text"><strong>Gardening:</strong> Home gardening products, pots, and accessories</span>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="cta-banner">
          <h3>Ready to Transform Your Farming?</h3>
          <p>Browse our extensive collection of agricultural products and get the best deals today!</p>
          <Link href="/" className="cta-banner-btn">
            Shop Now
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
