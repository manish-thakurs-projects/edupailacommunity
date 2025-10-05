'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'idle' | 'requested' | 'verifying'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect away from login page if admin token exists
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adminToken');
    if (token) {
      router.replace('/admin/panel');
    }
  }, [router]);

  const requestOtp = async () => {
    setMessage(null);
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || 'Failed to send verification code');
        setLoading(false);
        return;
      }
      setStage('requested');
      setMessage('Verification code sent to your email');
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMessage(null);
    if (!code) {
      setMessage('Please enter the verification code');
      return;
    }
    setLoading(true);
    setStage('verifying');
    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || 'Invalid verification code');
        setStage('requested');
        setLoading(false);
        return;
      }
      localStorage.setItem('adminToken', json.token);
      setMessage('Access granted. Redirecting...');
      setTimeout(() => router.replace('/admin/panel'), 500);
    } catch (err) {
      setMessage('Network error. Please try again.');
      setStage('requested');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (stage === 'idle') requestOtp();
      else verifyOtp();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-black rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-light tracking-tight mb-2">Admin Portal</h1>
          <p className="text-gray-600 text-sm">Secure access for authorized personnel</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                placeholder="admin@company.com"
                disabled={stage !== 'idle' || loading}
              />
            </div>

            {/* OTP Field - Only show when requested */}
            {stage === 'requested' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-900 mb-2">Verification Code</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="text-xs text-gray-600 mt-3 text-center">
                  Check your email for the 6-digit verification code
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {stage === 'idle' ? (
                <button
                  onClick={requestOtp}
                  disabled={loading}
                  className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Code...
                    </span>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              ) : (
                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Access'
                  )}
                </button>
              )}

              {stage === 'requested' && (
                <button
                  onClick={requestOtp}
                  disabled={loading}
                  className="w-full py-3 text-gray-600 rounded-xl font-medium hover:text-black hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Resend Code
                </button>
              )}
            </div>

            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-xl text-sm text-center transition-all duration-200 ${
                message.includes('error') || message.includes('Invalid') || message.includes('Failed') 
                  ? 'bg-red-50 text-red-700 border border-red-100' 
                  : 'bg-gray-50 text-gray-700 border border-gray-100'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Restricted access. Authorized use only.
          </p>
        </div>
      </div>
    </div>
  );
}