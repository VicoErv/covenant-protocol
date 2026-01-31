import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
    address: string;
    reputation: string;
    is_member: boolean;
}

export default function Leaderboard() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get(`${API_URL}/leaderboard`);
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <h2 className="text-3xl font-bold text-white">Reputation Leaderboard</h2>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-black/30 border-b border-purple-500/20">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Rank</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Address</th>
                            <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Reputation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/10">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                                    No users yet
                                </td>
                            </tr>
                        ) : (
                            users.map((user, idx) => (
                                <tr key={user.address} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${idx === 0
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : idx === 1
                                                        ? 'bg-gray-400/20 text-gray-300'
                                                        : idx === 2
                                                            ? 'bg-orange-500/20 text-orange-400'
                                                            : 'bg-purple-500/20 text-purple-400'
                                                }`}
                                        >
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-300">
                                        {user.address.slice(0, 6)}...{user.address.slice(-4)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-lg font-semibold text-white">
                                            {(Number(user.reputation) / 1e18).toFixed(2)}
                                        </span>
                                        <span className="text-sm text-gray-400 ml-2">REP</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
