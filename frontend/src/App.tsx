import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import IdeaFeed from './components/IdeaFeed';
import SubmitForm from './components/SubmitForm';
import Leaderboard from './components/Leaderboard';
import ReputationLedgerABI from './abis/ReputationLedger.json';
import CovenantJoinABI from './abis/CovenantJoin.json';

const REPUTATION_LEDGER_ADDRESS = import.meta.env.VITE_REPUTATION_LEDGER_ADDRESS as `0x${string}`;
const COVENANT_JOIN_ADDRESS = import.meta.env.VITE_COVENANT_JOIN_ADDRESS as `0x${string}`;

function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'submit' | 'leaderboard'>('feed');
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isJoining, isSuccess: joinedSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: reputation } = useReadContract({
    address: REPUTATION_LEDGER_ADDRESS,
    abi: ReputationLedgerABI.abi,
    functionName: 'getReputation',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Sync every 10s
    }
  });

  const { data: isMember, refetch: refetchMember } = useReadContract({
    address: COVENANT_JOIN_ADDRESS,
    abi: CovenantJoinABI.abi,
    functionName: 'isMember',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    }
  });

  useEffect(() => {
    if (joinedSuccess) {
      refetchMember();
    }
  }, [joinedSuccess, refetchMember]);

  const handleJoin = () => {
    writeContract({
      address: COVENANT_JOIN_ADDRESS,
      abi: CovenantJoinABI.abi,
      functionName: 'joinCovenant',
      value: 0n,
    });
  };

  const formattedRep = reputation ? formatEther(reputation as bigint) : '0';

  return (
    <div style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
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

      {/* Global Join Banner */}
      {isConnected && !isMember && (
        <div className="container mb-6">
          <div className="card" style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '2.5rem' }}>🤝</span>
                <div>
                  <h3 className="text-lg font-bold">You are not a member yet</h3>
                  <p className="text-sm opacity-70">Join the covenant to submit and approve proposals.</p>
                </div>
              </div>
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="btn btn-primary"
              >
                {isJoining ? 'Joining...' : '🚀 Join the Covenant'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 font-medium">Transaction Failed</p>
                <p className="text-xs text-red-400/70 mt-1">{error.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

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
