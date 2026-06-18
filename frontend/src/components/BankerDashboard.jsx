/**
 * BankerDashboard.jsx
 * Banker view: portfolio risk metrics, lending opportunities, Approve/Reject controls.
 */
import React from 'react'
import { useDemo } from '../context/DemoContext'
import './BankerDashboard.css'

/* ─── Risk metric ─── */
function RiskMetric({ label, value, unit = '', type }) {
  return (
    <div className="risk-metric">
      <span className="risk-metric__label">{label}</span>
      <span className={`risk-metric__value num ${type || ''}`}>
        {value}{unit}
      </span>
    </div>
  )
}

/* ─── Lending opportunity row ─── */
function OpportunityRow({ opp, onApprove, onReject }) {
  const isPending  = opp.status === 'pending'
  const isApproved = opp.status === 'approved'
  const isRejected = opp.status === 'rejected'

  const scoreColor = opp.creditScore >= 750 ? 'up'
                   : opp.creditScore >= 650 ? ''
                   : 'down'

  return (
    <div className={`opp-row ${isApproved ? 'opp-row--approved' : ''} ${isRejected ? 'opp-row--rejected' : ''}`}>
      <div className="opp-row__avatar">{opp.name.split(' ').map(n => n[0]).join('')}</div>
      <div className="opp-row__info">
        <span className="opp-row__name">{opp.name}</span>
        <span className="opp-row__id muted">#{opp.userId}</span>
      </div>
      <div className="opp-row__stats">
        <span className={`num ${scoreColor}`}>{opp.creditScore}</span>
        <span className="muted">Score</span>
      </div>
      <div className="opp-row__stats">
        <span className="num">${opp.requestedLimit.toLocaleString()}</span>
        <span className="muted">Limit req.</span>
      </div>
      <div className="opp-row__stats">
        <span className={`num ${opp.pd > 0.05 ? 'down' : 'up'}`}>{(opp.pd * 100).toFixed(1)}%</span>
        <span className="muted">PD</span>
      </div>
      <div className="opp-row__stats">
        <span className="num">{opp.apr}%</span>
        <span className="muted">APR</span>
      </div>
      <div className="opp-row__actions">
        {isPending ? (
          <>
            <button className="btn-approve" onClick={() => onApprove(opp.id)} aria-label={`Approve ${opp.name}`}>✓ Approve</button>
            <button className="btn-reject"  onClick={() => onReject(opp.id)}  aria-label={`Reject ${opp.name}`}>✕ Reject</button>
          </>
        ) : (
          <span className={`status-badge status-badge--${opp.status}`}>
            {opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── BankerDashboard ─── */
function BankerDashboard() {
  const {
    users,
    lendingOpportunities,
    bankerRiskMetrics,
    approveLoan,
    rejectLoan,
    current,
    liveMetrics,
    backendReady,
  } = useDemo()
  const { banker } = users
  const managedAccounts = liveMetrics?.totalUsers ?? banker.managedAccounts

  return (
    <div className="banker-dashboard">
      {/* Profile header */}
      <div className="dashboard-header">
        <div className="banker-avatar">{banker.avatar}</div>
        <div className="dashboard-header__info">
          <span className="dashboard-header__name">{banker.name}</span>
          <span className="badge-pill badge-pill--banker">Loan Officer</span>
        </div>
        <div className="dashboard-header__meta">
          <span className="dashboard-header__score-label">Portfolio</span>
          <span className="dashboard-header__score-val num">{banker.portfolio}</span>
        </div>
      </div>

      {/* Portfolio risk overview */}
      <div className="risk-panel">
        <h3 className="risk-panel__title">Portfolio Risk Overview</h3>
        <div className="risk-panel__grid">
          <RiskMetric label="Avg. Prob. of Default" value={(bankerRiskMetrics.avgPd * 100).toFixed(2)} unit="%" type="down" />
          <RiskMetric label="Portfolio APR"          value={bankerRiskMetrics.portfolioApr} unit="%" />
          <RiskMetric label="30-Day Default Rate"   value={(bankerRiskMetrics.defaultRate30d * 100).toFixed(2)} unit="%" type="down" />
          <RiskMetric label="Reserve Ratio"          value={(bankerRiskMetrics.reserveRatio * 100).toFixed(0)} unit="%" type="up" />
          <RiskMetric label="Total Exposure"         value={`$${(bankerRiskMetrics.totalExposure / 1_000_000).toFixed(1)}M`} />
          <RiskMetric label="Managed Accounts"       value={(managedAccounts ?? 0).toLocaleString()} />
        </div>
      </div>

      {/* Live simulation tie-in */}
      <div className="sim-tie">
        <div className="sim-tie__badge">◉ Demo User — Live from Simulation</div>
        <div className="sim-tie__stats">
          <div className="sim-tie__stat">
            <span className="muted">Credit Limit</span>
            <span className="num">${current.creditLimit.toLocaleString()}</span>
          </div>
          <div className="sim-tie__stat">
            <span className="muted">Utilization</span>
            <span className="num">{(current.utilization * 100).toFixed(1)}%</span>
          </div>
          <div className="sim-tie__stat">
            <span className="muted">PD</span>
            <span className={`num ${current.pd > 0.05 ? 'down' : 'up'}`}>{(current.pd * 100).toFixed(2)}%</span>
          </div>
          <div className="sim-tie__stat">
            <span className="muted">APR</span>
            <span className="num">{current.apr}%</span>
          </div>
        </div>
      </div>

      {/* Lending opportunities */}
      <div className="opp-section">
        <h3 className="opp-section__title">Lending Opportunities</h3>
        <div className="opp-list">
          {lendingOpportunities.map(opp => (
            <OpportunityRow
              key={opp.id}
              opp={opp}
              onApprove={approveLoan}
              onReject={rejectLoan}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BankerDashboard
