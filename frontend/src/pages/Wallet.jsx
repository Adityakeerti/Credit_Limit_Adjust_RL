import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/common/Card'
import Chart from '../components/common/Chart'
import { useApp } from '../context/AppContext'
import { getWallet } from '../services/walletService'
import { getVexBalance } from '../services/assetService'
import './Wallet.css'

const Wallet = () => {
  const navigate = useNavigate()
  const { user, wallet: contextWallet, refreshWallet } = useApp()
  const [wallet, setWallet] = useState(contextWallet)
  const [vexWallet, setVexWallet] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCheckingScore, setIsCheckingScore] = useState(false)
  const [scoreChecked, setScoreChecked] = useState(false)
  const [creditInsights, setCreditInsights] = useState(null)

  // Fetch wallet data on mount
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user?.userId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch credit wallet
        const walletData = await getWallet(user.userId)
        setWallet(walletData)

        // Try to fetch VexCoin wallet
        try {
          const vexData = await getVexBalance(user.userId)
          setVexWallet(vexData)
        } catch (err) {
          // VexCoin wallet might not exist yet
          console.log('VexCoin wallet not found:', err)
        }
      } catch (err) {
        console.error('Failed to fetch wallet:', err)
        setError('Failed to load wallet data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWalletData()
  }, [user?.userId])

  // Calculate total available credits
  const availableCredits = wallet?.availableCredits || 0
  const lockedCredits = wallet?.lockedCredits || 0
  const totalCredits = parseFloat(availableCredits) + parseFloat(lockedCredits)

  // Credit score simulation (backend doesn't have this yet)
  // Credit score calculation
  // Base score 850. Subtract based on risk (0.0-1.0). Higher risk = Lower score.
  // 850 - (risk * 550) => Risk 0 = 850, Risk 1 = 300.
  const riskBasedScore = user?.riskScore !== undefined
    ? Math.round(850 - (user.riskScore * 550))
    : 650 // Default if no score yet

  const clampedScore = Math.min(850, Math.max(300, riskBasedScore))

  // Sample growth data (would come from transaction history in full implementation)
  const growthData = [
    { date: 'Week 1', increased: parseFloat(availableCredits) * 0.7, decreased: parseFloat(lockedCredits) * 0.3 },
    { date: 'Week 2', increased: parseFloat(availableCredits) * 0.8, decreased: parseFloat(lockedCredits) * 0.4 },
    { date: 'Week 3', increased: parseFloat(availableCredits) * 0.9, decreased: parseFloat(lockedCredits) * 0.2 },
    { date: 'Current', increased: parseFloat(availableCredits), decreased: parseFloat(lockedCredits) },
  ]

  const getCreditScoreStatus = (score) => {
    if (score >= 750) return { label: 'Excellent', color: 'excellent', badge: '🟢' }
    if (score >= 700) return { label: 'Good', color: 'good', badge: '🟡' }
    if (score >= 650) return { label: 'Fair', color: 'fair', badge: '🟠' }
    return { label: 'Poor', color: 'poor', badge: '🔴' }
  }

  const creditStatus = getCreditScoreStatus(clampedScore)

  // Credit score check simulation
  const handleCheckCreditScore = async () => {
    setIsCheckingScore(true)
    setCreditInsights(null)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate credit insights based on wallet data
    const paymentScore = Math.min(100, 70 + (parseFloat(availableCredits) / 500))
    const utilizationScore = lockedCredits > 0
      ? Math.max(50, 100 - ((parseFloat(lockedCredits) / totalCredits) * 100))
      : 100

    const insights = {
      lastUpdated: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      factors: [
        { label: 'Available Credit', score: Math.round(paymentScore), status: paymentScore >= 80 ? 'excellent' : paymentScore >= 60 ? 'good' : 'fair' },
        { label: 'Credit Utilization', score: Math.round(utilizationScore), status: utilizationScore >= 80 ? 'excellent' : utilizationScore >= 60 ? 'good' : 'fair' },
        { label: 'Account Status', score: wallet?.currency ? 95 : 50, status: wallet?.currency ? 'excellent' : 'fair' },
        { label: 'Locked Credits', score: lockedCredits > 0 ? 70 : 100, status: lockedCredits > 0 ? 'good' : 'excellent' },
      ],
      recommendations: [
        lockedCredits > 0 ? 'Complete pending transactions to release locked credits' : 'Keep maintaining available credit balance',
        'Regular transactions help build credit history',
        'Avoid locking more than 50% of available credits'
      ],
      scoreChange: Math.floor(Math.random() * 10) + 1
    }

    setCreditInsights(insights)
    setIsCheckingScore(false)
    setScoreChecked(true)
  }

  const getFactorColor = (status) => {
    switch (status) {
      case 'excellent': return '#10b981'
      case 'good': return '#f59e0b'
      case 'fair': return '#f97316'
      case 'poor': return '#dc2626'
      default: return '#6b7280'
    }
  }

  if (isLoading) {
    return (
      <div className="wallet-page">
        <header className="wallet-header">
          <button className="back-btn" onClick={() => navigate('/main')}>
            ← Back
          </button>
          <h1 className="wallet-title">My Wallet</h1>
          <div className="header-spacer"></div>
        </header>
        <main className="wallet-main">
          <div className="wallet-container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading wallet...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="wallet-page">
        <header className="wallet-header">
          <button className="back-btn" onClick={() => navigate('/main')}>
            ← Back
          </button>
          <h1 className="wallet-title">My Wallet</h1>
          <div className="header-spacer"></div>
        </header>
        <main className="wallet-main">
          <div className="wallet-container">
            <Card className="error-state">
              <p>⚠️ {error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="wallet-page">
      {/* Header */}
      <header className="wallet-header">
        <button className="back-btn" onClick={() => navigate('/main')}>
          ← Back
        </button>
        <h1 className="wallet-title">My Wallet</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="wallet-main">
        <div className="wallet-container">
          <h1 className="page-title">Wallet</h1>

          {/* Credit Wallet Balance */}
          <section className="wallet-section">
            {vexWallet && (
              <Card className="wallet-balance-card vex-card">
                <div className="balance-header">
                  <span className="balance-label">VexCoin Balance</span>
                  <span className="balance-icon">🪙</span>
                  <span>
                    <span className="currency-symbol">V</span>
                    {parseFloat(vexWallet.balance || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="balance-subtitle">
                  Digital currency for asset purchases
                </div>
              </Card>
            )}
          </section>

          {/* Growth/Decline Graph */}
          <section className="wallet-section">
            <Card className="wallet-chart-card">
              <div className="chart-header">
                <h2 className="chart-title">Credit Flow</h2>
                <div className="chart-legend-info">
                  <span className="legend-item increase">
                    <span className="legend-dot"></span>
                    Available
                  </span>
                  <span className="legend-item decrease">
                    <span className="legend-dot"></span>
                    Locked
                  </span>
                </div>
              </div>
              <Chart
                data={growthData}
                type="area"
                xKey="date"
                yKeys={['increased', 'decreased']}
                colors={['#10b981', '#f59e0b']}
                height={350}
                showLegend={false}
              />

            </Card>
          </section>

          {/* Credit Score Section with Check Feature */}
          <section className="wallet-section">
            <Card className="credit-score-card">
              <div className="credit-header">
                <h2 className="credit-title">Credit Score</h2>
                <span className="credit-badge-icon">{creditStatus.badge}</span>
              </div>
              <div className="credit-score-display">
                <div className="score-circle">
                  <div className="score-value">{clampedScore}</div>
                  <div className="score-max">/ 850</div>
                </div>

                <div className="score-info">
                  <div className={`score-status ${creditStatus.color}`}>
                    {creditStatus.label}
                  </div>
                  <div className="score-description">
                    Your credit score is based on your available credits and transaction activity.
                  </div>
                </div>
              </div>
              <div className="credit-indicator">
                <div className="indicator-bar">
                  <div
                    className={`indicator-fill ${creditStatus.color}`}
                    style={{ width: `${(clampedScore / 850) * 100}%` }}
                  />
                </div>
                <div className="indicator-labels">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Credit Score Check Button */}
              <div className="credit-check-section">
                <button
                  className={`credit-check-btn ${isCheckingScore ? 'loading' : ''}`}
                  onClick={handleCheckCreditScore}
                  disabled={isCheckingScore}
                >
                  {isCheckingScore ? (
                    <>
                      <span className="spinner"></span>
                      Analyzing Credit...
                    </>
                  ) : (
                    <>
                      <span className="check-icon">🔍</span>
                      Analyze My Credit
                    </>
                  )}
                </button>

                {scoreChecked && !isCheckingScore && (
                  <span className="last-checked">
                    ✓ Last checked: {creditInsights?.lastUpdated}
                  </span>
                )}
              </div>

              {/* Credit Insights Panel */}
              {creditInsights && (
                <div className="credit-insights">
                  <h3 className="insights-title">
                    Credit Analysis
                    {creditInsights.scoreChange !== 0 && (
                      <span className={`score-change ${creditInsights.scoreChange >= 0 ? 'positive' : 'negative'}`}>
                        {creditInsights.scoreChange >= 0 ? '↑' : '↓'} {Math.abs(creditInsights.scoreChange)} pts
                      </span>
                    )}
                  </h3>

                  <div className="insights-factors">
                    <h4>Score Factors</h4>
                    {creditInsights.factors.map((factor, index) => (
                      <div key={index} className="factor-item">
                        <div className="factor-header">
                          <span className="factor-label">{factor.label}</span>
                          <span className={`factor-status ${factor.status}`}>{factor.score}%</span>
                        </div>
                        <div className="factor-bar">
                          <div
                            className="factor-fill"
                            style={{
                              width: `${factor.score}%`,
                              backgroundColor: getFactorColor(factor.status)
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="insights-recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                      {creditInsights.recommendations.map((rec, index) => (
                        <li key={index}>
                          <span className="rec-icon">💡</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Wallet
