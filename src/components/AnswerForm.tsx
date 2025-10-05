'use client';

import { useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';

interface AnswerFormProps {
  questionId: string;
  onAnswerPosted: () => void;
}

export default function AnswerForm({ questionId, onAnswerPosted }: AnswerFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    profilePicture: string;
  } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo || content.trim().length < 10) return;
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), author: userInfo, questionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Answer posted!' });
        setContent('');
        onAnswerPosted();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to post answer' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* Compact Header */}
      <h3 className="text-lg font-medium text-gray-900 mb-3">Your Answer</h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* User Info & Textarea Row */}
        <div className="flex gap-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {userInfo?.profilePicture ? (
              <img
                src={userInfo.profilePicture}
                alt={userInfo.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={userInfo ? "Write your answer..." : "Please register to answer"}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none bg-white"
              disabled={!userInfo}
            />
          </div>
        </div>

        {/* Character Count & Submit Button Row */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 ml-11">
            {content.length < 10 ? `${10 - content.length} more characters required` : 'Good to go'}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !userInfo || content.trim().length < 10}
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Posting...' : 'Post Answer'}
          </button>
        </div>

        {/* Compact Message Display */}
        {message && (
          <div className={`text-sm px-3 py-2 rounded border ml-11 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </form>

      {/* Registration Notice */}
      {!userInfo && (
        <div className="text-xs text-gray-500 mt-2 ml-11">
          Please register to contribute answers and join the discussion.
        </div>
      )}
    </div>
  );
}