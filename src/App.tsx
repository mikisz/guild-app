import React, { useState } from 'react';
import { useAuth } from './lib/AuthContext';
import { AuthForms } from './components/AuthForms';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SubmitModal } from './components/SubmitModal';
import { Feed } from './components/Feed';

export default function App() {
  const { session, loading } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'top_voted' | 'trending'>('newest');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0062FF]"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthForms />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <Header onSubmitProject={() => setShowSubmitModal(true)} />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">

          {/* Main Center Feed Column */}
          <div className="flex-1 max-w-3xl space-y-6">

            {/* Widget: Welcome Back */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">Welcome to Project Wall 👋</h2>
              <p className="text-sm text-gray-500 font-medium mb-6">Explore the latest projects, or submit your own.</p>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 shrink-0 border-2 border-white shadow-sm"></div>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex-1 text-left px-5 py-3 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-2xl text-sm font-medium text-gray-400 transition-all focus:outline-none"
                >
                  What's your latest project?
                </button>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${sortBy === 'newest' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
              >
                ✨ Newest
              </button>
              <button
                onClick={() => setSortBy('top_voted')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${sortBy === 'top_voted' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
              >
                👑 Top Voted
              </button>
              <button
                onClick={() => setSortBy('trending')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${sortBy === 'trending' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
              >
                🔥 Trending
              </button>
            </div>

            {/* Feed Component */}
            <Feed refreshTrigger={refreshTrigger} sortBy={sortBy} />

          </div>

          {/* Right Sidebar Column */}
          <div className="hidden lg:block w-80 shrink-0 space-y-6">
            <Sidebar />
          </div>

        </div>
      </main>

      {showSubmitModal && (
        <SubmitModal
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}
    </div>
  );
}
