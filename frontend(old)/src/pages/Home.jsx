import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MainContent from '../components/MainContent';
import DashboardContent from '../components/DashboardContent';
import './Home.css';
import './MainPage.css';
import './Dashboard.css';
import './BankerHome.css';
import { getVexBalance } from '../services/assetService';

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

const Home = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, wallet, logout, isAdmin, refreshWallet } = useApp();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Determine user type from auth context
    const userType = isAdmin ? 'banker' : 'user';

    // User Profile Data from context
    const [userProfile, setUserProfile] = useState({
        name: user?.name || user?.email?.split('@')[0] || 'User',
        email: user?.email || 'user@example.com',
        phone: '+1 234 567 8900'
    });
    const [editedProfile, setEditedProfile] = useState({ ...userProfile });

    // Update profile when user data changes
    useEffect(() => {
        if (user) {
            setUserProfile({
                name: user.name || user.email?.split('@')[0] || 'User',
                email: user.email || 'user@example.com',
                phone: '+1 234 567 8900'
            });
        }
    }, [user]);

    const [vexBalance, setVexBalance] = useState(0);

    // Fetch VexCoin balance
    useEffect(() => {
        const fetchVex = async () => {
            if (user?.userId) {
                try {
                    const data = await getVexBalance(user.userId);
                    setVexBalance(parseFloat(data?.balance || 0));
                } catch (err) {
                    console.error("Failed to fetch vex balance", err);
                }
            }
        };
        fetchVex();
    }, [user?.userId]);

    // Get wallet balance from API data
    const walletBalance = wallet?.availableCredits ? parseFloat(wallet.availableCredits) : 0;
    const lockedBalance = wallet?.lockedCredits ? parseFloat(wallet.lockedCredits) : 0;

    // Calculate change (simulated - would come from history)
    const walletChange = lockedBalance > 0 ? -((lockedBalance / (walletBalance + lockedBalance)) * 100).toFixed(1) : 2.4;

    // Get initials - prefer name, fallback to email
    const getInitials = () => {
        if (userProfile.name && userProfile.name !== 'User') {
            return getInitialsFromName(userProfile.name);
        }
        return getInitialsFromEmail(userProfile.email);
    };

    // Determine active view from URL, default to 'main'
    const activeView = location.pathname.includes('dashboard') ? 'dashboard' : 'main';
    const [view, setView] = useState(activeView);

    useEffect(() => {
        // Sync state with URL changes
        setView(location.pathname.includes('dashboard') ? 'dashboard' : 'main');
    }, [location]);

    const handleSwitch = (newView) => {
        if (view === newView) return;
        navigate(`/${newView}`, { state: { userType } });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const openSettings = (e) => {
        e.stopPropagation();
        setEditedProfile({ ...userProfile });
        setShowSettings(true);
        setShowProfileMenu(false);
    };

    const handleSaveProfile = () => {
        setUserProfile({ ...editedProfile });
        setShowSettings(false);
    };

    const handleCancelSettings = () => {
        setEditedProfile({ ...userProfile });
        setShowSettings(false);
    };

    // Refresh wallet on mount
    useEffect(() => {
        if (user?.userId) {
            refreshWallet().catch(console.error);
        }
    }, [user?.userId, refreshWallet]);

    return (
        <div className={`home-container ${isAdmin ? 'banker-theme' : ''}`}>
            {/* Common Header */}
            <header className="home-header">
                <div className="logo text-gradient">Finance</div>

                {/* Pill Toggle Navigation */}
                <div className="pill-nav-container">
                    <div
                        className={`pill-nav-slider ${view === 'dashboard' ? 'slide-right' : ''}`}
                    />
                    <button
                        className={`pill-btn ${view === 'main' ? 'active' : ''}`}
                        onClick={() => handleSwitch('main')}
                    >
                        Main
                    </button>
                    <button
                        className={`pill-btn ${view === 'dashboard' ? 'active' : ''}`}
                        onClick={() => handleSwitch('dashboard')}
                    >
                        Dashboard
                    </button>
                </div>

                {/* Right Side: Wallet + Profile */}
                <div className="header-right">
                    {/* Role Badge */}
                    {isAdmin && (
                        <div className="role-badge admin">
                            🔑 Banker
                        </div>
                    )}

                    {/* Wallet Box - Hidden for Bankers */}
                    {!isAdmin && (
                        <div className="wallet-box" onClick={() => navigate('/wallet')}>
                            <div className="wallet-box-icon">🪙</div>
                            <div className="wallet-box-info">
                                <span className="wallet-box-label">VexCoin Balance</span>
                                <span className="wallet-box-balance">
                                    V {vexBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* User Profile with Dropdown */}
                    <div className="user-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <div className="avatar">{getInitials()}</div>
                        {showProfileMenu && (
                            <div className="profile-dropdown">
                                <div className="dropdown-user-info">
                                    <span className="dropdown-name">{userProfile.name}</span>
                                    <span className="dropdown-email">{userProfile.email}</span>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item" onClick={openSettings}>
                                    ⚙️ Settings
                                </div>
                                {isAdmin && (
                                    <div className="dropdown-item" onClick={() => navigate('/banker')}>
                                        🏦 Banker Portal
                                    </div>
                                )}
                                <div className="dropdown-item" onClick={() => navigate('/transactions')}>
                                    📋 Transactions
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item logout" onClick={handleLogout}>
                                    🚪 Logout
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Settings Modal */}
            {showSettings && (
                <div className="settings-overlay" onClick={handleCancelSettings}>
                    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-header">
                            <h2>Profile Settings</h2>
                            <button className="close-btn" onClick={handleCancelSettings}>×</button>
                        </div>
                        <div className="settings-body">
                            <div className="settings-avatar">
                                <div className="avatar-large">
                                    {getInitialsFromName(editedProfile.name) || getInitialsFromEmail(editedProfile.email)}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={editedProfile.name}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={editedProfile.email}
                                    readOnly
                                    className="readonly"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    value={editedProfile.phone}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                    placeholder="Enter your phone"
                                />
                            </div>
                        </div>
                        <div className="settings-footer">
                            <button className="btn-cancel" onClick={handleCancelSettings}>Cancel</button>
                            <button className="btn-save" onClick={handleSaveProfile}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animated Content Area */}
            <div className="content-wrapper">
                <div
                    className={`sliding-container ${view === 'dashboard' ? 'show-dashboard' : ''}`}
                >
                    <div className="view-panel main-panel">
                        <MainContent />
                    </div>
                    <div className="view-panel dashboard-panel">
                        <DashboardContent userType={userType} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
