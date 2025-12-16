'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Users, TrendingUp, Heart, MapPin, Clock, Building, Coffee, Zap, Award, ChevronRight, Mail } from 'lucide-react';

export default function CareersPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const jobOpenings = [
    {
      title: "Software Engineer",
      department: "Technology",
      location: "Madhya Pradesh, India",
      type: "Full-time",
      description: "Join our tech team to build and scale our e-commerce platform serving millions of farmers across India."
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Madhya Pradesh, India",
      type: "Full-time",
      description: "Lead product development initiatives and work closely with engineering teams to deliver innovative solutions."
    },
    {
      title: "Customer Support Executive",
      department: "Operations",
      location: "Remote",
      type: "Full-time",
      description: "Help our customers with their queries and ensure an excellent shopping experience."
    },
    {
      title: "Digital Marketing Specialist",
      department: "Marketing",
      location: "Madhya Pradesh, India",
      type: "Full-time",
      description: "Drive digital marketing campaigns and grow our online presence across various channels."
    },
    {
      title: "Agricultural Expert",
      department: "Content",
      location: "Remote",
      type: "Part-time",
      description: "Create agricultural content, answer farmer queries, and provide expert product recommendations."
    },
    {
      title: "Warehouse Operations Manager",
      department: "Logistics",
      location: "Multiple Locations",
      type: "Full-time",
      description: "Manage warehouse operations and ensure efficient order fulfillment across our distribution network."
    }
  ];

  const benefits = [
    { icon: Coffee, title: "Flexible Work", description: "Work from anywhere with flexible timing options" },
    { icon: TrendingUp, title: "Growth Opportunities", description: "Fast-track career growth and learning opportunities" },
    { icon: Heart, title: "Health Benefits", description: "Comprehensive health insurance for you and family" },
    { icon: Award, title: "Performance Bonus", description: "Attractive bonuses based on performance" },
    { icon: Users, title: "Great Team", description: "Work with passionate and talented colleagues" },
    { icon: Zap, title: "Impactful Work", description: "Make a difference in Indian agriculture" }
  ];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>Join Our Team</h1>
          <p>Build Your Career While Transforming Indian Agriculture</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Careers</span>
        </div>

        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Grow With Us
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            At KRISHANSHECLAT AGROXGLOBAL, we&apos;re on a mission to revolutionize agriculture in India. Join our team of 
            passionate individuals working to empower millions of farmers with technology and innovation.
          </p>
        </div>

        {/* Why Work With Us */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Work at KRISHANSHECLAT AGROXGLOBAL?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <benefit.icon className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid mb-12">
          <div className="stat-card">
            <div className="stat-number">100+</div>
            <div className="stat-label">Team Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5</div>
            <div className="stat-label">Office Locations</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">8+</div>
            <div className="stat-label">Years in Business</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">4.5★</div>
            <div className="stat-label">Employee Rating</div>
          </div>
        </div>

        {/* Current Openings */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Current Openings</h2>
        <div className="mb-12">
          {jobOpenings.map((job, index) => (
            <div key={index} className="job-card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <div className="job-card-meta">
                    <span><Building className="w-4 h-4" /> {job.department}</span>
                    <span><MapPin className="w-4 h-4" /> {job.location}</span>
                    <span><Clock className="w-4 h-4" /> {job.type}</span>
                  </div>
                  <p className="text-gray-600">{job.description}</p>
                </div>
                <div>
                  <a href={`mailto:careers@eclatagro.com?subject=Application for ${job.title}`} className="job-apply-btn">
                    Apply Now <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How to Apply */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Apply</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="process-step text-center">
              <div className="process-step-number mx-auto">1</div>
              <h3>Submit Resume</h3>
              <p>Send your resume to careers@eclatagro.com</p>
            </div>
            <div className="process-step text-center">
              <div className="process-step-number mx-auto">2</div>
              <h3>Initial Screening</h3>
              <p>Our HR team reviews your application</p>
            </div>
            <div className="process-step text-center">
              <div className="process-step-number mx-auto">3</div>
              <h3>Interview</h3>
              <p>Technical and cultural fit interviews</p>
            </div>
            <div className="process-step text-center">
              <div className="process-step-number mx-auto">4</div>
              <h3>Welcome Aboard!</h3>
              <p>Receive offer and join our team</p>
            </div>
          </div>
          
          <div className="info-box max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Don&apos;t See a Suitable Opening?</h3>
            <p className="text-gray-600 mb-4">
              We&apos;re always looking for talented individuals to join our team. If you&apos;re passionate 
              about agriculture and technology, send us your resume even if there&apos;s no current opening 
              that matches your profile.
            </p>
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <Mail className="w-5 h-5" />
              <a href="mailto:careers@eclatagro.com" className="hover:underline">careers@eclatagro.com</a>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-banner">
          <h3>Ready to Make an Impact?</h3>
          <p>Join us in our mission to transform Indian agriculture!</p>
          <a href="mailto:careers@eclatagro.com" className="cta-banner-btn">
            <Mail className="w-5 h-5" />
            Send Your Resume
          </a>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
