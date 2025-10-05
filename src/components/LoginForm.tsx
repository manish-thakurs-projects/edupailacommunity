'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, User, Lock } from 'lucide-react';

type LoginStep = 'email' | 'otp' | 'success';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export default function LoginForm({ onLoginSuccess, onBack }: LoginFormProps) {
  const [currentStep, setCurrentStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!email.trim()) {
        setMessage({ type: 'error', text: 'Please enter your email address' });
        return;
      }

      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address' });
        return;
      }

      const response = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('otp');
        setMessage({ type: 'success', text: 'Verification code sent to your email' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send verification code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!otp.trim() || otp.trim().length !== 6) {
        setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
        return;
      }

      const response = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          otp: otp.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        setCurrentStep('success');
        setMessage({ type: 'success', text: 'Login successful' });
        
        setTimeout(() => {
          onLoginSuccess();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid verification code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToEmail = () => {
    setCurrentStep('email');
    setOtp('');
    setMessage(null);
  };

  // Email Step
  if (currentStep === 'email') {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Back Button - Top */}
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-black mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-light text-black mb-2">Welcome Back</h1>
              <p className="text-gray-600 text-sm">Enter your email to continue</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 bg-white text-black placeholder-gray-400"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`p-3 rounded-lg flex items-center text-sm ${
                  message.type === 'success' 
                    ? 'bg-gray-50 text-gray-800 border border-gray-200' 
                    : 'bg-gray-50 text-gray-800 border border-gray-200'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Sending Code...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // OTP Step
  if (currentStep === 'otp') {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Back Button - Top */}
          <button
            onClick={handleBackToEmail}
            className="flex items-center text-gray-600 hover:text-black mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-light text-black mb-2">Verification Code</h1>
              <p className="text-gray-600 text-sm">
                Sent to <span className="font-medium text-black">{email}</span>
              </p>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-3">
                  Enter 6-digit Code
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 text-center text-xl font-mono tracking-widest bg-white text-black placeholder-gray-300"
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Check your email for the verification code
                </p>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`p-3 rounded-lg flex items-center text-sm ${
                  message.type === 'success' 
                    ? 'bg-gray-50 text-gray-800 border border-gray-200' 
                    : 'bg-gray-50 text-gray-800 border border-gray-200'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-light text-black mb-4">Access Granted</h1>
            <p className="text-gray-600 mb-6 text-sm">
              You're now logged in and will be redirected shortly.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="animate-pulse flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}