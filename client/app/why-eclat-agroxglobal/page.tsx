'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CheckCircle, Star, Truck, ShieldCheck, Headphones, Percent, RefreshCw, Leaf, BadgeCheck, User } from 'lucide-react';

export default function WhyEclatAgroxglobalPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Farmer, Punjab",
      content: "ShaktiSewa has transformed how I purchase agricultural inputs. The quality of products and timely delivery has helped improve my farm's productivity significantly."
    },
    {
      name: "Priya Sharma",
      role: "Home Gardener, Mumbai",
      content: "Excellent variety of gardening products! The seeds I ordered germinated perfectly, and the customer support team was very helpful with my queries."
    },
    {
      name: "Mohammed Hassan",
      role: "Agricultural Consultant, Karnataka",
      content: "I recommend ShaktiSewa to all my clients. Their competitive prices and genuine products make them the best choice for agricultural supplies."
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
          <h1>Why Choose ShaktiSewa ?</h1>
          <p>India&apos;s Most Trusted Agricultural Marketplace</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Why ShaktiSewa</span>
        </div>

        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Your Success is Our Priority
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            ShaktiSewa is committed to empowering farmers and agricultural professionals with quality products, 
            competitive prices, and exceptional service. Here&apos;s why thousands of customers trust us.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="feature-grid mb-12">
          <div className="feature-card">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <BadgeCheck className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">100% Genuine Products</h3>
            <p className="text-gray-600 text-sm">
              All products are sourced directly from authorized manufacturers and certified suppliers. 
              Quality guaranteed on every purchase.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Percent className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Best Price Guarantee</h3>
            <p className="text-gray-600 text-sm">
              We offer the most competitive prices in the market. Save more on every order with our 
              regular discounts and special offers.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Truck className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Free Pan-India Delivery</h3>
            <p className="text-gray-600 text-sm">
              Free shipping across India on all orders. No minimum purchase required. 
              Reliable delivery to your doorstep.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy Returns</h3>
            <p className="text-gray-600 text-sm">
              Hassle-free 7-day return policy. If you&apos;re not satisfied, we&apos;ll make it right 
              with easy replacements or refunds.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Expert Support</h3>
            <p className="text-gray-600 text-sm">
              Our agricultural experts are available to help you choose the right products 
              and provide farming guidance.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure Shopping</h3>
            <p className="text-gray-600 text-sm">
              100% secure payment processing with multiple payment options including 
              COD, UPI, cards, and net banking.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Track Record</h2>
          <div className="stats-grid">
            <div className="stat-card bg-white">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Products Available</div>
            </div>
            <div className="stat-card bg-white">
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-card bg-white">
              <div className="stat-number">500+</div>
              <div className="stat-label">Cities Covered</div>
            </div>
            <div className="stat-card bg-white">
              <div className="stat-number">4.5★</div>
              <div className="stat-label">Customer Rating</div>
            </div>
          </div>
        </div>

        {/* Why We're Different */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">What Sets Us Apart</h2>
        <div className="benefits-list mb-12">
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text">Wide range of 10,000+ agricultural products from trusted brands</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text">Direct sourcing from manufacturers ensures authentic products</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text">Free shipping across India with no minimum order value</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text">Agricultural experts available for product recommendations</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text">Regular offers, discounts, and special deals for customers</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text">Easy 7-day return and replacement policy</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text">Secure payment options including COD for all orders</span>
          </div>
          <div className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span className="benefit-text">Fast order processing and reliable delivery network</span>
          </div>
        </div>

        {/* Testimonials */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="testimonial-content">&ldquo;{testimonial.content}&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="testimonial-name">{testimonial.name}</p>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="cta-banner">
          <h3>Ready to Experience the ShaktiSewa Difference?</h3>
          <p>Join thousands of satisfied customers and start shopping today!</p>
          <Link href="/" className="cta-banner-btn">
            <Leaf className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
