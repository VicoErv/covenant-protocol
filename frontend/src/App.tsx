import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import IdeaFeed from './components/IdeaFeed';
import SubmitForm from './components/SubmitForm';
import Leaderboard from './components/Leaderboard';

function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'submit' | 'leaderboard'>('feed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Covenant Protocol
          </h1>
          <ConnectButton />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'feed'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
          >
            Idea Feed
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'submit'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
          >
            Submit Idea
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'leaderboard'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
          >
            Leaderboard
          </button>
        </div>

        {activeTab === 'feed' && <IdeaFeed />}
        {activeTab === 'submit' && <SubmitForm />}
        {activeTab === 'leaderboard' && <Leaderboard />}
      </div>
    </div>
  );
}

export default App;
