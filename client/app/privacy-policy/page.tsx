'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Shield, Eye, Lock, Bell, Mail, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <h1>Privacy Policy</h1>
          <p>Your Privacy is Important to Us</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Privacy Policy</span>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="feature-card text-center">
            <Shield className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Data Protection</h3>
            <p className="text-gray-600 text-sm">Your data is secure with us</p>
          </div>
          <div className="feature-card text-center">
            <Lock className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Encrypted Transactions</h3>
            <p className="text-gray-600 text-sm">SSL secured payments</p>
          </div>
          <div className="feature-card text-center">
            <Eye className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Transparency</h3>
            <p className="text-gray-600 text-sm">Clear data practices</p>
          </div>
        </div>

        <div className="policy-content">
          <p className="text-muted mb-6">
            <FileText className="w-4 h-4 inline mr-2" />
            Last Updated: December 2024
          </p>

          <div className="info-box mb-8">
            <p className="text-gray-700">
              At KRISHANSHECLAT AGROXGLOBAL, we are committed to protecting your privacy and ensuring the security of your 
              personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you visit our website and use our services.
            </p>
          </div>

          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li><strong>Personal Information:</strong> Name, email address, phone number, and shipping address when you create an account or place an order</li>
            <li><strong>Payment Information:</strong> Credit/debit card details, UPI ID (processed securely through third-party payment processors)</li>
            <li><strong>Order Information:</strong> Purchase history, order preferences, and transaction details</li>
            <li><strong>Communication Data:</strong> Messages, feedback, and communications with our customer support team</li>
            <li><strong>Device Information:</strong> IP address, browser type, device identifiers, and usage data collected automatically</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>Process and fulfill your orders, including shipping and delivery</li>
            <li>Send order confirmations, shipping updates, and delivery notifications</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Send promotional communications and marketing materials (with your consent)</li>
            <li>Improve our website, products, and services</li>
            <li>Personalize your shopping experience with relevant recommendations</li>
            <li>Detect and prevent fraudulent transactions</li>
            <li>Comply with legal obligations and protect our rights</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>We may share your information with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Payment processors, shipping partners, and IT service providers who assist in our operations</li>
            <li><strong>Business Partners:</strong> Sellers and vendors on our platform to fulfill your orders</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our legal rights</li>
            <li><strong>Business Transfers:</strong> In connection with any merger, acquisition, or sale of company assets</li>
          </ul>
          <p>We do not sell your personal information to third parties for marketing purposes.</p>

          <h2>4. Data Security</h2>
          <div className="info-box info-box-blue">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700">
                  We implement industry-standard security measures to protect your personal information, including:
                </p>
                <ul className="mt-2 space-y-1">
                  <li>• SSL/TLS encryption for all data transmissions</li>
                  <li>• Secure payment processing through PCI-DSS compliant providers</li>
                  <li>• Regular security audits and vulnerability assessments</li>
                  <li>• Access controls and authentication mechanisms</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>5. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your browsing experience, 
            analyze website traffic, and understand user preferences. You can manage cookie preferences 
            through your browser settings.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and receive a copy of your personal data</li>
            <li>Request correction of inaccurate personal information</li>
            <li>Request deletion of your personal data (subject to legal requirements)</li>
            <li>Opt-out of marketing communications at any time</li>
            <li>Withdraw consent for data processing where applicable</li>
          </ul>

          <h2>7. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined 
            in this policy, unless a longer retention period is required by law. Order and transaction 
            data is typically retained for 7 years for compliance purposes.
          </p>

          <h2>8. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy 
            practices of these external sites. We encourage you to read the privacy policies of any 
            third-party sites you visit.
          </p>

          <h2>9. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect 
            personal information from children. If we become aware that we have collected data from a 
            child, we will take steps to delete such information.
          </p>

          <h2>10. Updates to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new policy on this page and updating the &ldquo;Last Updated&rdquo; date. 
            We encourage you to review this policy periodically.
          </p>

          <h2>11. Contact Us</h2>
          <div className="info-box">
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                <a href="mailto:privacy@eclatagro.com" className="text-green-600 hover:underline">privacy@eclatagro.com</a>
              </p>
              <p className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                <span>Phone: 7065060162</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
