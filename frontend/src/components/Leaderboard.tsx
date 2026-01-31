import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
    address: string;
    reputation: string;
    is_member: boolean;
}

export default function Leaderboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get(`${API_URL}/leaderboard`);
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <h2 className="text-3xl font-bold text-gradient mb-4">🏆 Leaderboard</h2>
                <div className="card">Loading leaderboard...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-gradient">🏆 Leaderboard</h2>
                <span className="opacity-70">{users.length} members</span>
            </div>

            {users.length === 0 ? (
                <div className="card text-center">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                    <h3 className="text-xl font-bold mb-2">No members yet</h3>
                    <p className="opacity-70">Be the first to join and build reputation!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {users.map((user, idx) => {
                        const reputation = (Number(user.reputation) / 1e18).toFixed(2);
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                        return (
                            <div
                                key={user.address}
                                className="card"
                                style={{
                                    borderColor: idx < 3 ? 'rgba(139, 92, 246, 0.3)' : undefined
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Rank */}
                                    <div style={{
                                        width: '3rem',
                                        height: '3rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: medal ? '2rem' : '1.25rem',
                                        fontWeight: 'bold',
                                        background: medal ? 'transparent' : 'rgba(255,255,255,0.1)',
                                        borderRadius: '0.5rem'
                                    }}>
                                        {medal || `#${idx + 1}`}
                                    </div>

                                    {/* Address */}
                                    <div style={{ flex: 1 }}>
                                        <div className="font-semibold mb-1">
                                            {user.address.slice(0, 8)}...{user.address.slice(-6)}
                                        </div>
                                        <div className="text-sm opacity-70">
                                            {user.is_member ? '✓ Member' : 'Not a member'}
                                        </div>
                                    </div>

                                    {/* Reputation */}
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">{reputation}</div>
                                        <div className="text-sm opacity-70">REP</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="card mt-4" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <div className="text-sm opacity-70">
                    <p className="mb-1">💡 Earn reputation by successfully completing proposals</p>
                    <p className="mb-1">🎯 Higher reputation grants more governance power</p>
                    <p>⭐ Top performers are highlighted with medals</p>
                </div>
            </div>
        </div>
    );
}
