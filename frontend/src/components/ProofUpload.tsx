import { useState } from 'react';
import axios from 'axios';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Upload } from 'lucide-react';
import BuilderEngineABI from '../abis/BuilderEngine.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BUILDER_ENGINE_ADDRESS = import.meta.env.VITE_BUILDER_ENGINE_ADDRESS as `0x${string}`;

interface ProofUploadProps {
    proposalId: number;
}

export default function ProofUpload({ proposalId }: ProofUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [proofUrl, setProofUrl] = useState('');
    const { writeContract, data: hash, error } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post(`${API_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedUrl = res.data.url;
            setProofUrl(uploadedUrl);

            // Submit proof to contract
            writeContract({
                address: BUILDER_ENGINE_ADDRESS,
                abi: BuilderEngineABI.abi,
                functionName: 'submitProof',
                args: [BigInt(proposalId), uploadedUrl],
            });
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Proof of Work
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select File
                    </label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full px-4 py-2 bg-black/30 border border-purple-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                </div>

                {file && (
                    <div className="text-sm text-gray-400">
                        Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading || isConfirming}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/50"
                >
                    {uploading ? 'Uploading...' : isConfirming ? 'Submitting to Chain...' : 'Upload & Submit Proof'}
                </button>

                {proofUrl && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-400">
                            ✓ Proof uploaded: <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="underline">{proofUrl}</a>
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400 font-medium">
                            Status: Transaction Failed
                        </p>
                        <p className="text-xs text-red-400/70 mt-1">
                            {error.message.split('\n')[0]}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
