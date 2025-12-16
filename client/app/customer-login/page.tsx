'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Lock, Phone, Eye, EyeOff, LogIn, UserPlus, CheckCircle, Home, Package } from 'lucide-react';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // User is already logged in, redirect to home or their account
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      router.push(redirect);
    }
  }, [isAuthenticated, authLoading, router]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to main login page
    router.push('/login');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // Redirect to main register page
    router.push('/register');
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
        <TopBar />
        <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
        <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-300px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If already authenticated, show message (though they should be redirected)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
        <TopBar />
        <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
        <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-300px)]">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border-2 border-green-200 p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Already Logged In</h1>
              <p className="text-gray-600 mb-1">
                Welcome back, <span className="font-semibold text-gray-900">{user?.firstName || user?.email}</span>!
              </p>
              <p className="text-sm text-gray-500">You are already signed in to your account.</p>
            </div>
            <div className="space-y-3">
              <Link
                href={user?.role === 'ADMIN' ? '/admin/orders' : '/my-orders'}
                className="block w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
              >
                {user?.role === 'ADMIN' ? (
                  <>
                    <Package size={20} />
                    Go to Admin Dashboard
                  </>
                ) : (
                  <>
                    <Package size={20} />
                    Go to My Orders
                  </>
                )}
              </Link>
              <Link
                href="/"
                className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center gap-2"
              >
                <Home size={20} />
                Go to Homepage
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>Customer Login</h1>
          <p>Access Your Account or Create a New One</p>
        </div>
      </div>

      <div className="page-content">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-separator">/</span>
          <span>Login</span>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Tab Switcher */}
          <div className="flex mb-8 bg-gray-100 rounded-xl p-1.5 shadow-sm">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-white text-green-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Login</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-white text-green-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Register</span>
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <div className="form-container">
              <div className="form-header">
                <div className="form-header-icon">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <h2>Welcome Back!</h2>
                <p>Login to your account to continue</p>
              </div>

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="login-email" className="form-label">Email or Phone</label>
                  <div className="form-input-container">
                    <Mail className="form-input-icon" />
                    <input
                      type="text"
                      id="login-email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="form-input"
                      placeholder="Enter email or phone"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="login-password" className="form-label">Password</label>
                  <div className="form-input-container">
                    <Lock className="form-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="form-input pr-12"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="form-checkbox mb-0">
                    <input type="checkbox" id="remember-login" className="mt-1" />
                    <label htmlFor="remember-login" className="text-sm">Remember me</label>
                  </div>
                  <a href="#" className="text-sm text-green-600 hover:text-green-700 font-semibold transition-colors">Forgot password?</a>
                </div>

                <button type="submit" className="form-button">
                  <LogIn className="w-5 h-5" />
                  Login
                </button>
              </form>

              <div className="form-footer">
                <p>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => setActiveTab('register')} className="text-green-600 font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer">
                    Register Now
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <div className="form-container">
              <div className="form-header">
                <div className="form-header-icon">
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
                <h2>Create Account</h2>
                <p>Join KRISHANSHECLAT AGROXGLOBAL and start shopping</p>
              </div>

              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label htmlFor="register-name" className="form-label">Full Name</label>
                  <div className="form-input-container">
                    <User className="form-input-icon" />
                    <input
                      type="text"
                      id="register-name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="form-input"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-email" className="form-label">Email Address</label>
                  <div className="form-input-container">
                    <Mail className="form-input-icon" />
                    <input
                      type="email"
                      id="register-email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="form-input"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-phone" className="form-label">Phone Number</label>
                  <div className="form-input-container">
                    <Phone className="form-input-icon" />
                    <input
                      type="tel"
                      id="register-phone"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="form-input"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-password" className="form-label">Password</label>
                  <div className="form-input-container">
                    <Lock className="form-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="register-password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="form-input pr-12"
                      placeholder="Create password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-confirm-password" className="form-label">Confirm Password</label>
                  <div className="form-input-container">
                    <Lock className="form-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="register-confirm-password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="form-input pr-12"
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="form-checkbox">
                  <input type="checkbox" id="terms-register" required />
                  <label htmlFor="terms-register">
                    I agree to the <Link href="/terms-of-use">Terms of Use</Link> and <Link href="/privacy-policy">Privacy Policy</Link>
                  </label>
                </div>

                <button type="submit" className="form-button">
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </button>
              </form>

              <div className="form-footer">
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setActiveTab('login')} className="text-green-600 font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer">
                    Login
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="mt-8 info-box">
            <h3 className="font-semibold text-gray-900 mb-3">Benefits of Creating an Account</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Track your orders in real-time</li>
              <li>• Save multiple shipping addresses</li>
              <li>• Quick checkout with saved details</li>
              <li>• Access exclusive offers and discounts</li>
              <li>• Earn rewards with referral program</li>
            </ul>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
