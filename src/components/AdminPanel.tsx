'use client';

import { useState, useEffect } from 'react';
import { Lock, Send, Upload, Link, FileText, LogOut, Eye, EyeOff, X } from 'lucide-react';

interface EmailData {
  subject: string;
  content: string;
  attachments: File[];
  videoLinks: string[];
  recipientEmails: string[];
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [emailData, setEmailData] = useState<EmailData>({
    subject: '',
    content: '',
    attachments: [],
    videoLinks: [''],
    recipientEmails: []
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (loginData.username && loginData.password) {
        setToken('demo-token');
        localStorage.setItem('adminToken', 'demo-token');
        setIsAuthenticated(true);
        setMessage({ type: 'success', text: 'Access granted' });
      } else {
        setMessage({ type: 'error', text: 'Invalid credentials' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsAuthenticated(false);
    setEmailData({
      subject: '',
      content: '',
      attachments: [],
      videoLinks: [''],
      recipientEmails: []
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEmailData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const addVideoLink = () => {
    setEmailData(prev => ({
      ...prev,
      videoLinks: [...prev.videoLinks, '']
    }));
  };

  const removeVideoLink = (index: number) => {
    setEmailData(prev => ({
      ...prev,
      videoLinks: prev.videoLinks.filter((_, i) => i !== index)
    }));
  };

  const updateVideoLink = (index: number, value: string) => {
    setEmailData(prev => ({
      ...prev,
      videoLinks: prev.videoLinks.map((link, i) => i === index ? value : link)
    }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({ 
        type: 'success', 
        text: `Broadcast sent to all users` 
      });
      setEmailData({
        subject: '',
        content: '',
        attachments: [],
        videoLinks: [''],
        recipientEmails: []
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Delivery failed' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-light text-gray-900 mb-2">Admin Access</h2>
              <p className="text-gray-500 text-sm">Enter credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm"
                  placeholder="Username"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {message && (
                <div className={`text-sm p-3 rounded-lg border ${
                  message.type === 'success' 
                    ? 'bg-gray-50 border-gray-200 text-gray-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Authenticating...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-light text-gray-900">Admin Console</h1>
              <p className="text-sm text-gray-500">Broadcast Management</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-light text-gray-900 mb-2">New Broadcast</h2>
            <p className="text-gray-500 text-sm">Send message to all registered users</p>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm"
                placeholder="Enter message subject"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={emailData.content}
                onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm resize-none"
                placeholder="Write your message here..."
              />
            </div>

            {/* Video Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Media Links
              </label>
              {emailData.videoLinks.map((link, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updateVideoLink(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm"
                    placeholder="https://"
                  />
                  {emailData.videoLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVideoLink(index)}
                      className="ml-2 p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addVideoLink}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <Link className="w-4 h-4 mr-2" />
                Add link
              </button>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Attachments
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      Select files
                    </label>
                  </div>
                </div>
                
                {emailData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {emailData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border text-sm ${
                message.type === 'success' 
                  ? 'bg-gray-50 border-gray-200 text-gray-800' 
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center text-sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Broadcast'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}