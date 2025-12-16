'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { BookOpen, Calendar, User, ArrowRight, Search } from 'lucide-react';

export default function EclatAgroxglobalBlogPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const blogPosts = [
    {
      title: "Essential Tips for Successful Vegetable Gardening",
      excerpt: "Learn the fundamentals of vegetable gardening including soil preparation, seed selection, watering techniques, and pest management for a bountiful harvest.",
      category: "Gardening",
      author: "ECLAT Team",
      date: "Dec 5, 2024",
      image: "🌱"
    },
    {
      title: "Understanding Organic Fertilizers: A Complete Guide",
      excerpt: "Discover the benefits of organic fertilizers, types available in the market, and how to choose the right one for your crops and soil type.",
      category: "Fertilizers",
      author: "Dr. Ramesh Kumar",
      date: "Dec 3, 2024",
      image: "🌿"
    },
    {
      title: "Modern Irrigation Techniques for Indian Farmers",
      excerpt: "Explore drip irrigation, sprinkler systems, and smart irrigation technologies that can help conserve water and improve crop yields.",
      category: "Irrigation",
      author: "ECLAT Team",
      date: "Nov 28, 2024",
      image: "💧"
    },
    {
      title: "Pest Management: Protecting Your Crops Naturally",
      excerpt: "Learn about integrated pest management (IPM) strategies, organic pesticides, and natural methods to protect your crops from harmful insects.",
      category: "Crop Protection",
      author: "Priya Sharma",
      date: "Nov 25, 2024",
      image: "🐛"
    },
    {
      title: "Choosing the Right Seeds for Rabi Season",
      excerpt: "A comprehensive guide to selecting high-quality seeds for wheat, mustard, chickpea, and other rabi crops for maximum yield.",
      category: "Seeds",
      author: "ECLAT Team",
      date: "Nov 20, 2024",
      image: "🌾"
    },
    {
      title: "Farm Equipment Maintenance: Tips for Longevity",
      excerpt: "Keep your agricultural equipment running smoothly with these essential maintenance tips and best practices.",
      category: "Equipment",
      author: "Tech Team",
      date: "Nov 15, 2024",
      image: "🔧"
    }
  ];

  const categories = ["All", "Gardening", "Fertilizers", "Seeds", "Irrigation", "Crop Protection", "Equipment"];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>KRISHANSHECLAT AGROXGLOBAL Blog</h1>
          <p>Agricultural Insights, Tips & Expert Advice</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Blog</span>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  index === 0 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="inline-block bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                Featured
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                The Future of Sustainable Farming in India
              </h2>
              <p className="text-gray-600 mb-4">
                Explore how modern sustainable farming practices are transforming Indian agriculture, 
                improving yields, and protecting the environment for future generations.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> ECLAT Team</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Dec 8, 2024</span>
              </div>
              <button className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Read Article <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-9xl">🌾</div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {blogPosts.map((post, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <span className="text-6xl">{post.image}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 cursor-pointer">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="cta-banner">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <h3>Subscribe to Our Newsletter</h3>
          <p>Get the latest agricultural tips, news, and offers directly in your inbox!</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-6">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500"
            />
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
