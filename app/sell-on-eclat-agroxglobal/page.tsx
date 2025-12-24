'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Store, TrendingUp, Users, Shield, Truck, BarChart, Headphones, CheckCircle, Mail, Phone } from 'lucide-react';

export default function SellOnEclatAgroxglobalPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const benefits = [
    {
      icon: Users,
      title: "Access to Million+ Customers",
      description: "Reach farmers and agricultural professionals across India through our platform"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Leverage our marketing tools and promotions to increase your sales"
    },
    {
      icon: Truck,
      title: "Logistics Support",
      description: "Use our fulfillment network for hassle-free shipping across India"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Get paid on time with secure payment processing and fraud protection"
    },
    {
      icon: BarChart,
      title: "Analytics Dashboard",
      description: "Track your performance with detailed sales analytics and insights"
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description: "24/7 seller support team to help you succeed on our platform"
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
          <h1>Sell on ShaktiSewa</h1>
          <p>Join India&apos;s Largest Agricultural Marketplace</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Sell on ShaktiSewa</span>
        </div>

        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Start Selling to Millions of Farmers
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            Join thousands of sellers on ShaktiSewa and grow your agricultural business. 
            Reach millions of customers across India with our easy-to-use platform.
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid mb-12">
          <div className="stat-card">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Active Buyers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Cities Covered</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">₹0</div>
            <div className="stat-label">Registration Fee</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">7 Days</div>
            <div className="stat-label">Payment Cycle</div>
          </div>
        </div>

        {/* Benefits */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Why Sell on ShaktiSewa?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="feature-card">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <benefit.icon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* How to Get Started */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How to Get Started</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="process-step-number">1</div>
              <h3>Register</h3>
              <p>Sign up with your business details and documents</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">2</div>
              <h3>Verify</h3>
              <p>Complete verification process (1-2 business days)</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">3</div>
              <h3>List Products</h3>
              <p>Upload your products with images and descriptions</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">4</div>
              <h3>Start Selling</h3>
              <p>Receive orders and grow your business!</p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">What You Need to Register</h2>
            <div className="benefits-list">
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">GST Registration Number</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">PAN Card (Individual/Business)</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">Bank Account Details for Payments</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">Valid Address Proof</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">Product Catalog with Images</span>
              </div>
            </div>
          </div>
          
          <div className="info-box">
            <Store className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Categories We Accept</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Seeds (Vegetable, Flower, Hybrid)</li>
              <li>• Fertilizers & Plant Nutrition</li>
              <li>• Pesticides & Crop Protection</li>
              <li>• Farm Equipment & Tools</li>
              <li>• Irrigation Systems</li>
              <li>• Gardening Products</li>
              <li>• Animal Feed & Care Products</li>
            </ul>
          </div>
        </div>

        {/* Commission Structure */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Transparent Commission Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="info-box text-center">
            <h4 className="font-semibold text-gray-900 mb-2">Registration</h4>
            <p className="text-3xl font-bold text-green-600">FREE</p>
            <p className="text-gray-600 text-sm">No signup charges</p>
          </div>
          <div className="info-box info-box-blue text-center">
            <h4 className="font-semibold text-gray-900 mb-2">Commission</h4>
            <p className="text-3xl font-bold text-blue-600">5-10%</p>
            <p className="text-gray-600 text-sm">Based on category</p>
          </div>
          <div className="info-box text-center">
            <h4 className="font-semibold text-gray-900 mb-2">Payout</h4>
            <p className="text-3xl font-bold text-green-600">7 Days</p>
            <p className="text-gray-600 text-sm">Quick payment cycle</p>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-banner">
          <h3>Ready to Start Selling?</h3>
          <p>Register now and start reaching millions of customers across India!</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:sellers@shaktisewa.com" className="cta-banner-btn">
              <Mail className="w-5 h-5" />
              Register Now
            </a>
            <a href="tel:9243143997" className="cta-banner-btn-secondary">
              <Phone className="w-5 h-5" />
              Talk to Us
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="info-box mt-8">
          <h3 className="font-semibold text-gray-900 mb-2">Have Questions?</h3>
          <p className="text-gray-600 mb-4">
            Our seller support team is here to help you get started.
          </p>
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              <a href="mailto:sellers@shaktisewa.com" className="text-green-600 hover:underline">sellers@shaktisewa.com</a>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              <span>*9243143997</span>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
