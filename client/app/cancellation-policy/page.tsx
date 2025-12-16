'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Clock, CheckCircle, AlertCircle, Phone, Mail, CreditCard } from 'lucide-react';

export default function CancellationPolicyPage() {
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
          <h1>Cancellation Policy</h1>
          <p>Flexible Cancellation Options for Your Convenience</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Cancellation Policy</span>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="feature-card text-center">
            <Clock className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">24 Hour Window</h3>
            <p className="text-gray-600 text-sm">Cancel before shipping</p>
          </div>
          <div className="feature-card text-center">
            <CreditCard className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Full Refund</h3>
            <p className="text-gray-600 text-sm">No cancellation charges</p>
          </div>
          <div className="feature-card text-center">
            <CheckCircle className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Easy Process</h3>
            <p className="text-gray-600 text-sm">Cancel in few clicks</p>
          </div>
        </div>

        <div className="policy-content">
          <div className="info-box mb-8">
            <p className="text-gray-700">
              We understand that plans can change. You can cancel your order before it is shipped 
              and receive a full refund. Here&apos;s everything you need to know about our cancellation policy.
            </p>
          </div>

          <h2>Order Cancellation Rules</h2>
          <div className="benefits-list mb-6">
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Orders can be cancelled within 24 hours of placing the order</span>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Cancellation is free - no charges applied</span>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Full refund is processed to original payment method</span>
            </div>
            <div className="benefit-item">
              <AlertCircle className="benefit-icon text-yellow-600" />
              <span className="benefit-text">Orders already shipped cannot be cancelled</span>
            </div>
          </div>

          <h2>How to Cancel Your Order</h2>
          <div className="process-steps mb-6">
            <div className="process-step">
              <div className="process-step-number">1</div>
              <h3>Login</h3>
              <p>Access your account</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">2</div>
              <h3>My Orders</h3>
              <p>Find your order</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">3</div>
              <h3>Cancel</h3>
              <p>Click Cancel Order</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">4</div>
              <h3>Confirmation</h3>
              <p>Receive email confirmation</p>
            </div>
          </div>

          <h2>Cancellation Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="info-box">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" /> Before Processing
              </h4>
              <p className="text-gray-600">
                If your order hasn&apos;t been processed yet, you can cancel it instantly and 
                receive a full refund within 5-7 business days.
              </p>
            </div>
            <div className="info-box info-box-yellow">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" /> After Shipping
              </h4>
              <p className="text-gray-600">
                Once your order has been shipped, cancellation is not possible. You can 
                refuse delivery or return the product as per our Return Policy.
              </p>
            </div>
          </div>

          <h2>Refund Process</h2>
          <ul>
            <li><strong>Credit/Debit Card:</strong> Refund credited within 5-7 business days</li>
            <li><strong>UPI/Net Banking:</strong> Refund processed within 3-5 business days</li>
            <li><strong>Wallet:</strong> Instant credit to your wallet</li>
            <li><strong>COD Orders:</strong> No refund needed as payment wasn&apos;t made</li>
          </ul>

          <h2>Partial Cancellation</h2>
          <p>
            If you&apos;ve ordered multiple items, you can cancel individual items from your order 
            as long as they haven&apos;t been shipped yet. The refund will be processed for the 
            cancelled items only.
          </p>

          <h2>Order Modified or Shipped?</h2>
          <div className="info-box info-box-blue mb-6">
            <p className="text-gray-700">
              If your order has already been shipped and you wish to cancel:
            </p>
            <ul className="mt-2 space-y-1">
              <li>• You can refuse delivery when the courier arrives</li>
              <li>• The product will be returned to us automatically</li>
              <li>• Refund will be processed once we receive the returned item</li>
              <li>• Alternatively, accept delivery and initiate a return</li>
            </ul>
          </div>

          <h2>Contact Us</h2>
          <div className="info-box">
            <p className="text-gray-700 mb-4">
              Need help cancelling an order? Contact our support team:
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
