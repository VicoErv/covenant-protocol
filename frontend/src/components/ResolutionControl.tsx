import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import BuilderEngineABI from '../abis/BuilderEngine.json';

const BUILDER_ENGINE_ADDRESS = import.meta.env.VITE_BUILDER_ENGINE_ADDRESS as `0x${string}`;

interface ResolutionControlProps {
    proposalId: number;
    onResolve?: () => void;
}

export default function ResolutionControl({ proposalId, onResolve }: ResolutionControlProps) {
    const queryClient = useQueryClient();
    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);

    const handleResolve = (success: boolean) => {
        setAction(success ? 'approve' : 'reject');
        writeContract({
            address: BUILDER_ENGINE_ADDRESS,
            abi: BuilderEngineABI.abi,
            functionName: 'resolveProposal',
            args: [BigInt(proposalId), success],
        });
    };

    useEffect(() => {
        if (isSuccess) {
            console.log('Resolution successful, invalidating queries...', proposalId);
            // Invalidate everything to ensure reputation and feed are fresh
            queryClient.invalidateQueries();
            if (onResolve) onResolve();
        }
    }, [isSuccess, queryClient, onResolve, proposalId]);

    return (
        <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                Resolution Required
            </h4>
            <div className="flex gap-4">
                <button
                    onClick={() => handleResolve(true)}
                    disabled={isConfirming}
                    className="flex-1 py-2 px-4 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/50 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <CheckCircle size={18} />
                    {isConfirming && action === 'approve' ? 'Approving...' : 'Approve Work'}
                </button>
                <button
                    onClick={() => handleResolve(false)}
                    disabled={isConfirming}
                    className="flex-1 py-2 px-4 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <XCircle size={18} />
                    {isConfirming && action === 'reject' ? 'Rejecting...' : 'Reject Work'}
                </button>
            </div>
            {isConfirming && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                    Confirming on blockchain...
                </p>
            )}
        </div>
    );
}
