import axios from 'axios';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatEther } from 'viem';
import { Coins, TrendingUp } from 'lucide-react';
import BuilderEngineABI from '../abis/BuilderEngine.json';
import ProofUpload from './ProofUpload';
import ResolutionControl from './ResolutionControl';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BUILDER_ENGINE_ADDRESS = import.meta.env.VITE_BUILDER_ENGINE_ADDRESS as `0x${string}`;

interface Proposal {
    id: number;
    chain_id: number;
    submitter: string;
    details: string;
    requested_amount: string;
    status: number;
    proof: string | null;
    approval_count: number;
}

const statusConfig = {
    0: { label: 'Pending', className: 'badge-pending' },
    1: { label: 'Funded', className: 'badge-funded' },
    2: { label: 'Delivered', className: 'badge-delivered' },
    3: { label: 'Completed', className: 'badge-completed' },
    4: { label: 'Failed', className: 'badge-failed' },
};

export default function IdeaFeed() {
    const { address } = useAccount();
    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    const { data: resolverAddress } = useReadContract({
        address: BUILDER_ENGINE_ADDRESS,
        abi: BuilderEngineABI.abi,
        functionName: 'resolver',
    });

    const { data: proposals = [], isLoading: loading, refetch } = useQuery<Proposal[]>({
        queryKey: ['proposals'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/feed`);
            return res.data;
        },
        refetchInterval: 5000,
    });

    const handleApprove = (proposalId: number) => {
        if (!address) return;
        writeContract({
            address: BUILDER_ENGINE_ADDRESS,
            abi: BuilderEngineABI.abi,
            functionName: 'approveProposal',
            args: [BigInt(proposalId)],
        });
    };

    if (loading) {
        return (
            <div>
                <h2 className="text-3xl font-bold text-gradient mb-4">💡 Idea Feed</h2>
                <div className="card mb-3">Loading proposals...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-gradient">💡 Idea Feed</h2>
                <span className="opacity-70">{proposals.length} proposals</span>
            </div>

            {proposals.length === 0 ? (
                <div className="card text-center">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
                    <h3 className="text-xl font-bold mb-2">No proposals yet</h3>
                    <p className="opacity-70">Be the first to submit an innovative idea!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {proposals.map((p) => {
                        const status = statusConfig[p.status as keyof typeof statusConfig];
                        return (
                            <div key={p.id} className="card">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div style={{ flex: 1 }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`badge ${status.className}`}>
                                                {status.label}
                                            </span>
                                            <span className="text-sm opacity-50">#{p.chain_id}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">{p.details}</h3>
                                        <p className="text-sm opacity-70">
                                            By {p.submitter.slice(0, 6)}...{p.submitter.slice(-4)}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4 mb-3" style={{ padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div>
                                        <div className="text-sm opacity-70 mb-1 flex items-center gap-1">
                                            <Coins size={14} className="text-yellow-400" />
                                            Bounty
                                        </div>
                                        <div className="font-bold text-lg text-white">
                                            {formatEther(BigInt(p.requested_amount))} ETH
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm opacity-70 mb-1 flex items-center gap-1">
                                            <TrendingUp size={14} className="text-green-400" />
                                            Approvals
                                        </div>
                                        <div className="font-bold text-lg text-white">{p.approval_count}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {p.status === 0 && address && (
                                        <button
                                            onClick={() => handleApprove(p.chain_id)}
                                            disabled={isConfirming}
                                            className="btn btn-primary"
                                        >
                                            {isConfirming ? 'Approving...' : '👍 Approve'}
                                        </button>
                                    )}
                                    {p.proof && (
                                        <a
                                            href={p.proof}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary"
                                        >
                                            📎 View Proof
                                        </a>
                                    )}
                                </div>

                                {/* Proof Upload */}
                                {p.status === 1 && !!address && p.submitter.toLowerCase() === address.toLowerCase() && (
                                    <div className="mt-3" style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <ProofUpload proposalId={p.chain_id} />
                                    </div>
                                )}

                                {/* Resolution Control */}
                                {p.status === 2 && !!resolverAddress && !!address && (resolverAddress as string).toLowerCase() === address.toLowerCase() && (
                                    <div className="mt-3" style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <ResolutionControl proposalId={p.chain_id} onResolve={refetch} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
