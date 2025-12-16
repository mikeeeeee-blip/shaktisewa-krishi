'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Headphones } from 'lucide-react';

export default function ContactUsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>Contact Us</h1>
          <p>We&apos;re Here to Help You Succeed in Agriculture</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Contact Us</span>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="feature-card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
            <p className="text-gray-600 text-sm mb-2">Mon-Sat, 9AM-6PM</p>
            <a href="tel:7065060162" className="text-green-600 font-semibold hover:underline">7065060162</a>
            <br />
            <a href="tel:7428208822" className="text-green-600 font-semibold hover:underline">7428208822</a>
          </div>
          
          <div className="feature-card text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
            <p className="text-gray-600 text-sm mb-2">We reply within 24 hours</p>
            <a href="mailto:support@eclatagro.com" className="text-green-600 font-semibold hover:underline">support@eclatagro.com</a>
            <br />
            <a href="mailto:info@eclatagro.com" className="text-green-600 font-semibold hover:underline">info@eclatagro.com</a>
          </div>
          
          <div className="feature-card text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
            <p className="text-gray-600 text-sm mb-2">Quick responses</p>
            <a href="https://wa.me/917065060162" className="text-green-600 font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
              Chat with us
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Send className="w-6 h-6 text-green-600" />
              Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your phone"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="order">Order Inquiry</option>
                    <option value="product">Product Information</option>
                    <option value="shipping">Shipping & Delivery</option>
                    <option value="return">Returns & Refunds</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="How can we help you?"
                  required
                ></textarea>
              </div>
              
              <button type="submit" className="form-button w-full flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>
          
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Headphones className="w-6 h-6 text-green-600" />
              Get in Touch
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="contact-info-card bg-gray-50 rounded-lg p-4">
                <div className="contact-icon-wrapper">
                  <Phone className="contact-icon" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone Numbers</h3>
                  <p className="text-gray-600">7065060162</p>
                  <p className="text-gray-600">7428208822</p>
                </div>
              </div>
              
              <div className="contact-info-card bg-gray-50 rounded-lg p-4">
                <div className="contact-icon-wrapper">
                  <Mail className="contact-icon" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email Addresses</h3>
                  <p className="text-gray-600">support@eclatagro.com</p>
                  <p className="text-gray-600">info@eclatagro.com</p>
                </div>
              </div>
              
              <div className="contact-info-card bg-gray-50 rounded-lg p-4">
                <div className="contact-icon-wrapper">
                  <MapPin className="contact-icon" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Office Address</h3>
                  <p className="text-gray-600">
                    KRISHANSHECLAT AGROXGLOBAL Pvt. Ltd.<br />
                    Sector 62, Noida<br />
                    Uttar Pradesh - 201301<br />
                    India
                  </p>
                </div>
              </div>
              
              <div className="contact-info-card bg-gray-50 rounded-lg p-4">
                <div className="contact-icon-wrapper">
                  <Clock className="contact-icon" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Business Hours</h3>
                  <p className="text-gray-600">Monday - Saturday: 9:00 AM - 6:00 PM</p>
                  <p className="text-gray-600">Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="map-container bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Interactive map coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Support Info */}
        <div className="info-box">
          <h3 className="font-semibold text-gray-900 mb-2">Need Immediate Assistance?</h3>
          <p className="text-gray-600 mb-4">
            Our customer support team is available Monday through Saturday, 9 AM to 6 PM IST. 
            For urgent queries, please call us directly or send us a WhatsApp message for quick responses.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="tel:7065060162" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline">
              <Phone className="w-4 h-4" /> Call Now
            </a>
            <a href="https://wa.me/917065060162" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href="mailto:support@eclatagro.com" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline">
              <Mail className="w-4 h-4" /> Email Us
            </a>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
