'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, Tag, Send, CheckCircle, AlertCircle, User } from 'lucide-react';

interface AskQuestionProps {
  onQuestionPosted: () => void;
}

export default function AskQuestion({ onQuestionPosted }: AskQuestionProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    profilePicture: string;
  } | null>(null);

  // Load user info from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Check if user is logged in
      if (!userInfo) {
        setMessage({ type: 'error', text: 'Please register first to ask questions' });
        return;
      }

      // Validate required fields
      if (!formData.title.trim() || !formData.content.trim()) {
        setMessage({ type: 'error', text: 'Please fill in all required fields' });
        return;
      }

      // Process tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          author: userInfo,
          tags
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Question posted successfully!' });
        setFormData({
          title: '',
          content: '',
          tags: ''
        });
        onQuestionPosted();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to post question' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-2xl">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">
            Ask a Question
          </h1>
          <div className="w-16 h-0.5 bg-black mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg font-light">
            Share your inquiry with our community
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* User Information Display */}
            {userInfo ? (
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center space-x-4">
                  {userInfo.profilePicture ? (
                    <img
                      src={userInfo.profilePicture}
                      alt={userInfo.name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-normal text-gray-900">
                      {userInfo.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{userInfo.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Registration Required</h3>
                    <p className="text-gray-600 text-sm">
                      Please register to ask questions
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Question Title */}
            <div className="space-y-3">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Question Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white"
                placeholder="What would you like to know?"
              />
              <p className="text-xs text-gray-500 text-right">
                {formData.title.length}/200
              </p>
            </div>

            {/* Question Content */}
            <div className="space-y-3">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Question Details *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={6}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white resize-none"
                placeholder="Provide detailed information about your question..."
              />
              <p className="text-xs text-gray-500 text-right">
                {formData.content.length}/2000
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label htmlFor="tags" className="flex items-center text-sm font-medium text-gray-700">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 bg-white"
                placeholder="javascript, react, typescript"
              />
              <p className="text-xs text-gray-500">
                Separate tags with commas
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-gray-50 border-gray-200 text-gray-800' 
                  : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-3 text-gray-700" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-3 text-gray-700" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !userInfo}
              className="w-full bg-black text-white py-4 px-6 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
            >
              <Send className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform duration-200" />
              {isSubmitting ? 'Posting...' : userInfo ? 'Submit Question' : 'Registration Required'}
            </button>
          </form>
        </div>

        {/* Premium Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Quality questions inspire quality answers
          </p>
        </div>
      </div>
    </div>
  );
}