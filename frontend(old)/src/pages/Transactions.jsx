import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../components/common/Table'
import Card from '../components/common/Card'
import { useApp } from '../context/AppContext'
import { getUserTransactions } from '../services/transactionService'
import './Transactions.css'

const Transactions = () => {
  const navigate = useNavigate()
  const { user } = useApp()
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.userId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await getUserTransactions(user.userId)
        setTransactions(data || [])
      } catch (err) {
        console.error('Failed to fetch transactions:', err)
        setError('Failed to load transactions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [user?.userId])

  const columns = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (value) => (
        <span className="txn-id" title={value}>
          {value?.slice(0, 8)}...
        </span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      filterable: true,
      render: (value) => (
        <span className={`txn-type ${value?.toLowerCase()}`}>
          {value}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => (
        <span className="amount-value">
          V {parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      filterable: true,
      render: (value) => (
        <span className={`status-badge ${value?.toLowerCase()}`}>
          {value}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="description-text">{value || '-'}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => (
        <span className="timestamp-value">
          {value ? new Date(value).toLocaleString() : 'N/A'}
        </span>
      )
    }
  ]

  return (
    <div className="transactions-page">
      {/* Header */}
      <header className="transactions-header">
        <button className="back-btn" onClick={() => navigate('/main')}>
          ← Back
        </button>
        <h1 className="page-title">Transaction History</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="transactions-main">
        <div className="transactions-container">
          <p className="page-subtitle">
            View and track all your credit transactions
          </p>

          {isLoading ? (
            <Card className="loading-card">
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading transactions...</p>
              </div>
            </Card>
          ) : error ? (
            <Card className="error-card">
              <p>⚠️ {error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </Card>
          ) : transactions.length === 0 ? (
            <Card className="empty-state-card">
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <h3>No Transactions Yet</h3>
                <p>Your transaction history will appear here once you make purchases or transfers.</p>
              </div>
            </Card>
          ) : (
            <Table
              columns={columns}
              data={transactions}
              searchable={true}
              filterable={true}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default Transactions
