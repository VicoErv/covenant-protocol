import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import IdeaFeed from './components/IdeaFeed';
import SubmitForm from './components/SubmitForm';
import Leaderboard from './components/Leaderboard';

function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'submit' | 'leaderboard'>('feed');

  return (
    <div style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ marginBottom: '3rem' }}>
        <div className="container">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-1">
                ⚡ Covenant Protocol
              </h1>
              <p className="opacity-70">Decentralized Builder Engine</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mb-4">
        <div className="flex gap-2" style={{ justifyContent: 'center', marginBottom: '3rem' }}>
          <button
            onClick={() => setActiveTab('feed')}
            className={activeTab === 'feed' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            📋 Idea Feed
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={activeTab === 'submit' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            ✨ Submit Idea
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={activeTab === 'leaderboard' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container">
        {activeTab === 'feed' && <IdeaFeed />}
        {activeTab === 'submit' && <SubmitForm />}
        {activeTab === 'leaderboard' && <Leaderboard />}
      </main>
    </div>
  );
}

export default App;
