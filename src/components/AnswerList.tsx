'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, User, Clock, CheckCircle, MessageCircle, X, Trash2 } from 'lucide-react';

interface Answer {
  _id: string;
  content: string;
  author: {
    name: string;
    email: string;
    profilePicture: string;
  };
  isAccepted: boolean;
  upvotes: number;
  downvotes: number;
  likedBy?: string[];
  unlikedBy?: string[];
  createdAt: string;
}

interface AnswerListProps {
  questionId: string;
  refreshTrigger: number;
}

export default function AnswerList({ questionId, refreshTrigger }: AnswerListProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingAnswers, setVotingAnswers] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [answerIdToReplies, setAnswerIdToReplies] = useState<Record<string, any[]>>({});

  const fetchAnswers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/answers?questionId=${questionId}`);
      const data = await response.json();

      if (response.ok) {
        setAnswers(data.answers);
        setError(null);
        // Preload replies for all answers
        Promise.all(
          data.answers.map(async (ans: any) => {
            try {
              const r = await fetch(`/api/replies?answerId=${ans._id}`);
              const rd = await r.json();
              if (r.ok) {
                setAnswerIdToReplies(prev => ({ ...prev, [ans._id]: rd.replies }));
              }
            } catch {}
          })
        );
      } else {
        setError(data.error || 'Failed to fetch answers');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      const requesterEmail = currentUser?.email || '';
      const isAdmin = false;
      const res = await fetch(`/api/answers/${answerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterEmail, requesterIsAdmin: isAdmin })
      });
      if (res.ok) {
        fetchAnswers();
      }
    } catch {}
  };

  const handleDeleteReply = async (replyId: string, parentAnswerId: string) => {
    try {
      const requesterEmail = currentUser?.email || '';
      const isAdmin = false;
      const res = await fetch(`/api/replies/${replyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterEmail, requesterIsAdmin: isAdmin })
      });
      if (res.ok) {
        setAnswerIdToReplies(prev => ({
          ...prev,
          [parentAnswerId]: (prev[parentAnswerId] || []).filter(r => r._id !== replyId)
        }));
      }
    } catch {}
  };
  const handleReplySubmit = async (parentAnswerId: string, parentReplyId?: string | null) => {
    if (!currentUser) return;
    if (!replyContent.trim()) return;

    try {
      const userInfoRaw = localStorage.getItem('userInfo');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const author = userInfo ? {
        name: userInfo.name,
        email: String(userInfo.email).toLowerCase(),
        profilePicture: userInfo.profilePicture || ''
      } : { name: 'Anonymous', email: 'anonymous@example.com', profilePicture: '' };

      const res = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          author,
          answerId: parentAnswerId,
          parentReplyId: parentReplyId || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAnswerIdToReplies(prev => ({
          ...prev,
          [parentAnswerId]: [...(prev[parentAnswerId] || []), data.reply]
        }));
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.email) setCurrentUser({ email: String(parsed.email).toLowerCase() });
      } catch {}
    }
    fetchAnswers();
  }, [questionId, refreshTrigger]);

  const handleVote = async (answerId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      console.error('User not logged in');
      return;
    }
    if (votingAnswers.has(answerId)) return;

    setVotingAnswers(prev => new Set(prev).add(answerId));

    try {
      const response = await fetch('/api/answers/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answerId, voteType, userEmail: currentUser.email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the answer in the local state
        setAnswers(prev => prev.map(answer => 
          answer._id === answerId 
            ? { 
                ...answer, 
                upvotes: data.upvotes, 
                downvotes: data.downvotes,
                likedBy: data.likedBy,
                unlikedBy: data.unlikedBy
              }
            : answer
        ));
      } else {
        console.error('Vote failed:', data.error);
      }
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setVotingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(answerId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Answers</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Answers</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Answers ({answers.length})
      </h3>
      
      {answers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">No answers yet. Be the first to answer this question!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {answers.map((answer) => (
            <div key={answer._id} className={`bg-white rounded-lg border p-6 ${
              answer.isAccepted ? 'border-green-300 bg-green-50' : 'border-gray-200'
            }`}>
              {/* Answer Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {answer.author.profilePicture ? (
                      <img 
                        src={answer.author.profilePicture} 
                        alt={answer.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{answer.author.name}</h4>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(answer.createdAt)}
                    </p>
                  </div>
                </div>
                
                {answer.isAccepted && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">Accepted Answer</span>
                  </div>
                )}
              </div>

              {/* Answer Content */}
              <div className="mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{answer.content}</p>
              </div>

              {/* Voting and Reply Section */}
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleVote(answer._id, 'upvote')}
                  disabled={votingAnswers.has(answer._id)}
                  className={`flex items-center space-x-1 transition-colors disabled:opacity-50 ${
                    currentUser && answer.likedBy?.includes(currentUser.email)
                      ? 'text-green-600'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">{answer.upvotes}</span>
                </button>
                
                <button
                  onClick={() => handleVote(answer._id, 'downvote')}
                  disabled={votingAnswers.has(answer._id)}
                  className={`flex items-center space-x-1 transition-colors disabled:opacity-50 ${
                    currentUser && answer.unlikedBy?.includes(currentUser.email)
                      ? 'text-red-600'
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm">{answer.downvotes}</span>
                </button>

                <button
                  onClick={() => setReplyingTo(prev => prev === answer._id ? null : answer._id)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Reply</span>
                </button>

                {(currentUser && currentUser.email === answer.author.email) && (
                  <button
                    onClick={() => handleDeleteAnswer(answer._id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    title="Delete answer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                )}
              </div>

              {/* Replies */}
              {Array.isArray(answerIdToReplies[answer._id]) && answerIdToReplies[answer._id].length > 0 && (
                <div className="mt-4 space-y-3">
                  {answerIdToReplies[answer._id].map((reply: any) => (
                    <div key={reply._id} className="ml-4 pl-4 border-l border-gray-200">
                      <div className="flex items-center space-x-3 mb-1">
                        {reply.author?.profilePicture ? (
                          <img src={reply.author.profilePicture} alt={reply.author.name} className="w-7 h-7 rounded-full object-cover border" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span className="text-sm text-gray-700 font-medium">{reply.author?.name}</span>
                        <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
                        {(currentUser && currentUser.email === reply.author?.email) && (
                          <button
                            onClick={() => handleDeleteReply(reply._id, answer._id)}
                            className="ml-2 text-red-600 hover:text-red-700"
                            title="Delete reply"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{reply.content}</p>

                      {/* Reply to reply */}
                      <div className="mt-2">
                        <button
                          onClick={() => setReplyingTo(prev => prev === reply._id ? null : reply._id)}
                          className="text-xs text-gray-500 hover:text-blue-600 flex items-center"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" /> Reply
                        </button>

                        {replyingTo === reply._id && (
                          <div className="mt-2">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Write a reply..."
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleReplySubmit(answer._id, reply._id)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                              >
                                Reply
                              </button>
                              <button
                                onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 flex items-center"
                              >
                                <X className="w-3 h-3 mr-1" /> Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply box for answer */}
              {replyingTo === answer._id && (
                <div className="mt-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write a reply to this answer..."
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleReplySubmit(answer._id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 flex items-center"
                    >
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
