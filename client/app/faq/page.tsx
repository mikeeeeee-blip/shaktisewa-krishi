'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { HelpCircle, ChevronDown, ChevronUp, Search, Phone, Mail, MessageCircle } from 'lucide-react';

export default function FAQPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const faqs = [
    {
      category: "Orders & Shipping",
      questions: [
        {
          question: 'How do I place an order?',
          answer: 'You can browse our products, add them to your cart, and proceed to checkout. You will need to create an account or log in to complete your purchase. Follow the simple steps to enter your shipping address and payment details to place your order.',
        },
        {
          question: 'Do you offer free shipping?',
          answer: 'Yes, we offer free shipping on all orders across India. There is no minimum order value required to avail free shipping. Your order will be delivered to your doorstep at no extra cost.',
        },
        {
          question: 'How long does delivery take?',
          answer: 'Standard delivery takes 5-7 business days for most locations. Express delivery (2-3 business days) is available in select metro cities. Delivery times may vary for remote areas.',
        },
        {
          question: 'How can I track my order?',
          answer: 'Once your order is shipped, you will receive an SMS and email with the tracking number and courier details. You can also track your order by logging into your account and visiting the "My Orders" section.',
        },
      ]
    },
    {
      category: "Payments",
      questions: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, Rupay), debit cards, UPI (Google Pay, PhonePe, Paytm), net banking, and cash on delivery (COD) for eligible orders.',
        },
        {
          question: 'Is Cash on Delivery (COD) available?',
          answer: 'Yes, COD is available for most orders. However, COD may not be available for certain products or locations. You can check COD availability during checkout.',
        },
        {
          question: 'Is it safe to pay online on your website?',
          answer: 'Absolutely! We use SSL encryption and partner with trusted payment gateways to ensure 100% secure transactions. Your payment information is never stored on our servers.',
        },
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          question: 'Can I cancel my order?',
          answer: 'Yes, you can cancel your order before it ships. Go to "My Orders" in your account and click "Cancel Order". Once shipped, you can refuse delivery or return the product as per our Return Policy.',
        },
        {
          question: 'What is your return policy?',
          answer: 'We offer easy returns and replacements within 7 days of delivery. Products must be unused and in original packaging. Some items like perishables are non-returnable. Visit our Return Policy page for complete details.',
        },
        {
          question: 'How long does refund processing take?',
          answer: 'Refunds are typically processed within 5-7 business days after we receive the returned product. The amount will be credited to your original payment method. For COD orders, refunds are transferred to your bank account.',
        },
      ]
    },
    {
      category: "Products",
      questions: [
        {
          question: 'Are your products genuine?',
          answer: 'Yes, all our products are 100% genuine and sourced directly from authorized suppliers and manufacturers. We guarantee the quality and authenticity of every product we sell.',
        },
        {
          question: 'What if I receive a damaged product?',
          answer: 'If you receive a damaged product, please contact us immediately with photos of the damage. We will arrange for a free replacement or full refund as per your preference.',
        },
        {
          question: 'Do you provide product recommendations?',
          answer: 'Yes! Our team of agricultural experts is available to help you choose the right products for your needs. You can contact us via phone, email, or WhatsApp for personalized recommendations.',
        },
      ]
    },
    {
      category: "Account",
      questions: [
        {
          question: 'How do I create an account?',
          answer: 'Click on the "Login" button on the top right corner and select "Create Account". Enter your email, phone number, and create a password. You can also sign up using your Google or Facebook account.',
        },
        {
          question: 'Do you provide customer support?',
          answer: 'Yes, our customer support team is available Monday through Saturday, 9 AM to 6 PM IST. You can reach us via phone (7065060162), email (support@eclatagro.com), or WhatsApp for quick assistance.',
        },
      ]
    },
  ];

  const allQuestions = faqs.flatMap(category => category.questions);
  const filteredQuestions = searchQuery 
    ? allQuestions.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>Frequently Asked Questions</h1>
          <p>Find Answers to Common Questions</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>FAQ</span>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-lg"
            />
          </div>
        </div>

        {/* Search Results */}
        {filteredQuestions ? (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Search Results ({filteredQuestions.length})
            </h2>
            {filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <h3 className="faq-question">{faq.question}</h3>
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-sm mt-2">Try different keywords or browse categories below</p>
              </div>
            )}
          </div>
        ) : (
          /* FAQ Categories */
          <div className="space-y-8 mb-12">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-green-600" />
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, index) => {
                    const globalIndex = categoryIndex * 100 + index;
                    const isOpen = openIndex === globalIndex;
                    return (
                      <div 
                        key={index} 
                        className={`border rounded-lg overflow-hidden transition-all ${isOpen ? 'border-green-500 shadow-md' : 'border-gray-200'}`}
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-0 bg-gray-50 border-t">
                            <p className="text-gray-600 leading-relaxed pt-3">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still Have Questions */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center">
          <HelpCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Still Have Questions?</h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:7065060162" className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-shadow">
              <Phone className="w-5 h-5" /> Call Us
            </a>
            <a href="mailto:support@eclatagro.com" className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-shadow">
              <Mail className="w-5 h-5" /> Email Us
            </a>
            <a href="https://wa.me/917065060162" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              <MessageCircle className="w-5 h-5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
