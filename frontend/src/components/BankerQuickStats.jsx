import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { getMetrics } from '../services/adminService';

const BankerQuickStats = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await getMetrics();
                setMetrics(data);
            } catch (err) {
                console.error("Failed to fetch banker metrics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) return <div className="text-white">Loading stats...</div>;
    if (!metrics) return null;

    return (
        <GlassCard className="dashboard-section banker-stats-section">
            <h3 className="section-header">Risk Overview</h3>
            <div className="banker-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                {/* Avg Risk */}
                <div className="stat-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                    <div className="stat-label" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Avg Risk Level</div>
                    <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00d2ff' }}>
                        {(metrics.averageRiskScore * 100).toFixed(0)}%
                    </div>
                </div>

                {/* High Risk % */}
                <div className="stat-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                    <div className="stat-label" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>High Risk Users</div>
                    <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {metrics.highRiskUserPercentage?.toFixed(1)}%
                    </div>
                </div>

                {/* Risk Trend */}
                <div className="stat-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                    <div className="stat-label" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Risk Trend</div>
                    <div className={`stat-value ${metrics.riskTrend < 0 ? 'positive-trend' : 'negative-trend'}`} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: metrics.riskTrend < 0 ? '#10b981' : '#ef4444' }}>
                        {metrics.riskTrend > 0 ? '↑' : '↓'} {Math.abs(metrics.riskTrend || 0).toFixed(1)}%
                    </div>
                    <div className="stat-sub" style={{ fontSize: '0.7rem', opacity: 0.6 }}>Since last adjust</div>
                </div>

                {/* Total Users */}
                <div className="stat-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                    <div className="stat-label" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Total Users</div>
                    <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>
                        {metrics.totalUsers}
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default BankerQuickStats;
