'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Home, HelpCircle, Menu, X } from 'lucide-react';
import UserRegistrationForm from '@/components/UserRegistrationForm';
import UserList from '@/components/UserList';
import AskQuestion from '@/components/AskQuestion';
import QAList from '@/components/QAList';
import LoginForm from '@/components/LoginForm';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'community' | 'ask' | 'qa'>('register');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is registered on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
      setActiveTab('community');
    }
  }, []);

  const tabs = [
    { id: 'register', label: 'Register', icon: Home },
    { id: 'login', label: 'Login', icon: Home },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'ask', label: 'Ask Question', icon: HelpCircle },
    { id: 'qa', label: 'Q&A', icon: Mail },
  ];

  // Filter tabs based on user registration status
  const visibleTabs = userInfo 
    ? tabs.filter(tab => tab.id !== 'register' && tab.id !== 'login')
    : tabs.filter(tab => tab.id !== 'ask');

  const handleQuestionPosted = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('qa');
  };

  const handleUserRegistered = () => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
      setActiveTab('community');
    }
  };

  const handleLoginSuccess = () => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
      setActiveTab('community');
    }
  };

  const handleTabClick = (tabId: any) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Navigation */}
      <nav className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center">
                <img src="/edupaila-community-logo.png" alt="" />
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-6 py-3 rounded-none transition-all duration-300 border-b-2 ${
                      activeTab === tab.id
                        ? 'text-white border-white font-medium'
                        : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
              
              {userInfo && (
                <button
                  onClick={() => {
                    localStorage.removeItem('userInfo');
                    setUserInfo(null);
                    setActiveTab('register');
                  }}
                  className="ml-4 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 border border-gray-700 hover:border-gray-500"
                >
                  Logout
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-400 hover:text-white p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center w-full px-4 py-3 text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
              {userInfo && (
                <button
                  onClick={() => {
                    localStorage.removeItem('userInfo');
                    setUserInfo(null);
                    setActiveTab('register');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-gray-900 transition-colors duration-200"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="min-h-[60vh]">
          {activeTab === 'register' && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-light text-black mb-8 text-center">Join Our Community</h1>
              <UserRegistrationForm onUserRegistered={handleUserRegistered} />
            </div>
          )}
          {activeTab === 'login' && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-light text-black mb-8 text-center">Welcome Back</h1>
              <LoginForm onLoginSuccess={handleLoginSuccess} onBack={() => setActiveTab('register')} />
            </div>
          )}
          {activeTab === 'community' && (
            <div>
              <UserList />
            </div>
          )}
          {activeTab === 'ask' && (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-light text-black mb-8">Ask a Question</h1>
              <AskQuestion onQuestionPosted={handleQuestionPosted} />
            </div>
          )}
          {activeTab === 'qa' && (
            <div>
              <h1 className="text-3xl font-light text-black mb-8">Questions & Answers</h1>
              <QAList refreshTrigger={refreshTrigger} />
            </div>
          )}
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="bg-black text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
           
            <p className="text-gray-400 text-sm font-light tracking-wide">
              © 2024 Edupaila Community Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}