/**
 * UserDashboard.jsx
 * Demo user view: wallet balance, transaction list, credit-limit card.
 * Uses design.md asset-row, price-up-cell / price-down-cell patterns.
 */
import React from 'react'
import { useDemo } from '../context/DemoContext'
import './UserDashboard.css'

/* ─── Avatar ─── */
function Avatar({ initials, size = 36 }) {
  return (
    <div className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  )
}

/* ─── Asset row (transaction) ─── */
function TransactionRow({ tx }) {
  const isCredit = tx.type === 'credit'
  return (
    <div className="asset-row">
      <div className="asset-row__icon">
        {tx.category[0]}
      </div>
      <div className="asset-row__info">
        <span className="asset-row__name">{tx.merchant}</span>
        <span className="asset-row__sub">{tx.date} · {tx.category}</span>
      </div>
      <div className={`asset-row__amount ${isCredit ? 'price-up-cell' : 'price-down-cell'}`}>
        {isCredit ? '+' : ''}
        {tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </div>
    </div>
  )
}

/* ─── Credit limit bar ─── */
function CreditLimitBar({ used, total }) {
  const pct = Math.min(100, (used / total) * 100)
  const color = pct > 80 ? 'var(--colors-semantic-down)' : pct > 50 ? 'var(--colors-accent-yellow)' : 'var(--colors-primary)'
  return (
    <div className="credit-bar">
      <div className="credit-bar__track">
        <div className="credit-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="credit-bar__labels">
        <span className="credit-bar__used">${used.toLocaleString()} used</span>
        <span className="credit-bar__total muted">${total.toLocaleString()} limit</span>
      </div>
    </div>
  )
}

/* ─── UserDashboard ─── */
/**
 * @returns {JSX.Element}
 */
function UserDashboard() {
  const { users, wallet, transactions, current, liveWallet, backendReady } = useDemo()
  const { user } = users

  // Prefer live wallet credit limit if we have it; else fall from simulation state
  const creditTotal = liveWallet
    ? Math.round(liveWallet.totalCreditLimit || liveWallet.availableCredit + liveWallet.usedCredit)
    : current.creditLimit
  const creditUsed = liveWallet
    ? Math.round(liveWallet.usedCredit)
    : Math.round(current.creditLimit - Math.round(current.creditLimit * (1 - current.utilization)))

  return (
    <div className="user-dashboard">
      {/* Profile header */}
      <div className="dashboard-header">
        <Avatar initials={user.avatar} size={48} />
        <div className="dashboard-header__info">
          <span className="dashboard-header__name">{user.name}</span>
          <span className="dashboard-header__role badge-pill">Customer</span>
        </div>
        <div className="dashboard-header__score">
          <span className="dashboard-header__score-label">Credit Score</span>
          <span className="dashboard-header__score-val num up">{user.creditScore}</span>
        </div>
      </div>

      {/* Balance card */}
      <div className="balance-card">
        <span className="balance-card__label">Available Balance</span>
        <span className="balance-card__value num">
          {wallet.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </span>
        <div className="balance-card__chips">
          <div className="balance-chip">
            <span className="balance-chip__label">Income (monthly)</span>
            <span className="balance-chip__value num up">$4,200</span>
          </div>
          <div className="balance-chip">
            <span className="balance-chip__label">Spent (month)</span>
            <span className="balance-chip__value num down">$1,156</span>
          </div>
        </div>
      </div>

      {/* Credit limit card – live from simulation */}
      <div className="credit-card">
        <div className="credit-card__header">
          <span className="credit-card__title">Credit Line</span>
          <span className="badge-pill badge-pill--blue">AI-Managed</span>
        </div>
        <span className="credit-card__limit num">${current.creditLimit.toLocaleString()}</span>
        <CreditLimitBar used={creditUsed} total={creditTotal} />
        <div className="credit-card__meta">
          <span>Utilization: <b className="num">{(current.utilization * 100).toFixed(1)}%</b></span>
          <span>APR: <b className="num">{current.apr}%</b></span>
        </div>
      </div>

      {/* Transactions */}
      <div className="tx-section">
        <h3 className="tx-section__title">Recent Transactions</h3>
        <div className="tx-list">
          {transactions.map(tx => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
