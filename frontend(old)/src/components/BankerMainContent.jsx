import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from './GlassCard';
import { useApp } from '../context/AppContext';
import { getUsers, getMetrics, getTransactions } from '../services/adminService';
import './BankerMainContent.css';

const BankerMainContent = () => {
    const navigate = useNavigate();
    const { user } = useApp();
    const [metrics, setMetrics] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [metricsData, usersData, txnData] = await Promise.all([
                    getMetrics().catch(() => null),
                    getUsers(0, 5).catch(() => ({ content: [] })),
                    getTransactions(0, 6).catch(() => ({ content: [] }))
                ]);
                setMetrics(metricsData);
                setRecentUsers(usersData?.content || []);
                setRecentTransactions(txnData?.content || []);
            } catch (err) {
                console.error('Failed to fetch banker data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return `V ${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    if (isLoading) {
        return (
            <div className="banker-main-content">
                <div className="banker-loading">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="banker-main-content">
            {/* Welcome Section */}
            <section className="welcome-section">
                <div className="welcome-text">
                    <h1>Welcome back, {user?.name || 'Admin'}</h1>
                    <p>Here's what's happening with your platform today.</p>
                </div>
                <button className="portal-btn" onClick={() => navigate('/banker')}>
                    Open Full Portal →
                </button>
            </section>

            {/* Stats Grid */}
            <section className="stats-grid">
                <GlassCard className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <span className="stat-value">{metrics?.totalUsers || 0}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <span className="stat-badge">{metrics?.activeUsers || 0} active</span>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <span className="stat-value">{metrics?.totalTransactions || 0}</span>
                        <span className="stat-label">Transactions</span>
                    </div>
                    <span className="stat-badge">{metrics?.pendingTransactions || 0} pending</span>
                </GlassCard>

                <GlassCard className="stat-card highlight">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <span className="stat-value">{formatCurrency(metrics?.totalTransactionVolume)}</span>
                        <span className="stat-label">Total Volume</span>
                    </div>
                </GlassCard>

                <GlassCard className="stat-card">
                    <div className="stat-icon">🛡️</div>
                    <div className="stat-content">
                        <span className="stat-value">{metrics?.averageRiskScore ? (metrics.averageRiskScore * 100).toFixed(0) : 0}%</span>
                        <span className="stat-label">Avg Risk Score</span>
                    </div>
                </GlassCard>
            </section>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Recent Users */}
                <GlassCard className="content-card users-card">
                    <div className="card-header">
                        <h3>Recent Users</h3>
                        <button className="view-all-btn" onClick={() => navigate('/banker')}>View All</button>
                    </div>
                    <div className="users-list">
                        {recentUsers.length === 0 ? (
                            <p className="empty-text">No users found</p>
                        ) : (
                            recentUsers.map(u => (
                                <div key={u.userId} className="user-row">
                                    <div className="user-avatar">{u.name?.charAt(0) || u.email?.charAt(0) || '?'}</div>
                                    <div className="user-info">
                                        <span className="user-name">{u.name || u.email?.split('@')[0]}</span>
                                        <span className="user-email">{u.email}</span>
                                    </div>
                                    <span className={`user-status ${u.status?.toLowerCase()}`}>{u.status}</span>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>

                {/* Recent Transactions */}
                <GlassCard className="content-card transactions-card">
                    <div className="card-header">
                        <h3>Recent Transactions</h3>
                        <button className="view-all-btn" onClick={() => navigate('/banker')}>View All</button>
                    </div>
                    <div className="transactions-list">
                        {recentTransactions.length === 0 ? (
                            <p className="empty-text">No transactions found</p>
                        ) : (
                            recentTransactions.map(txn => (
                                <div key={txn.transactionId} className="txn-row">
                                    <div className={`txn-type ${txn.type?.toLowerCase()}`}>
                                        {txn.type === 'PURCHASE' ? '↓' : '↑'}
                                    </div>
                                    <div className="txn-info">
                                        <span className="txn-desc">{txn.description || txn.type}</span>
                                        <span className="txn-date">{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <span className="txn-amount">{formatCurrency(txn.amount)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Quick Actions */}
            <section className="quick-actions">
                <GlassCard className="action-card" onClick={() => navigate('/banker')}>
                    <span className="action-icon">👥</span>
                    <span className="action-text">Manage Users</span>
                </GlassCard>
                <GlassCard className="action-card" onClick={() => navigate('/banker')}>
                    <span className="action-icon">💳</span>
                    <span className="action-text">View Wallets</span>
                </GlassCard>
                <GlassCard className="action-card" onClick={() => navigate('/banker')}>
                    <span className="action-icon">📋</span>
                    <span className="action-text">All Transactions</span>
                </GlassCard>
            </section>
        </div>
    );
};

export default BankerMainContent;
