import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add navigation
import GlassCard from './GlassCard';
import { useApp } from '../context/AppContext';
import { getUserTransactions, getAllTransactions } from '../services/transactionService';

const TransactionSystem = () => {
    const { user, txUpdateCounter } = useApp();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCtx = async () => {
            if (!user?.userId) return;
            try {
                let data = [];
                // Check if user is banker/admin (roles: ADMIN, BANKER)
                if (user.role === 'ADMIN' || user.role === 'BANKER') {
                    data = await getAllTransactions();
                } else {
                    data = await getUserTransactions(user.userId);
                }

                // For the widget, we still likely want to limit to recent ones, 
                // but the prompt asked "show all" for bankers. 
                // Since this is a "Recent Activity" widget, I'll show more items for bankers or just the top 5 recent from *everyone*.
                // "For user view show only their recent transactions and for bankers show all" 
                // I'll assume "show all" in the context of the list means "transactions from everyone".
                // I will keep the slice to 5 for the dashboard widget to avoid overflow, but the list will come from the "all" source.
                setTransactions(data?.slice(0, 10) || []); // Increased limit slightly for better visibility
            } catch (err) {
                console.error("Failed to fetch transactions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCtx();
    }, [user?.userId, user?.role, txUpdateCounter]);

    if (loading) return <div className="text-white">Loading transactions...</div>;

    if (transactions.length === 0) {
        return (
            <GlassCard className="dashboard-section transaction-section">
                <h3 className="section-header">Recent Transactions</h3>
                <div className="empty-state">No recent transactions</div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="dashboard-section transaction-section">
            <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="section-header" style={{ margin: 0 }}>Recent Activity</h3>
                <button
                    className="view-all-btn"
                    onClick={() => navigate('/transactions')}
                    style={{ background: 'transparent', border: 'none', color: '#00d2ff', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    View All
                </button>
            </div>
            <div className="transaction-list">
                {transactions.map(tx => (
                    <div key={tx.transactionId} className="transaction-item">
                        <div className={`tx-icon ${tx.type?.toLowerCase() || 'default'}`}>
                            {tx.type?.[0] || '?'}
                        </div>
                        <div className="tx-details">
                            <span className="tx-title">{tx.type} {tx.description ? `- ${tx.description}` : ''}</span>
                            <span className="tx-date">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="tx-amount">
                            {tx.type === 'DEBIT' ? '-' : '+'}
                            V {parseFloat(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`tx-status ${tx.status?.toLowerCase()}`}>
                            {tx.status}
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

export default TransactionSystem;
