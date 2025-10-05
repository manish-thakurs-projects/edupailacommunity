'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading community members...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-800">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-16">
          <div className="mx-auto w-24 h-24 bg-black rounded-full flex items-center justify-center mb-6 shadow-2xl">
           <img src="edupaila-community-logo.png" alt="" width={70} height={70}/>
          </div>
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">
           Edupaila Community Members
          </h1>
          <div className="w-24 h-0.5 bg-black mx-auto mb-6"></div>
          <p className="text-gray-500 text-lg font-light">
            {users.length} distinguished member{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* User Grid */}
        {users.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-16 text-center border border-gray-200">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-light text-gray-700 mb-4">No members yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              The community is awaiting its first distinguished member
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user._id}
                className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-2xl transition-all duration-300 hover:border-gray-300"
              >
                <div className="flex items-center space-x-4">
                  {/* Profile Picture */}
                  <div className="relative flex-shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center border-2 border-gray-100 shadow-sm ${user.profilePicture ? 'hidden' : ''}`}>
                      <span className="text-white text-xl font-light">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-normal text-gray-900 truncate mb-1">
                      {user.name}
                    </h3>
                    <p className="text-gray-500 text-sm truncate">
                      {user.email}
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Hover Effect Border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-black rounded-xl transition-all duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}

        {/* Premium Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-2">
            Curated community of distinguished individuals
          </p>
          <p className="text-gray-400 text-xs">
            Est. {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}