'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { RotateCcw, Package, Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail } from 'lucide-react';

export default function ReturnPolicyPage() {
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
          <h1>Return Policy</h1>
          <p>Easy Returns & Hassle-Free Replacements</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Return Policy</span>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="feature-card text-center">
            <RotateCcw className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">7 Days Return</h3>
            <p className="text-gray-600 text-sm">Easy return window</p>
          </div>
          <div className="feature-card text-center">
            <Package className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Free Pickup</h3>
            <p className="text-gray-600 text-sm">We collect from you</p>
          </div>
          <div className="feature-card text-center">
            <Clock className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Quick Refunds</h3>
            <p className="text-gray-600 text-sm">5-7 business days</p>
          </div>
        </div>

        {/* Highlight Box */}
        <div className="highlight-box mb-8">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-yellow-700" />
            <div>
              <h3>100% Hassle-Free Returns!</h3>
              <p>We stand behind our products. If you&apos;re not satisfied, we&apos;ll make it right.</p>
            </div>
          </div>
        </div>

        <div className="policy-content">
          <h2>Return Eligibility</h2>
          <p>You can return products under the following conditions:</p>
          <div className="benefits-list mb-6">
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Product is defective, damaged, or not working as expected</span>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Product received is different from what was ordered</span>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Product is unused and in its original packaging</span>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Return request is made within 7 days of delivery</span>
            </div>
          </div>

          <h2>How to Return a Product</h2>
          <div className="process-steps mb-6">
            <div className="process-step">
              <div className="process-step-number">1</div>
              <h3>Login</h3>
              <p>Go to My Orders section</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">2</div>
              <h3>Select Order</h3>
              <p>Choose the item to return</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">3</div>
              <h3>Request Return</h3>
              <p>Select reason for return</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">4</div>
              <h3>Pickup/Ship</h3>
              <p>We arrange pickup or you ship</p>
            </div>
          </div>

          <h2>Return Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="info-box">
              <h4 className="font-semibold text-gray-900 mb-2">Return Request</h4>
              <p className="text-gray-600">Within 7 days of delivery</p>
            </div>
            <div className="info-box info-box-blue">
              <h4 className="font-semibold text-gray-900 mb-2">Product Return</h4>
              <p className="text-gray-600">Within 7 days of approval</p>
            </div>
            <div className="info-box">
              <h4 className="font-semibold text-gray-900 mb-2">Refund Processing</h4>
              <p className="text-gray-600">5-7 business days after receipt</p>
            </div>
          </div>

          <h2>Non-Returnable Items</h2>
          <div className="info-box info-box-yellow mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 font-semibold mb-2">The following items cannot be returned:</p>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Perishable items (seeds past expiry, live plants)</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Items damaged due to misuse or improper storage</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Items without original packaging or tags</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Customized or personalized products</li>
                  <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Items marked as non-returnable on product page</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Refund Information</h2>
          <ul>
            <li>Refunds are processed to the original payment method</li>
            <li>For COD orders, refund will be credited to your bank account</li>
            <li>Refund amount will be credited within 5-7 business days</li>
            <li>You will receive an email confirmation once refund is processed</li>
          </ul>

          <h2>Replacement Policy</h2>
          <p>
            Instead of a refund, you can opt for a replacement if:
          </p>
          <ul>
            <li>The same product is available in stock</li>
            <li>The original product was defective or damaged</li>
            <li>You received a wrong product</li>
          </ul>

          <h2>Contact Us</h2>
          <div className="info-box">
            <p className="text-gray-700 mb-4">
              Need help with returns? Our customer support team is here to assist you:
            </p>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                <a href="mailto:support@eclatagro.com" className="text-green-600 hover:underline">support@eclatagro.com</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                <span>7065060162 / 7428208822</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
