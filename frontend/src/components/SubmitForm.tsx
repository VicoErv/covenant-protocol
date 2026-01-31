import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    const handleJoin = () => {
        writeContract({
            address: COVENANT_JOIN_ADDRESS,
            abi: CovenantJoinABI.abi,
            functionName: 'joinCovenant',
            value: parseEther('0.01'),
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
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">Submit Idea</h2>

            {!address ? (
                <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-8 text-center">
                    <p className="text-gray-300 mb-4">Connect your wallet to submit ideas</p>
                </div>
            ) : (
                <>
                    <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Not a member yet?</h3>
                        <p className="text-gray-400 mb-4">Join the Covenant by depositing 0.01 ETH bond</p>
                        <button
                            onClick={handleJoin}
                            disabled={isConfirming}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all"
                        >
                            {isConfirming ? 'Joining...' : 'Join Covenant'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Idea Details
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                rows={4}
                                placeholder="Describe your idea..."
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Requested Bounty (ETH)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                placeholder="0.1"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isConfirming}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/50"
                        >
                            {isConfirming ? 'Submitting...' : 'Submit Proposal'}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
