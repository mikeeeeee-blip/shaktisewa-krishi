'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react';

export default function ShippingDeliveryPage() {
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
          <h1>Shipping & Delivery</h1>
          <p>Fast, Free Delivery Across India</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Shipping & Delivery</span>
        </div>

        {/* Highlight Box */}
        <div className="highlight-box mb-8">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-yellow-700" />
            <div>
              <h3>Free Shipping on All Orders!</h3>
              <p>We offer free delivery across India with no minimum order value required.</p>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="feature-card text-center">
            <Truck className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Free Shipping</h3>
            <p className="text-gray-600 text-sm">All India Delivery</p>
          </div>
          <div className="feature-card text-center">
            <Clock className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">5-7 Days</h3>
            <p className="text-gray-600 text-sm">Standard Delivery</p>
          </div>
          <div className="feature-card text-center">
            <Package className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Secure Packaging</h3>
            <p className="text-gray-600 text-sm">Safe Handling</p>
          </div>
          <div className="feature-card text-center">
            <MapPin className="w-10 h-10 text-orange-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">500+ Cities</h3>
            <p className="text-gray-600 text-sm">Pan India Coverage</p>
          </div>
        </div>

        <div className="policy-content">
          <h2>Delivery Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="info-box">
              <h4 className="font-semibold text-gray-900 mb-2">Standard Delivery</h4>
              <p className="text-gray-600">5-7 business days for most locations across India</p>
            </div>
            <div className="info-box info-box-blue">
              <h4 className="font-semibold text-gray-900 mb-2">Express Delivery</h4>
              <p className="text-gray-600">2-3 business days (available in select metro cities)</p>
            </div>
          </div>
          <ul>
            <li>Delivery times may vary based on your location and product availability</li>
            <li>Remote areas may require additional 2-3 days for delivery</li>
            <li>Orders placed on weekends/holidays will be processed on the next business day</li>
            <li>You will receive tracking information once your order ships</li>
          </ul>

          <h2>Order Processing</h2>
          <div className="process-steps mb-6">
            <div className="process-step">
              <div className="process-step-number">1</div>
              <h3>Order Placed</h3>
              <p>Confirmation email sent immediately</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">2</div>
              <h3>Processing</h3>
              <p>1-2 business days for verification</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">3</div>
              <h3>Shipped</h3>
              <p>Tracking details shared via SMS/email</p>
            </div>
            <div className="process-step">
              <div className="process-step-number">4</div>
              <h3>Delivered</h3>
              <p>Safe delivery to your doorstep</p>
            </div>
          </div>

          <h2>Shipping Charges</h2>
          <div className="info-box mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 font-semibold">All orders qualify for FREE shipping!</p>
                <p className="text-gray-600 mt-1">
                  We do not charge any shipping fees regardless of order value. Your order total 
                  is the final amount you pay - no hidden charges.
                </p>
              </div>
            </div>
          </div>

          <h2>Delivery Areas</h2>
          <p>We deliver to all major cities and towns across India, including:</p>
          <div className="benefits-list mb-6">
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">All metro cities: Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad</span>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Tier 2 & Tier 3 cities across all states</span>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Rural areas (delivery time may be extended)</span>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <span className="benefit-text">Remote locations with PIN code coverage</span>
            </div>
          </div>

          <h2>Tracking Your Order</h2>
          <p>Once your order is shipped, you will receive:</p>
          <ul>
            <li>SMS notification with tracking number and courier details</li>
            <li>Email with tracking link and estimated delivery date</li>
            <li>Real-time tracking available on our website using your order ID</li>
            <li>Delivery confirmation notification upon successful delivery</li>
          </ul>

          <h2>Important Notes</h2>
          <div className="info-box info-box-yellow mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <ul className="space-y-2 text-gray-700">
                <li>Please ensure someone is available to receive the package at the delivery address</li>
                <li>Verify product condition before accepting delivery from the courier</li>
                <li>For bulky items, delivery may be limited to ground floor/entrance</li>
                <li>COD orders require payment at the time of delivery</li>
              </ul>
            </div>
          </div>

          <h2>Delivery Issues</h2>
          <p>If you face any delivery issues:</p>
          <ul>
            <li>Contact our customer support team immediately</li>
            <li>Report damaged packages at the time of delivery</li>
            <li>For non-delivery, we will investigate and resolve within 48 hours</li>
            <li>Refunds/replacements will be processed as per our Return Policy</li>
          </ul>

          <h2>Contact Us</h2>
          <div className="info-box">
            <p className="text-gray-700 mb-4">
              For shipping and delivery queries, reach out to our support team:
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
