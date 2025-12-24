'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { FileText, AlertCircle, Mail, Phone } from 'lucide-react';

export default function TermsOfUsePage() {
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
          <h1>Terms of Use</h1>
          <p>Terms and Conditions for Using Our Services</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Terms of Use</span>
        </div>

        <div className="policy-content">
          <p className="text-muted mb-6">
            <FileText className="w-4 h-4 inline mr-2" />
            Last Updated: December 2024
          </p>

          <div className="info-box mb-8">
            <p className="text-gray-700">
              Welcome to ShaktiSewa. By accessing or using our website and services, you agree to be bound 
              by these Terms of Use. Please read them carefully before using our platform.
            </p>
          </div>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing, browsing, or using the ShaktiSewa website (www.shaktisewa.com) or any of our mobile 
            applications, you acknowledge that you have read, understood, and agree to be bound by these 
            Terms of Use and our Privacy Policy.
          </p>
          <p>
            If you do not agree with any part of these terms, you must not use our services.
          </p>

          <h2>2. Eligibility</h2>
          <p>To use our services, you must:</p>
          <ul>
            <li>Be at least 18 years of age</li>
            <li>Have the legal capacity to enter into binding contracts</li>
            <li>Not be prohibited from using the services under applicable laws</li>
            <li>Provide accurate and complete registration information</li>
          </ul>

          <h2>3. User Account</h2>
          <p>When creating an account, you agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain the security of your password and account</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Not share your account credentials with others</li>
          </ul>

          <h2>4. Product Information</h2>
          <ul>
            <li>We strive to display accurate product information, including descriptions, images, and prices</li>
            <li>Colors and images may vary slightly due to display settings</li>
            <li>We reserve the right to correct any errors in product information</li>
            <li>Prices are subject to change without prior notice</li>
            <li>Product availability is subject to stock and may vary</li>
          </ul>

          <h2>5. Orders and Payments</h2>
          <ul>
            <li>All orders are subject to product availability and acceptance</li>
            <li>We reserve the right to refuse or cancel orders at our discretion</li>
            <li>Prices displayed are inclusive of applicable taxes unless stated otherwise</li>
            <li>Payment must be made through approved payment methods</li>
            <li>We use secure payment processing through trusted third-party providers</li>
          </ul>

          <h2>6. Shipping and Delivery</h2>
          <p>
            Please refer to our <Link href="/shipping-delivery" className="text-green-600 hover:underline">Shipping & Delivery Policy</Link> for 
            complete information about delivery timelines, shipping charges, and related terms.
          </p>

          <h2>7. Returns and Refunds</h2>
          <p>
            Please refer to our <Link href="/return-policy" className="text-green-600 hover:underline">Return Policy</Link> for 
            complete information about returns, refunds, and replacements.
          </p>

          <h2>8. Intellectual Property</h2>
          <p>
            All content on this website, including but not limited to text, graphics, logos, images, 
            audio clips, digital downloads, and software, is the property of ShaktiSewa or its content 
            suppliers and is protected by intellectual property laws.
          </p>
          <ul>
            <li>You may not copy, reproduce, or distribute our content without permission</li>
            <li>Our trademarks and trade dress may not be used without our express written consent</li>
            <li>Any unauthorized use terminates the permission granted herein</li>
          </ul>

          <h2>9. Prohibited Activities</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use our services for any illegal or unauthorized purpose</li>
            <li>Violate any laws in your jurisdiction while using our services</li>
            <li>Transmit any viruses, malware, or malicious code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with the proper working of our website</li>
            <li>Engage in any activity that could harm our reputation</li>
            <li>Use automated tools to access our services without permission</li>
          </ul>

          <h2>10. Limitation of Liability</h2>
          <div className="info-box info-box-yellow mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <p className="text-gray-700">
                ShaktiSewa shall not be liable for any indirect, incidental, special, consequential, or 
                punitive damages arising out of your use of our services. Our total liability shall not 
                exceed the amount paid by you for the specific product or service in question.
              </p>
            </div>
          </div>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless ShaktiSewa, its officers, directors, employees, and 
            agents from any claims, damages, losses, liabilities, and expenses arising out of your use 
            of our services or violation of these terms.
          </p>

          <h2>12. Modifications</h2>
          <p>
            We reserve the right to modify these Terms of Use at any time. Changes will be effective 
            immediately upon posting on our website. Your continued use of our services after any 
            modifications indicates your acceptance of the updated terms.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms of Use shall be governed by and construed in accordance with the laws of India. 
            Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the 
            courts in New Delhi, India.
          </p>

          <h2>14. Contact Information</h2>
          <div className="info-box">
            <p className="text-gray-700 mb-4">
              For any questions regarding these Terms of Use, please contact us:
            </p>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                <a href="mailto:legal@shaktisewa.com" className="text-green-600 hover:underline">legal@shaktisewa.com</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                <span>*9243143997</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
