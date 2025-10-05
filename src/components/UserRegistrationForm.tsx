'use client';

import { useState } from 'react';
import { User, Mail, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import OTPVerification from './OTPVerification';

interface UserFormData {
  name: string;
  email: string;
  profilePicture: string;
  displayInfo: boolean;
}

type RegistrationStep = 'form' | 'otp' | 'success';

interface UserRegistrationFormProps {
  onUserRegistered?: () => void;
}

export default function UserRegistrationForm({ onUserRegistered }: UserRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    profilePicture: '',
    displayInfo: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      // Show loading state
      setMessage({ type: 'success', text: 'Uploading image...' });
      
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setFormData(prev => ({
            ...prev,
            profilePicture: data.imageUrl
          }));
          setMessage({ type: 'success', text: 'Image uploaded successfully!' });
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to upload image' });
        }
      } catch (error) {
        console.error('Upload error:', error);
        setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Validate form data
      if (!formData.name.trim() || !formData.email.trim()) {
        setMessage({ type: 'error', text: 'Please fill in all required fields' });
        return;
      }

      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address' });
        return;
      }

      // Move to OTP verification step
      setCurrentStep('otp');
    } catch (error) {
      setMessage({ type: 'error', text: 'Please check your information and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPVerificationSuccess = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        // Invert the checkbox: checked means "Don't display" → send displayInfo: false
        displayInfo: !formData.displayInfo
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user info in localStorage
        const userInfo = {
          name: formData.name,
          email: formData.email,
          profilePicture: formData.profilePicture
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        setCurrentStep('success');
        setFormData({
          name: '',
          email: '',
          profilePicture: '',
          displayInfo: false
        });
        
        // Notify parent component
        if (onUserRegistered) {
          onUserRegistered();
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Registration failed' });
        setCurrentStep('form');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setCurrentStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setMessage(null);
  };

  // Render different steps
  if (currentStep === 'otp') {
    return (
      <OTPVerification
        email={formData.email}
        name={formData.name}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onBack={handleBackToForm}
      />
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-light text-gray-900 mb-4">Registration Complete</h2>
            <div className="w-12 h-0.5 bg-black mx-auto mb-6"></div>
            <p className="text-gray-600 mb-8 font-light">
              Your email has been verified and you're now a member of our community.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep('form')}
                className="w-full bg-black text-white py-4 px-6 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
              >
                Register Another User
              </button>
              <a
                href="/"
                className="block w-full bg-white text-gray-700 py-4 px-6 rounded-lg font-medium border border-gray-300 hover:border-black transition-all duration-200"
              >
                Go to Community
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-2xl">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">
            Join Our Community
          </h1>
          <div className="w-16 h-0.5 bg-black mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg font-light">
            Complete your registration to get started
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name Field */}
            <div className="space-y-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Profile Picture Upload */}
            <div className="space-y-3">
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
                Profile Picture
              </label>
              <div className="relative">
                <Upload className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white file:border-0 file:bg-transparent file:text-gray-600 file:text-sm file:font-medium"
                />
              </div>
              {formData.profilePicture && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">Profile Picture Preview:</p>
                  <div className="flex items-center space-x-4">
                    <img
                      src={formData.profilePicture}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                    <span className="text-sm text-gray-500">Image uploaded</span>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Checkbox */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="displayInfo"
                name="displayInfo"
                checked={formData.displayInfo}
                onChange={handleInputChange}
                className="h-5 w-5 text-black focus:ring-black border-gray-300 rounded mt-1"
              />
              <label htmlFor="displayInfo" className="text-sm text-gray-700">
                Don't display my information on the community list
              </label>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border flex items-center ${
                message.type === 'success' 
                  ? 'bg-gray-50 border-gray-200 text-gray-800' 
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-3 text-gray-700 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-3 text-gray-700 flex-shrink-0" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 px-6 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Continue to Verification'}
            </button>
          </form>

          {/* Premium Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Your privacy and data security are important to us
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}