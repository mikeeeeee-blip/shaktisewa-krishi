'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Gift, Users, Share2, Wallet, CheckCircle, Copy, Mail, MessageCircle } from 'lucide-react';

export default function HowReferralWorksPage() {
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
          <h1>Refer & Earn</h1>
          <p>Share KRISHANSHECLAT AGROXGLOBAL & Earn Rewards!</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>How Referral Works</span>
        </div>

        {/* Highlight Box */}
        <div className="highlight-box mb-8">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <Gift className="w-16 h-16 text-yellow-700" />
            <div>
              <h3>Earn ₹100 for Every Successful Referral!</h3>
              <p>Invite your friends to shop on KRISHANSHECLAT AGROXGLOBAL and earn rewards when they make their first purchase.</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          How Does It Work?
        </h2>
        <div className="process-steps mb-12">
          <div className="process-step">
            <div className="process-step-number">1</div>
            <h3>Share Your Link</h3>
            <p>Get your unique referral link from your account dashboard</p>
          </div>
          <div className="process-step">
            <div className="process-step-number">2</div>
            <h3>Friend Signs Up</h3>
            <p>Your friend creates an account using your link</p>
          </div>
          <div className="process-step">
            <div className="process-step-number">3</div>
            <h3>They Shop</h3>
            <p>They make their first purchase of ₹500 or more</p>
          </div>
          <div className="process-step">
            <div className="process-step-number">4</div>
            <h3>You Earn!</h3>
            <p>₹100 credited to your wallet automatically</p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="feature-card text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">₹100 Per Referral</h3>
            <p className="text-gray-600 text-sm">
              Earn ₹100 in your wallet for every successful referral
            </p>
          </div>
          <div className="feature-card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Friend Gets ₹50</h3>
            <p className="text-gray-600 text-sm">
              Your friend also gets ₹50 discount on their first order
            </p>
          </div>
          <div className="feature-card text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Unlimited Referrals</h3>
            <p className="text-gray-600 text-sm">
              No limit on how many friends you can refer
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Program Details</h2>
            <div className="benefits-list">
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">Referral reward: ₹100 per successful referral</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">Friend&apos;s discount: ₹50 off on first order</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">Minimum order value: ₹500 for reward activation</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">Reward credited within 24 hours of order delivery</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span className="benefit-text">Wallet balance can be used for future purchases</span>
              </div>
            </div>
          </div>
          
          <div className="info-box">
            <Share2 className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share Your Referral Link</h3>
            <p className="text-gray-600 mb-4">
              Login to your account to get your unique referral link and start earning rewards!
            </p>
            <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2 mb-4">
              <input
                type="text"
                value="https://agribegri.com/ref/YOUR_CODE"
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-600"
              />
              <button className="p-2 text-green-600 hover:bg-green-100 rounded">
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                <Mail className="w-4 h-4" /> Email
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-banner">
          <Gift className="w-12 h-12 mx-auto mb-4" />
          <h3>Start Referring Today!</h3>
          <p>Share the love of farming with your friends and earn rewards together.</p>
          <Link href="/customer-login" className="cta-banner-btn">
            <Users className="w-5 h-5" />
            Login to Get Your Link
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
