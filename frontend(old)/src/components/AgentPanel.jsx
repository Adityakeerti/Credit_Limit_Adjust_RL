import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    executeAutoBuy,
    executeAutoSell,
    getPlatformMetrics,
    checkAgentHealth,
    getAgentAssets
} from '../services/agentService';
import { getPortfolio } from '../services/assetService';
import GlassCard from './GlassCard';
import './AgentPanel.css';

const AgentPanel = () => {
    const { user } = useApp();
    const [isExpanded, setIsExpanded] = useState(false);
    const [agentStatus, setAgentStatus] = useState('checking');
    const [metrics, setMetrics] = useState(null);
    const [assets, setAssets] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [actionResult, setActionResult] = useState(null);

    // Form state for auto-buy
    const [buyAssetCode, setBuyAssetCode] = useState('');
    const [buyQuantity, setBuyQuantity] = useState(1);

    // Form state for auto-sell
    const [sellHoldingId, setSellHoldingId] = useState('');
    const [sellQuantity, setSellQuantity] = useState(1);

    // Hardcoded Scheduled Purchases (Demo Feature)
    const [scheduledPurchases] = useState([
        { id: 1, asset: 'EGOLD', quantity: 2, scheduledTime: '14:00', status: 'pending' },
        { id: 2, asset: 'ESILVER', quantity: 5, scheduledTime: '18:30', status: 'pending' },
        { id: 3, asset: 'QTOKEN', quantity: 10, scheduledTime: '09:00', status: 'completed' }
    ]);

    // Calculate time until scheduled purchase
    const getTimeUntil = (timeStr) => {
        const now = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduled = new Date();
        scheduled.setHours(hours, minutes, 0, 0);

        if (scheduled < now) {
            scheduled.setDate(scheduled.getDate() + 1); // Next day
        }

        const diff = scheduled - now;
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}h ${mins}m`;
    };

    // Check agent health
    const checkHealth = async () => {
        try {
            const result = await checkAgentHealth();
            setAgentStatus(result.success ? 'online' : 'offline');
        } catch {
            setAgentStatus('offline');
        }
    };

    // Fetch metrics
    const fetchMetrics = async () => {
        try {
            const data = await getPlatformMetrics();
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
        }
    };

    // Fetch assets for dropdown
    const fetchAssets = async () => {
        try {
            const data = await getAgentAssets();
            setAssets(data);
            if (data.length > 0 && !buyAssetCode) {
                setBuyAssetCode(data[0].code);
            }
        } catch (err) {
            console.error('Failed to fetch assets:', err);
        }
    };

    // Fetch holdings for sell dropdown
    const fetchHoldings = async () => {
        if (!user?.userId) return;
        try {
            const data = await getPortfolio(user.userId);
            setHoldings(data);
            if (data.length > 0 && !sellHoldingId) {
                setSellHoldingId(data[0].holdingId);
            }
        } catch (err) {
            console.error('Failed to fetch holdings:', err);
        }
    };

    useEffect(() => {
        checkHealth();
        fetchMetrics();
        fetchAssets();
        fetchHoldings();

        // Refresh health every 30s
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, [user?.userId]);

    // Handle Auto-Buy
    const handleAutoBuy = async () => {
        if (!user?.userId || !buyAssetCode) return;

        try {
            setIsExecuting(true);
            setActionResult(null);
            const result = await executeAutoBuy(user.userId, buyAssetCode, buyQuantity);
            setActionResult({ type: 'success', message: result.message || 'Purchase successful!' });
            fetchMetrics();
            fetchHoldings();
        } catch (err) {
            setActionResult({ type: 'error', message: err.response?.data?.message || 'Purchase failed' });
        } finally {
            setIsExecuting(false);
        }
    };

    // Handle Auto-Sell
    const handleAutoSell = async () => {
        if (!user?.userId || !sellHoldingId) return;

        try {
            setIsExecuting(true);
            setActionResult(null);
            const result = await executeAutoSell(user.userId, sellHoldingId, sellQuantity);
            setActionResult({ type: 'success', message: result.message || 'Sale successful!' });
            fetchMetrics();
            fetchHoldings();
        } catch (err) {
            setActionResult({ type: 'error', message: err.response?.data?.message || 'Sale failed' });
        } finally {
            setIsExecuting(false);
        }
    };

    const getStatusColor = () => {
        switch (agentStatus) {
            case 'online': return '#10b981';
            case 'offline': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    return (
        <section className="section-agent-panel">
            <div className="agent-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="agent-title">
                    <span className="agent-icon">🤖</span>
                    <h2>Automation Agent</h2>
                    <span className="agent-status" style={{ background: getStatusColor() }}>
                        {agentStatus.toUpperCase()}
                    </span>
                </div>
                <button className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
                    {isExpanded ? '▲' : '▼'}
                </button>
            </div>

            {isExpanded && (
                <GlassCard className="agent-content">
                    {/* Metrics Section */}
                    {metrics && (
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <span className="metric-value">{metrics.totalUsers || 0}</span>
                                <span className="metric-label">Total Users</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">{metrics.activeUsers || 0}</span>
                                <span className="metric-label">Active Users</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">{metrics.totalTransactions || 0}</span>
                                <span className="metric-label">Transactions</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">
                                    {parseFloat(metrics.totalVolume || 0).toFixed(0)} VEX
                                </span>
                                <span className="metric-label">Total Volume</span>
                            </div>
                        </div>
                    )}

                    {/* Action Result Toast */}
                    {actionResult && (
                        <div className={`action-result ${actionResult.type}`}>
                            {actionResult.type === 'success' ? '✓' : '✗'} {actionResult.message}
                        </div>
                    )}

                    {/* Auto-Buy Section */}
                    <div className="action-section">
                        <h3>⚡ Auto-Buy</h3>
                        <div className="action-form">
                            <select
                                value={buyAssetCode}
                                onChange={e => setBuyAssetCode(e.target.value)}
                            >
                                {assets.map(a => (
                                    <option key={a.code} value={a.code}>
                                        {a.name} ({a.priceVex} VEX)
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={buyQuantity}
                                onChange={e => setBuyQuantity(Number(e.target.value))}
                                min={1}
                                placeholder="Qty"
                            />
                            <button
                                className="action-btn buy"
                                onClick={handleAutoBuy}
                                disabled={isExecuting || !buyAssetCode}
                            >
                                {isExecuting ? '...' : 'Buy Now'}
                            </button>
                        </div>
                    </div>

                    {/* Auto-Sell Section */}
                    <div className="action-section">
                        <h3>💸 Auto-Sell</h3>
                        <div className="action-form">
                            <select
                                value={sellHoldingId}
                                onChange={e => setSellHoldingId(e.target.value)}
                            >
                                {holdings.length === 0 ? (
                                    <option value="">No holdings</option>
                                ) : (
                                    holdings.map(h => (
                                        <option key={h.holdingId} value={h.holdingId}>
                                            {h.asset?.name || h.assetCode} ({parseFloat(h.quantity).toFixed(2)})
                                        </option>
                                    ))
                                )}
                            </select>
                            <input
                                type="number"
                                value={sellQuantity}
                                onChange={e => setSellQuantity(Number(e.target.value))}
                                min={1}
                                placeholder="Qty"
                            />
                            <button
                                className="action-btn sell"
                                onClick={handleAutoSell}
                                disabled={isExecuting || !sellHoldingId || holdings.length === 0}
                            >
                                {isExecuting ? '...' : 'Sell Now'}
                            </button>
                        </div>
                    </div>

                    {/* Scheduled Purchases Section */}
                    <div className="scheduled-section">
                        <h3>📅 Scheduled Purchases</h3>
                        <div className="scheduled-list">
                            {scheduledPurchases.map(item => (
                                <div key={item.id} className={`scheduled-item ${item.status}`}>
                                    <div className="scheduled-info">
                                        <span className="scheduled-asset">{item.asset}</span>
                                        <span className="scheduled-qty">x{item.quantity}</span>
                                    </div>
                                    <div className="scheduled-time">
                                        <span className="time-label">⏰ {item.scheduledTime}</span>
                                        {item.status === 'pending' && (
                                            <span className="countdown">In {getTimeUntil(item.scheduledTime)}</span>
                                        )}
                                        {item.status === 'completed' && (
                                            <span className="status-badge completed">✓ Done</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="agent-footer">
                        <span className="footer-note">
                            Powered by n8n Automation • Connected to Backend
                        </span>
                    </div>
                </GlassCard>
            )}
        </section>
    );
};

export default AgentPanel;
