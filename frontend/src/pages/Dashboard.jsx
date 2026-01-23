import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LendingSystem from '../components/LendingSystem';
import AssetsEnvironment from '../components/AssetsEnvironment';
import TransactionSystem from '../components/TransactionSystem';
import './Dashboard.css';

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

const Dashboard = () => {
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

  return (
    <div className="dashboard-container">
      {/* Header / Nav */}
      <header className="dashboard-header">
        <div className="logo text-gradient">Finance</div>
        <div className="header-nav">
          <button className="nav-btn" onClick={() => navigate('/main')}>Main</button>
          <button className="nav-btn active">Dashboard</button>
        </div>
        <div className="user-profile">
          <div className="avatar">{getInitials()}</div>
        </div>
      </header>

      <main className="dashboard-content">
        <h1 className="dashboard-title">Overview</h1>

        <div className="dashboard-grid">
          {/* Lending System */}
          <section className="dashboard-column">
            <LendingSystem />
          </section>

          {/* Assets Environment */}
          <section className="dashboard-column">
            <AssetsEnvironment />
          </section>

          {/* Transactions */}
          <section className="dashboard-column">
            <TransactionSystem />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
