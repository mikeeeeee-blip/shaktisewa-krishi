'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { MessageSquare, Users, ThumbsUp, MessageCircle, Search, TrendingUp, Star, Clock } from 'lucide-react';

export default function EclatTalkPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const discussions = [
    {
      title: "Best organic fertilizer for tomato plants?",
      author: "Rajesh Kumar",
      replies: 24,
      likes: 45,
      category: "Fertilizers",
      time: "2 hours ago"
    },
    {
      title: "How to control aphids naturally in my vegetable garden",
      author: "Priya Sharma",
      replies: 18,
      likes: 32,
      category: "Pest Control",
      time: "5 hours ago"
    },
    {
      title: "Drip irrigation setup cost and benefits",
      author: "Mohammed Ali",
      replies: 31,
      likes: 67,
      category: "Irrigation",
      time: "1 day ago"
    },
    {
      title: "Which hybrid seeds are best for summer vegetables?",
      author: "Sunita Devi",
      replies: 42,
      likes: 89,
      category: "Seeds",
      time: "2 days ago"
    },
    {
      title: "Soil testing - how important is it?",
      author: "Amit Patel",
      replies: 15,
      likes: 28,
      category: "Soil Health",
      time: "3 days ago"
    }
  ];

  const experts = [
    { name: "Dr. Ramesh Kumar", specialty: "Crop Science", answers: 156 },
    { name: "Priya Sharma", specialty: "Organic Farming", answers: 134 },
    { name: "Tech Team", specialty: "Farm Equipment", answers: 98 }
  ];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>KRISHANSHECLAT Talk</h1>
          <p>Connect, Discuss & Learn from Fellow Farmers</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>KRISHANSHECLAT Talk</span>
        </div>

        {/* Stats */}
        <div className="stats-grid mb-8">
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Active Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5K+</div>
            <div className="stat-label">Discussions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Expert Advisors</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Free to Join</div>
          </div>
        </div>

        {/* Search and Ask */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search discussions..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Ask a Question
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Discussions List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Trending Discussions
            </h2>
            <div className="space-y-4">
              {discussions.map((discussion, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="inline-block text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full mb-2">
                        {discussion.category}
                      </span>
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-green-600">
                        {discussion.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {discussion.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" /> {discussion.replies} replies
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" /> {discussion.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {discussion.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-6 py-3 border border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              View All Discussions
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Experts */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Top Experts
              </h3>
              <div className="space-y-4">
                {experts.map((expert, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{expert.name}</p>
                      <p className="text-xs text-gray-500">{expert.specialty}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">{expert.answers} answers</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">Popular Categories</h3>
              <div className="flex flex-wrap gap-2">
                {["Seeds", "Fertilizers", "Pest Control", "Irrigation", "Soil Health", "Equipment", "Organic Farming", "Market Prices"].map((cat, index) => (
                  <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-green-100 hover:text-green-700 cursor-pointer transition-colors">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Join CTA */}
            <div className="info-box">
              <h3 className="font-bold text-gray-900 mb-2">Join the Community!</h3>
              <p className="text-gray-600 text-sm mb-4">
                Connect with thousands of farmers and agricultural experts. Ask questions, share knowledge, and grow together.
              </p>
              <button className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Join Now - It&apos;s Free!
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
