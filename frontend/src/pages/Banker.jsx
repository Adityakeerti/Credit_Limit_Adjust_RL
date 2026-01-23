import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/common/Card'
import Table from '../components/common/Table'
import { useApp } from '../context/AppContext'
import { getUsers, getMetrics, getTransactions, getWallets, updateUserStatus, adjustCreditLimit } from '../services/adminService'
import './Banker.css'

const Banker = () => {
  const navigate = useNavigate()
  const { user, isAdmin } = useApp()

  // State for admin data
  const [metrics, setMetrics] = useState(null)
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [wallets, setWallets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Modal states
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [adjustmentAmount, setAdjustmentAmount] = useState('')

  // Fetch admin data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isAdmin) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch all admin data in parallel
        const [metricsData, usersData, txnData, walletsData] = await Promise.all([
          getMetrics().catch(() => null),
          getUsers(0, 50).catch(() => ({ content: [] })),
          getTransactions(0, 50).catch(() => ({ content: [] })),
          getWallets().catch(() => [])
        ])

        setMetrics(metricsData)
        setUsers(usersData?.content || [])
        setTransactions(txnData?.content || [])
        setWallets(walletsData || [])
      } catch (err) {
        console.error('Failed to fetch admin data:', err)
        setError('Failed to load admin data. Please ensure you have admin permissions.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminData()
  }, [isAdmin])

  // Handle user status update
  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus)
      setUsers(users.map(u => u.userId === userId ? { ...u, status: newStatus } : u))
    } catch (err) {
      console.error('Failed to update user status:', err)
      alert('Failed to update user status')
    }
  }

  // Handle credit limit adjustment
  const handleAdjustSubmit = async () => {
    if (!selectedWallet || !adjustmentAmount) return

    try {
      await adjustCreditLimit(selectedWallet.walletId, parseFloat(adjustmentAmount))
      // Refresh wallets
      const walletsData = await getWallets()
      setWallets(walletsData || [])
      setShowAdjustModal(false)
      setSelectedWallet(null)
      setAdjustmentAmount('')
    } catch (err) {
      console.error('Failed to adjust credit limit:', err)
      alert('Failed to adjust credit limit')
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0)
    return `V ${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  // User table columns
  const userColumns = [
    { key: 'name', label: 'Name', filterable: true },
    { key: 'email', label: 'Email', filterable: true },
    { key: 'role', label: 'Role', render: (v) => <span className={`role-tag ${v?.toLowerCase()}`}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-tag ${v?.toLowerCase()}`}>{v}</span> },
    { key: 'riskScore', label: 'Risk Score', render: (v) => <span className="risk-score">{(v * 100).toFixed(0)}%</span> },
    {
      key: 'recommendation',
      label: 'AI Recommendation',
      render: (_, row) => {
        const score = row.riskScore || 0.5;
        if (score < 0.3) return <span className="status-tag active">Increase Limit</span>;
        if (score > 0.7) return <span className="status-tag suspended">Restrict</span>;
        return <span className="status-tag pending">Monitor</span>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="action-buttons">
          {row.status === 'ACTIVE' ? (
            <button className="action-btn suspend" onClick={() => handleStatusUpdate(row.userId, 'SUSPENDED')}>
              Suspend
            </button>
          ) : (
            <button className="action-btn activate" onClick={() => handleStatusUpdate(row.userId, 'ACTIVE')}>
              Activate
            </button>
          )}
        </div>
      )
    }
  ]

  // Transaction table columns
  const txnColumns = [
    { key: 'transactionId', label: 'ID', render: (v) => <span className="txn-id">{v?.slice(0, 8)}...</span> },
    { key: 'type', label: 'Type', render: (v) => <span className={`type-tag ${v?.toLowerCase()}`}>{v}</span> },
    { key: 'amount', label: 'Amount', render: (v) => formatCurrency(v) },
    { key: 'status', label: 'Status', render: (v) => <span className={`status-tag ${v?.toLowerCase()}`}>{v}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' }
  ]

  // Wallet table columns
  const walletColumns = [
    { key: 'walletId', label: 'Wallet ID', render: (v) => <span className="wallet-id">{v?.slice(0, 8)}...</span> },
    { key: 'userId', label: 'User ID', render: (v) => <span className="user-id">{v?.slice(0, 8)}...</span> },
    { key: 'availableCredits', label: 'Available', render: (v) => formatCurrency(v) },
    { key: 'lockedCredits', label: 'Locked', render: (v) => formatCurrency(v) },
    { key: 'currency', label: 'Currency' },
    {
      key: 'actions',
      label: 'Adjust',
      render: (_, row) => (
        <button className="action-btn adjust" onClick={() => { setSelectedWallet(row); setShowAdjustModal(true); }}>
          Adjust Limit
        </button>
      )
    }
  ]

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <div className="banker-page">
        <header className="banker-header-bar">
          <button className="back-btn" onClick={() => navigate('/main')}>← Back</button>
          <h1 className="page-title">Banker Portal</h1>
          <div className="header-spacer"></div>
        </header>
        <main className="banker-main">
          <Card className="access-denied">
            <div className="denied-content">
              <span className="denied-icon">🔒</span>
              <h2>Access Denied</h2>
              <p>This area is restricted to administrators only.</p>
              <button onClick={() => navigate('/main')}>Return to Main</button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="banker-page">
        <header className="banker-header-bar">
          <button className="back-btn" onClick={() => navigate('/main')}>← Back</button>
          <h1 className="page-title">Banker Portal</h1>
          <div className="header-spacer"></div>
        </header>
        <main className="banker-main">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="banker-page">
      {/* Header */}
      <header className="banker-header-bar">
        <button className="back-btn" onClick={() => navigate('/main')}>← Back</button>
        <h1 className="page-title">🏦 Banker Portal</h1>
        <div className="admin-badge">Admin Access</div>
      </header>

      {/* Tab Navigation */}
      <nav className="banker-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 Users
        </button>
        <button className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
          💰 Transactions
        </button>
        <button className={`tab-btn ${activeTab === 'wallets' ? 'active' : ''}`} onClick={() => setActiveTab('wallets')}>
          💳 Wallets
        </button>
      </nav>

      <main className="banker-main">
        {error && (
          <Card className="error-card">
            <p>⚠️ {error}</p>
          </Card>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="overview-grid">
            <Card className="metric-card">
              <div className="metric-icon">🛡️</div>
              <div className="metric-info">
                <span className="metric-value">{metrics.averageRiskScore ? (metrics.averageRiskScore * 100).toFixed(0) : 50}%</span>
                <span className="metric-label">Avg Risk Level</span>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="metric-icon">⚠️</div>
              <div className="metric-info">
                <span className="metric-value">{metrics.highRiskUserPercentage?.toFixed(1) || 0}%</span>
                <span className="metric-label">High Risk Users</span>
              </div>
              <div className="metric-sub">Above 70% Risk</div>
            </Card>

            <Card className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-info">
                <span className="metric-value">{Math.abs(metrics.riskTrend || 0).toFixed(1)}%</span>
                <span className="metric-label">Risk {metrics.riskTrend >= 0 ? 'Increased' : 'Decreased'}</span>
              </div>
              <div className={`metric-sub ${metrics.riskTrend < 0 ? 'positive' : 'negative'}`}>
                Since last adjust
              </div>
            </Card>

            <Card className="metric-card">
              <div className="metric-icon">👥</div>
              <div className="metric-info">
                <span className="metric-value">{metrics.totalUsers}</span>
                <span className="metric-label">Total Users</span>
              </div>
              <div className="metric-sub">{metrics.activeUsers} active</div>
            </Card>

            <Card className="metric-card">
              <div className="metric-icon">📋</div>
              <div className="metric-info">
                <span className="metric-value">{metrics.totalTransactions}</span>
                <span className="metric-label">Transactions</span>
              </div>
              <div className="metric-sub">{metrics.pendingTransactions} pending</div>
            </Card>

            <Card className="metric-card">
              <div className="metric-icon">✅</div>
              <div className="metric-info">
                <span className="metric-value">{metrics.settledTransactions}</span>
                <span className="metric-label">Settled</span>
              </div>
            </Card>

            <Card className="metric-card highlight">
              <div className="metric-icon">💵</div>
              <div className="metric-info">
                <span className="metric-value">{formatCurrency(metrics.totalTransactionVolume)}</span>
                <span className="metric-label">Total Volume</span>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="metric-icon">💳</div>
              <div className="metric-info">
                <span className="metric-value">{formatCurrency(metrics.totalAvailableCredits)}</span>
                <span className="metric-label">Available Credits</span>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="metric-icon">🔒</div>
              <div className="metric-info">
                <span className="metric-value">{formatCurrency(metrics.totalLockedCredits)}</span>
                <span className="metric-label">Locked Credits</span>
              </div>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="data-section">
            <h2 className="section-title">User Management</h2>
            {users.length > 0 ? (
              <Table columns={userColumns} data={users} searchable filterable />
            ) : (
              <Card className="empty-card"><p>No users found</p></Card>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="data-section">
            <h2 className="section-title">All Transactions</h2>
            {transactions.length > 0 ? (
              <Table columns={txnColumns} data={transactions} searchable filterable />
            ) : (
              <Card className="empty-card"><p>No transactions found</p></Card>
            )}
          </div>
        )}

        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div className="data-section">
            <h2 className="section-title">Wallet Management</h2>
            {wallets.length > 0 ? (
              <Table columns={walletColumns} data={wallets} searchable />
            ) : (
              <Card className="empty-card"><p>No wallets found</p></Card>
            )}
          </div>
        )}
      </main>

      {/* Credit Adjustment Modal */}
      {showAdjustModal && selectedWallet && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Adjust Credit Limit</h3>
            <p className="modal-info">
              Current Available: {formatCurrency(selectedWallet.availableCredits)}
            </p>
            <div className="form-group">
              <label>Adjustment Amount (positive to add, negative to subtract)</label>
              <input
                type="number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="e.g., 1000 or -500"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAdjustModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAdjustSubmit}>Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Banker
