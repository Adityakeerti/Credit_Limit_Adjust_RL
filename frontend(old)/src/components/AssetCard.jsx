import React from 'react';
import GlassCard from './GlassCard';

const AssetCard = ({ name, type, price, change, onClick }) => {
    const isPositive = change && change >= 0;

    return (
        <GlassCard hoverEffect={true} className="asset-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={onClick}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff' }}>{name}</h3>
                    <span style={{
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.8)'
                    }}>
                        {type}
                    </span>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>
                        {price}
                    </p>
                    {change !== undefined && (
                        <p style={{
                            color: isPositive ? '#00ff88' : '#ff4d4d',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {isPositive ? '▲' : '▼'} {Math.abs(change)}%
                        </p>
                    )}
                </div>
            </div>
        </GlassCard>
    );
};

export default AssetCard;
