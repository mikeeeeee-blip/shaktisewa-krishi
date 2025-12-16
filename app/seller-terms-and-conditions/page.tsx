'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { FileText, AlertCircle, Mail, Phone, Store } from 'lucide-react';

export default function SellerTermsPage() {
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
          <h1>Seller Terms & Conditions</h1>
          <p>Guidelines for Selling on ShaktiSewa Platform</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Seller Terms & Conditions</span>
        </div>

        <div className="policy-content">
          <p className="text-muted mb-6">
            <FileText className="w-4 h-4 inline mr-2" />
            Last Updated: December 2024
          </p>

          <div className="info-box mb-8">
            <div className="flex items-start gap-3">
              <Store className="w-8 h-8 text-green-600 flex-shrink-0" />
              <p className="text-gray-700">
                These Seller Terms and Conditions govern your use of the ShaktiSewa platform as a seller. 
                By registering as a seller, you agree to comply with these terms and all applicable laws.
              </p>
            </div>
          </div>

          <h2>1. Seller Registration</h2>
          <p>To become a seller on ShaktiSewa, you must:</p>
          <ul>
            <li>Be a registered business entity or individual with valid PAN</li>
            <li>Possess a valid GST registration (where applicable)</li>
            <li>Provide accurate business information and documentation</li>
            <li>Maintain a valid bank account for payment settlements</li>
            <li>Comply with all local, state, and national regulations</li>
          </ul>

          <h2>2. Product Listings</h2>
          <p>As a seller, you agree to:</p>
          <ul>
            <li>List only genuine and authentic products</li>
            <li>Provide accurate product descriptions, images, and specifications</li>
            <li>Maintain updated inventory and pricing information</li>
            <li>Comply with all applicable product quality standards</li>
            <li>Not list prohibited or restricted items</li>
            <li>Ensure products have proper labeling as per regulations</li>
          </ul>

          <h2>3. Pricing and Commission</h2>
          <ul>
            <li>Sellers are responsible for setting competitive product prices</li>
            <li>ShaktiSewa charges a commission on each successful sale (5-10% based on category)</li>
            <li>Commission rates may be revised with prior notice</li>
            <li>Prices must include all applicable taxes</li>
            <li>Sellers must honor listed prices for confirmed orders</li>
          </ul>

          <h2>4. Order Fulfillment</h2>
          <p>Sellers must:</p>
          <ul>
            <li>Process orders within the specified timeframe (typically 1-2 business days)</li>
            <li>Package products securely to prevent damage during transit</li>
            <li>Provide accurate shipping information and tracking details</li>
            <li>Ensure timely delivery as per committed timelines</li>
            <li>Handle returns and refunds as per ShaktiSewa&apos;s policies</li>
          </ul>

          <h2>5. Quality Standards</h2>
          <div className="info-box info-box-yellow mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700 font-semibold mb-2">Important Quality Requirements:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• All products must meet advertised quality specifications</li>
                  <li>• Agricultural inputs must have valid batch numbers and expiry dates</li>
                  <li>• Seeds must meet minimum germination standards</li>
                  <li>• Pesticides and fertilizers must be properly licensed</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>6. Payment Settlement</h2>
          <ul>
            <li>Payments are settled on a weekly cycle (every 7 days)</li>
            <li>Settlement amount = Sale Price - Commission - Applicable Deductions</li>
            <li>Payments are credited to the registered bank account</li>
            <li>Tax deductions (TDS) apply as per applicable laws</li>
            <li>Detailed settlement reports are provided for each cycle</li>
          </ul>

          <h2>7. Customer Service</h2>
          <p>Sellers are expected to:</p>
          <ul>
            <li>Respond to customer queries within 24 hours</li>
            <li>Provide helpful and accurate product information</li>
            <li>Handle complaints professionally and promptly</li>
            <li>Cooperate with ShaktiSewa&apos;s customer service team</li>
            <li>Maintain a minimum customer satisfaction rating</li>
          </ul>

          <h2>8. Prohibited Activities</h2>
          <p>Sellers must not:</p>
          <ul>
            <li>List counterfeit, fake, or unauthorized products</li>
            <li>Engage in price manipulation or unfair practices</li>
            <li>Provide false or misleading product information</li>
            <li>Share customer data outside the platform</li>
            <li>Directly solicit customers outside ShaktiSewa</li>
            <li>Engage in any fraudulent activities</li>
          </ul>

          <h2>9. Account Suspension</h2>
          <p>
            ShaktiSewa reserves the right to suspend or terminate seller accounts for:
          </p>
          <ul>
            <li>Violation of these terms and conditions</li>
            <li>Consistent negative customer feedback</li>
            <li>Fraudulent or illegal activities</li>
            <li>Failure to meet quality or service standards</li>
            <li>Non-compliance with regulatory requirements</li>
          </ul>

          <h2>10. Liability</h2>
          <ul>
            <li>Sellers are fully responsible for their products and services</li>
            <li>ShaktiSewa is not liable for seller-customer disputes</li>
            <li>Sellers must maintain appropriate business insurance</li>
            <li>Sellers indemnify ShaktiSewa against any claims arising from their products</li>
          </ul>

          <h2>11. Modifications</h2>
          <p>
            ShaktiSewa may modify these terms with prior notice. Continued use of the platform 
            after modifications constitutes acceptance of the updated terms.
          </p>

          <h2>12. Contact Information</h2>
          <div className="info-box">
            <p className="text-gray-700 mb-4">
              For seller-related queries, please contact our seller support team:
            </p>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                <a href="mailto:sellers@shaktisewa.com" className="text-green-600 hover:underline">sellers@shaktisewa.com</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                <span>7065060162 / 7428208822</span>
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="cta-banner mt-8">
            <h3>Ready to Start Selling?</h3>
            <p>Join thousands of sellers on ShaktiSewa and grow your business!</p>

            <a href="/sell-on-eclat-agroxglobal" className="cta-banner-btn text-white hover:text-white">
            <Store className="w-5 h-5 text-white" />
              Register as a Seller
            </a>
            
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
