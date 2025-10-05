'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, Eye, Clock, CheckCircle, User, Tag, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import AnswerForm from './AnswerForm';
import AnswerList from './AnswerList';

interface Question {
  _id: string;
  title: string;
  content: string;
  author: {
    name: string;
    email: string;
    profilePicture?: string;
  };
  tags: string[];
  isResolved: boolean;
  upvotes: number;
  downvotes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface Answer {
  _id: string;
  content: string;
  author: {
    name: string;
    email: string;
    profilePicture?: string;
  };
  isAccepted: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

interface QAListProps {
  refreshTrigger: number;
}

export default function QAList({ refreshTrigger }: QAListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.email) setCurrentUser({ email: String(parsed.email).toLowerCase() });
      } catch {}
    }
    fetchQuestions();
  }, [currentPage, sortBy, refreshTrigger]);
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const requesterEmail = currentUser?.email || '';
      const isAdmin = false; // TODO: wire to real admin session
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterEmail, requesterIsAdmin: isAdmin })
      });
      if (res.ok) {
        setSelectedQuestion(null);
        fetchQuestions();
      }
    } catch {}
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions?page=${currentPage}&sortBy=${sortBy}&limit=10`);
      const data = await response.json();
      
      if (response.ok) {
        setQuestions(data.questions);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to fetch questions');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionDetails = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedQuestion(data.question);
      } else {
        setError(data.error || 'Failed to fetch question details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-800">{error}</p>
            <button
              onClick={fetchQuestions}
              className="mt-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedQuestion) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setSelectedQuestion(null)}
            className="mb-8 flex items-center text-gray-600 hover:text-black font-medium group"
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Questions
          </button>

          {/* Question Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <h1 className="text-3xl font-light text-gray-900 flex-1 mr-4 leading-tight">
                {selectedQuestion.title}
              </h1>
              <div className="flex items-center">
                {selectedQuestion.isResolved && (
                  <span className="flex items-center bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolved
                  </span>
                )}
                {(currentUser && currentUser.email === selectedQuestion.author.email) && (
                  <button
                    onClick={() => handleDeleteQuestion(selectedQuestion._id)}
                    className="ml-3 text-red-600 hover:text-red-700"
                    title="Delete question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Question Meta */}
            <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
              <div className="flex items-center">
                {selectedQuestion.author?.profilePicture ? (
                  <img
                    src={selectedQuestion.author.profilePicture}
                    alt={selectedQuestion.author.name}
                    className="w-6 h-6 rounded-full object-cover mr-2 border border-gray-300"
                  />
                ) : (
                  <User className="w-4 h-4 mr-2" />
                )}
                {selectedQuestion.author.name}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {formatDate(selectedQuestion.createdAt)}
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                {selectedQuestion.views} views
              </div>
            </div>

            {/* Tags */}
            {selectedQuestion.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedQuestion.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm"
                  >
                    <Tag className="w-3 h-3 mr-2" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Question Content */}
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                {selectedQuestion.content}
              </p>
            </div>
          </div>

          {/* Answers List */}
          <AnswerList 
            questionId={selectedQuestion._id} 
            refreshTrigger={refreshTrigger}
          />

          {/* Answer Form */}
          <div className="mt-8">
            <AnswerForm 
              questionId={selectedQuestion._id} 
              onAnswerPosted={() => {
                fetchQuestionDetails(selectedQuestion._id);
              }} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-2xl">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">
            Community Q&A
          </h1>
          <div className="w-16 h-0.5 bg-black mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg font-light">
            Curated knowledge from our community
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex justify-center gap-1 mb-8 p-2 bg-gray-50 rounded-lg max-w-md mx-auto">
          {[
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'popular', label: 'Popular' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex-1 ${
                sortBy === option.value
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
            <HelpCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-light text-gray-700 mb-4">No questions yet</h3>
            <p className="text-gray-500">Be the first to start the conversation</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {questions.map((question) => (
              <div
                key={question._id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => fetchQuestionDetails(question._id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-normal text-gray-900 flex-1 mr-4 group-hover:text-black leading-relaxed">
                    {question.title}
                  </h3>
                  {question.isResolved && (
                    <span className="flex items-center bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolved
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed">
                  {question.content}
                </p>

                {/* Tags */}
                {question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {question.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                    {question.tags.length > 3 && (
                      <span className="text-gray-500 text-sm">
                        +{question.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center">
                      {question.author?.profilePicture ? (
                        <img
                          src={question.author.profilePicture}
                          alt={question.author.name}
                          className="w-6 h-6 rounded-full object-cover mr-2 border border-gray-300"
                        />
                      ) : (
                        <User className="w-4 h-4 mr-2" />
                      )}
                      {question.author.name}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDate(question.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      {question.views}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 group-hover:text-black">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    View Discussion
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-black hover:text-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
            
            <span className="px-6 py-3 text-gray-700 border border-transparent">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-black hover:text-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}

        {/* Premium Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Quality questions inspire thoughtful answers
          </p>
        </div>
      </div>
    </div>
  );
}