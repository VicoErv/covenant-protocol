import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import BuilderEngineABI from '../abis/BuilderEngine.json';
import CovenantJoinABI from '../abis/CovenantJoin.json';

const BUILDER_ENGINE_ADDRESS = import.meta.env.VITE_BUILDER_ENGINE_ADDRESS as `0x${string}`;
const COVENANT_JOIN_ADDRESS = import.meta.env.VITE_COVENANT_JOIN_ADDRESS as `0x${string}`;

export default function SubmitForm() {
    const [details, setDetails] = useState('');
    const [amount, setAmount] = useState('');
    const { address } = useAccount();
    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const { data: isMember, refetch } = useReadContract({
        address: COVENANT_JOIN_ADDRESS,
        abi: CovenantJoinABI.abi,
        functionName: 'isMember',
        args: address ? [address] : undefined,
    });

    useEffect(() => {
        if (isSuccess) {
            refetch();
        }
    }, [isSuccess, refetch]);

    const handleJoin = () => {
        writeContract({
            address: COVENANT_JOIN_ADDRESS,
            abi: CovenantJoinABI.abi,
            functionName: 'joinCovenant',
            value: 0n,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!details || !amount) return;

        writeContract({
            address: BUILDER_ENGINE_ADDRESS,
            abi: BuilderEngineABI.abi,
            functionName: 'submitProposal',
            args: [details, parseEther(amount)],
        });
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="text-3xl font-bold text-gradient mb-4 text-center">✨ Submit Your Idea</h2>

            {!address ? (
                <div className="card text-center">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
                    <h3 className="text-xl font-bold mb-2">Wallet Required</h3>
                    <p className="opacity-70">Connect your wallet to submit ideas</p>
                </div>
            ) : (
                <>
                    {/* Membership Status */}
                    {isMember ? (
                        <div className="card mb-3" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                            <div className="flex items-center gap-3">
                                <span style={{ fontSize: '2rem' }}>✓</span>
                                <div>
                                    <div className="font-bold" style={{ color: '#4ade80' }}>Active Member</div>
                                    <div className="text-sm opacity-70">You can submit and approve proposals</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card mb-3 text-center">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
                            <h3 className="text-lg font-bold mb-2">Join the Covenant</h3>
                            <p className="opacity-70 mb-3">Become a member to submit ideas</p>
                            <button
                                onClick={handleJoin}
                                disabled={isConfirming}
                                className="btn btn-primary"
                            >
                                {isConfirming ? 'Joining...' : '🚀 Join for Free'}
                            </button>
                        </div>
                    )}

                    {/* Submission Form */}
                    <form onSubmit={handleSubmit} className="card">
                        <div className="mb-3">
                            <label className="font-semibold mb-2" style={{ display: 'block' }}>
                                💡 Idea Details
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="input"
                                rows={5}
                                placeholder="Describe your idea..."
                                required
                                style={{ resize: 'vertical' }}
                            />
                            <div className="text-sm opacity-50 mt-1">
                                {details.length}/500 characters
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="font-semibold mb-2" style={{ display: 'block' }}>
                                💎 Requested Bounty (ETH)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input"
                                placeholder="0.1"
                                required
                            />
                            {amount && (
                                <div className="text-sm opacity-70 mt-1">
                                    ≈ ${(parseFloat(amount) * 2500).toFixed(2)} USD (estimated)
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isConfirming || !details || !amount}
                            className="btn btn-primary w-full"
                        >
                            {isConfirming ? '⏳ Submitting...' : '🚀 Submit Proposal'}
                        </button>

                        <div className="mt-4" style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="text-sm opacity-70">
                                <p className="mb-1">• Your proposal will be visible to all members</p>
                                <p className="mb-1">• High-reputation members can approve your proposal</p>
                                <p>• Once approved and funded, deliver proof to claim the bounty</p>
                            </div>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}
