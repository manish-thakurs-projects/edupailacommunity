'use client';

import { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  name: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

export default function OTPVerification({ email, name, onVerificationSuccess, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [otpSent, setOtpSent] = useState(false);

  // Send OTP on component mount
  useEffect(() => {
    sendOTP();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && otpSent) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, otpSent]);

  const sendOTP = async () => {
    setIsResending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Verification code sent' });
        setOtpSent(true);
        setTimeLeft(600);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the complete 6-digit code' });
      return;
    }

    setIsVerifying(true);
    setMessage(null);

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email verified successfully' });
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid verification code' });
        setOtp(['', '', '', '', '', '']);
        const firstInput = document.getElementById('otp-0');
        firstInput?.focus();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-black mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        {/* Verification Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-light text-black mb-2">Verify Your Email</h1>
            <p className="text-gray-600 text-sm mb-1">We sent a 6-digit code to</p>
            <p className="text-black font-medium">{email}</p>
          </div>

          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-medium border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-all duration-200 bg-white"
                    disabled={isVerifying}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            {otpSent && timeLeft > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <Clock className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`flex items-center p-3 rounded-lg text-sm ${
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

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying || otp.join('').length !== 6}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend OTP */}
            <div className="text-center pt-4 border-t border-gray-100">
              <button
                onClick={sendOTP}
                disabled={isResending || timeLeft > 540}
                className="inline-flex items-center text-gray-600 hover:text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}