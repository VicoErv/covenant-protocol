import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
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

export default function IdeaFeed() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const { address } = useAccount();
    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    const { data: resolverAddress } = useReadContract({
        address: BUILDER_ENGINE_ADDRESS,
        abi: BuilderEngineABI.abi,
        functionName: 'resolver',
    });

    useEffect(() => {
        fetchProposals();
        const interval = setInterval(fetchProposals, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchProposals = async () => {
        try {
            const res = await axios.get(`${API_URL}/feed`);
            setProposals(res.data);
        } catch (err) {
            console.error('Failed to fetch proposals:', err);
        }
    };

    const handleApprove = (proposalId: number) => {
        if (!address) return;
        writeContract({
            address: BUILDER_ENGINE_ADDRESS,
            abi: BuilderEngineABI.abi,
            functionName: 'approveProposal',
            args: [BigInt(proposalId)],
        });
    };

    const statusLabels = ['Pending', 'Funded', 'Delivered', 'Completed', 'Failed'];

    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white mb-6">Idea Feed</h2>
            {proposals.length === 0 ? (
                <p className="text-gray-400">No proposals yet. Be the first to submit!</p>
            ) : (
                proposals.map((p) => (
                    <div
                        key={p.id}
                        className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">{p.details}</h3>
                                <p className="text-sm text-gray-400">
                                    Submitter: {p.submitter.slice(0, 6)}...{p.submitter.slice(-4)}
                                </p>
                            </div>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === 3
                                    ? 'bg-green-500/20 text-green-400'
                                    : p.status === 4
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-purple-500/20 text-purple-400'
                                    }`}
                            >
                                {statusLabels[p.status]}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-300">
                                <span className="font-medium">Bounty:</span> {(Number(p.requested_amount) / 1e18).toFixed(4)} ETH
                                <span className="mx-4">•</span>
                                <span className="font-medium">Approvals:</span> {p.approval_count}
                            </div>
                            {p.status === 0 && address && (
                                <button
                                    onClick={() => handleApprove(p.chain_id)}
                                    disabled={isConfirming}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all"
                                >
                                    {isConfirming ? 'Approving...' : 'Approve'}
                                </button>
                            )}
                        </div>

                        {p.proof && (
                            <div className="mt-4 pt-4 border-t border-purple-500/20">
                                <p className="text-sm text-gray-400">
                                    <span className="font-medium">Proof:</span> <a href={p.proof} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">View Proof</a>
                                </p>
                            </div>
                        )}

                        {/* Actions for Funded Status (Submit Proof) */}
                        {p.status === 1 && !!address && p.submitter.toLowerCase() === address.toLowerCase() && (
                            <div className="mt-4 pt-4 border-t border-purple-500/20">
                                <ProofUpload proposalId={p.chain_id} />
                            </div>
                        )}

                        {/* Actions for Delivered Status (Resolution) */}
                        {p.status === 2 && !!resolverAddress && !!address && (resolverAddress as string).toLowerCase() === address.toLowerCase() && (
                            <ResolutionControl proposalId={p.chain_id} onResolve={fetchProposals} />
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
