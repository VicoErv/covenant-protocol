import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import IdeaFeed from './components/IdeaFeed';
import SubmitForm from './components/SubmitForm';
import Leaderboard from './components/Leaderboard';
import ReputationLedgerABI from './abis/ReputationLedger.json';

const REPUTATION_LEDGER_ADDRESS = import.meta.env.VITE_REPUTATION_LEDGER_ADDRESS as `0x${string}`;

function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'submit' | 'leaderboard'>('feed');
  const { address, isConnected } = useAccount();

  const { data: reputation } = useReadContract({
    address: REPUTATION_LEDGER_ADDRESS,
    abi: ReputationLedgerABI.abi,
    functionName: 'getReputation',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const formattedRep = reputation ? formatEther(reputation as bigint) : '0';

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
            <div className="flex items-center gap-4">
              {isConnected && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span className="text-sm font-semibold">
                    {Number(formattedRep).toLocaleString(undefined, { maximumFractionDigits: 2 })} REP
                  </span>
                </div>
              )}
              <ConnectButton />
            </div>
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
