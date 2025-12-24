'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft, CheckCircle, X, Check } from 'lucide-react';
import { forgotPassword, verifyOTP, resetPassword } from '@/lib/api/auth';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP input refs for better UX
  const [otpInputs, setOtpInputs] = useState<string[]>(['', '', '', '', '', '']);

  // Password validation rules
  const passwordRequirements = [
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (pwd: string) => pwd.length >= 8 && pwd.length <= 128,
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      id: 'number',
      label: 'One number',
      test: (pwd: string) => /\d/.test(pwd),
    },
    {
      id: 'special',
      label: 'One special character (!@#$%^&*...)',
      test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    },
    {
      id: 'common',
      label: 'Not a common password',
      test: (pwd: string) => {
        const commonPasswords = ['password', 'password123', '12345678', 'qwerty', 'abc123', 'letmein', 'welcome'];
        return !commonPasswords.includes(pwd.toLowerCase());
      },
    },
    {
      id: 'repeated',
      label: 'No repeated characters (e.g., aaaa)',
      test: (pwd: string) => !/(.)\1{3,}/.test(pwd),
    },
  ];

  // Check password strength
  const getPasswordValidation = () => {
    if (!password) {
      return { allValid: false, requirements: [] };
    }

    const requirements = passwordRequirements.map(req => ({
      ...req,
      valid: req.test(password),
    }));

    const allValid = requirements.every(req => req.valid);
    return { allValid, requirements };
  };

  const passwordValidation = getPasswordValidation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = value;
    setOtpInputs(newOtpInputs);
    
    const otpValue = newOtpInputs.join('');
    setOtp(otpValue);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d*$/.test(pastedData)) return;

    const newOtpInputs = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtpInputs(newOtpInputs);
    setOtp(pastedData);
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await forgotPassword(email);
      setSuccess('OTP has been sent to your email address. Please check your inbox.');
      setStep('otp');
      
      // Auto-focus first OTP input
      setTimeout(() => {
        document.getElementById('otp-0')?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      await verifyOTP(email, otp);
      setSuccess('OTP verified successfully. Please set your new password.');
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtpInputs(['', '', '', '', '', '']);
      setOtp('');
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!passwordValidation.allValid) {
      setError('Please meet all password requirements before continuing');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email, otp, password);
      setSuccess('Password reset successful! Redirecting to login...');
      setStep('success');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gray-50">
      <TopBar />
      <Header onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />
      <Navigation isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 flex items-center justify-center min-h-[calc(100vh-300px)]">
        <div className="form-container mx-auto">
          <div className="form-header">
            <div className="form-header-icon">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h1>
              {step === 'email' && 'Forgot Password'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'password' && 'Reset Password'}
              {step === 'success' && 'Success!'}
            </h1>
            <p>
              {step === 'email' && 'Enter your email address to receive a password reset OTP'}
              {step === 'otp' && 'Enter the 6-digit OTP sent to your email'}
              {step === 'password' && 'Enter your new password'}
              {step === 'success' && 'Your password has been reset successfully'}
            </p>
          </div>

          {error && (
            <div className="form-error">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </p>
            </div>
          )}

          {step === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">You can now login with your new password.</p>
              <Link href="/login" className="form-button inline-flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              {/* Step 1: Enter Email */}
              {step === 'email' && (
                <form onSubmit={handleRequestOTP}>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <div className="form-input-container">
                      <Mail className="form-input-icon" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="form-button w-full"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send OTP
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Enter OTP */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOTP}>
                  <div className="form-group">
                    <label className="form-label mb-4">
                      Enter 6-Digit OTP
                    </label>
                    <div className="flex justify-center gap-2 mb-4">
                      {otpInputs.map((value, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={value}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                          required
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      OTP sent to <strong>{email}</strong>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setOtpInputs(['', '', '', '', '', '']);
                        setOtp('');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="form-button-secondary flex-1"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="form-button flex-1"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Verify OTP
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={async () => {
                        setOtpInputs(['', '', '', '', '', '']);
                        setOtp('');
                        setError(null);
                        try {
                          await forgotPassword(email);
                          setSuccess('New OTP has been sent to your email.');
                        } catch (err: any) {
                          setError(err.message || 'Failed to resend OTP');
                        }
                      }}
                      className="text-sm text-green-600 hover:text-green-700 font-semibold transition-colors"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Reset Password */}
              {step === 'password' && (
                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      New Password
                    </label>
                    <div className="form-input-container">
                      <Lock className="form-input-icon" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`form-input pr-12 ${
                          password && !passwordValidation.allValid
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : password && passwordValidation.allValid
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                            : ''
                        }`}
                        placeholder="Enter your new password"
                        minLength={8}
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

                    {/* Password Requirements */}
                    {password && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Password Requirements:</p>
                        <ul className="space-y-2">
                          {passwordValidation.requirements.map((req) => (
                            <li
                              key={req.id}
                              className={`flex items-center gap-2 text-sm transition-colors ${
                                req.valid ? 'text-green-700' : 'text-gray-600'
                              }`}
                            >
                              {req.valid ? (
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className={req.valid ? 'line-through text-gray-500' : ''}>
                                {req.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {passwordValidation.allValid && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Password meets all requirements
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <div className="form-input-container">
                      <Lock className="form-input-icon" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`form-input pr-12 ${
                          confirmPassword && password !== confirmPassword
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : confirmPassword && password === confirmPassword
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                            : ''
                        }`}
                        placeholder="Confirm your new password"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <div className="mt-2">
                        {password === confirmPassword ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Passwords match
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Passwords do not match
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('otp');
                        setPassword('');
                        setConfirmPassword('');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="form-button-secondary flex-1"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !passwordValidation.allValid || password !== confirmPassword}
                      className="form-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Reset Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Back to Login Link */}
          <div className="form-footer">
            <p>
              Remember your password?{' '}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

