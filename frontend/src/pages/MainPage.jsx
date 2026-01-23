import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import AssetCard from '../components/AssetCard';
import './MainPage.css';

// Helper function to generate initials from email
const getInitialsFromEmail = (email) => {
    if (!email || typeof email !== 'string') return 'JD';
    const emailPart = email.split('@')[0];
    if (!emailPart) return 'JD';
    const parts = emailPart.split(/[._-]/).filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return emailPart.substring(0, 2).toUpperCase() || 'JD';
};

// Helper function to generate initials from name
const getInitialsFromName = (name) => {
    if (!name || typeof name !== 'string') return '';
    const trimmed = name.trim();
    if (!trimmed) return '';
    const parts = trimmed.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return trimmed.substring(0, 2).toUpperCase() || '';
};

const MainPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useApp();
    
    // Get user data from location state or context
    const userEmail = location.state?.email || user.email;
    const userName = location.state?.username || user.name;
    
    // Get initials - prefer name, fallback to email
    const getInitials = () => {
        if (userName && userName !== 'User') {
            return getInitialsFromName(userName);
        }
        return getInitialsFromEmail(userEmail);
    };

    // Wallet Data
    const walletBalance = 45678.92;
    const walletChange = 2.4; // percentage change

    // Broadcast Data: e-gold, e-silver, nft + 2 random
    const [broadcastAssets] = useState([
        { id: 1, name: 'e-Gold', type: 'Commodity', price: '$2,450.00', change: 1.2 },
        { id: 2, name: 'e-Silver', type: 'Commodity', price: '$28.50', change: -0.5 },
        { id: 3, name: 'Bored Ape NFT', type: 'NFT', price: '12.5 ETH', change: 5.4 },
        { id: 4, name: 'Quantum Token', type: 'Crypto', price: '$0.45', change: 12.1 },
        { id: 5, name: 'Green Energy Fund', type: 'Stock', price: '$145.20', change: 0.8 },
    ]);

    // Portfolio Data: Purchased assets
    const [portfolioAssets] = useState([
        { id: 101, name: 'Bitcoin', type: 'Crypto', amount: '0.5 BTC', value: '$32,000' },
        { id: 102, name: 'Tesla', type: 'Stock', amount: '10 Shares', value: '$2,400' },
        { id: 103, name: 'e-Gold', type: 'Commodity', amount: '5 oz', value: '$12,250' },
    ]);

    return (
        <div className="main-container">
            {/* Header / Nav */}
            <header className="main-header">
                <div className="logo text-gradient">Finance</div>
                <div className="header-nav">
                    <button className="nav-btn active">Main</button>
                    <button className="nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
                </div>

                {/* Right Side: Wallet + Profile */}
                <div className="header-right">
                    {/* Wallet Box */}
                    <div className="wallet-box" onClick={() => navigate('/wallet')}>
                        <div className="wallet-box-icon">💰</div>
                        <div className="wallet-box-info">
                            <span className="wallet-box-label">Wallet</span>
                            <span className="wallet-box-balance">
                                ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className={`wallet-box-change ${walletChange >= 0 ? 'positive' : 'negative'}`}>
                            {walletChange >= 0 ? '↑' : '↓'} {Math.abs(walletChange)}%
                        </div>
                    </div>

                    <div className="user-profile">
                        <div className="avatar">{getInitials()}</div>
                    </div>
                </div>
            </header>

            <main className="main-content">

                {/* Broadcast Section */}
                <section className="section-broadcast">
                    <h2 className="section-title">Market Broadcast</h2>
                    <div className="broadcast-scroller">
                        <div className="broadcast-track">
                            {/* Duplicate array for seamless loop */}
                            {[...broadcastAssets, ...broadcastAssets].map((asset, index) => (
                                <div key={`${asset.id}-${index}`} className="broadcast-item">
                                    <AssetCard
                                        name={asset.name}
                                        type={asset.type}
                                        price={asset.price}
                                        change={asset.change}
                                        onClick={() => console.log('Clicked', asset.name)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Portfolio Section */}
                <section className="section-portfolio">
                    <h2 className="section-title">Your Portfolio</h2>
                    <GlassCard className="portfolio-table-container">
                        <table className="portfolio-table">
                            <thead>
                                <tr>
                                    <th>Asset</th>
                                    <th>Type</th>
                                    <th>Holdings</th>
                                    <th>Value</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {portfolioAssets.map(asset => (
                                    <tr key={asset.id}>
                                        <td style={{ fontWeight: '600' }}>{asset.name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{asset.type}</td>
                                        <td>{asset.amount}</td>
                                        <td>{asset.value}</td>
                                        <td>
                                            <button className="trade-btn">Trade</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassCard>
                </section>

            </main>
        </div>
    );
};

export default MainPage;
