/**
 * api.js
 * Central API service layer — connects to the live backend at VITE_BACKEND_URL.
 * All calls gracefully fall back to mock data on failure so the demo never breaks.
 */

const BASE = import.meta.env.VITE_BACKEND_URL || 'https://autolend-backend.onrender.com'

/* ─── Token store (in-memory; no localStorage for demo security) ─── */
let _token = null
let _userId = null

export function getToken()  { return _token }
export function getUserId() { return _userId }

function authHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (_token) h['Authorization'] = `Bearer ${_token}`
  return h
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json()
}

/* ─────────────────────────────────────────────────────────
   AUTH
───────────────────────────────────────────────────────── */

const DEMO_EMAIL    = 'demo@autocreditrl.dev'
const DEMO_PASSWORD = 'Demo@12345'
const DEMO_NAME     = 'Alex Rivera'

/**
 * Ensure the demo user is registered + logged in.
 * Returns { token, userId, role, riskScore } or null on failure.
 */
export async function ensureDemoSession() {
  try {
    // Try login first
    let data
    try {
      data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
      })
    } catch {
      // 400 → user not found → register
      data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME, role: 'USER' }),
      })
    }

    _token  = data.token
    _userId = data.userId
    return data
  } catch (e) {
    console.warn('[API] ensureDemoSession failed – running in offline mode:', e.message)
    return null
  }
}

/* ─────────────────────────────────────────────────────────
   WALLET
───────────────────────────────────────────────────────── */

/**
 * Fetch live wallet for authenticated user.
 * Returns { availableCredits, lockedCredits, currency } or null.
 */
export async function fetchWallet() {
  if (!_userId) return null
  try {
    return await apiFetch(`/api/wallet/${_userId}`)
  } catch (e) {
    console.warn('[API] fetchWallet failed:', e.message)
    return null
  }
}

/* ─────────────────────────────────────────────────────────
   TRANSACTIONS
───────────────────────────────────────────────────────── */

/**
 * Fetch transaction history for the demo user.
 * Returns array of Transaction objects or null.
 */
export async function fetchTransactions() {
  if (!_userId) return null
  try {
    return await apiFetch(`/api/transactions/user/${_userId}`)
  } catch (e) {
    console.warn('[API] fetchTransactions failed:', e.message)
    return null
  }
}

/* ─────────────────────────────────────────────────────────
   ADMIN METRICS (banker dashboard)
───────────────────────────────────────────────────────── */

/**
 * Fetch portfolio metrics from the admin endpoint.
 * Requires ADMIN role — will fail for USER role; fallback handled by caller.
 */
export async function fetchAdminMetrics() {
  try {
    return await apiFetch('/admin/metrics')
  } catch (e) {
    console.warn('[API] fetchAdminMetrics failed (expected for USER role):', e.message)
    return null
  }
}

/**
 * Fetch all wallets for banker risk overview.
 */
export async function fetchAllWallets() {
  try {
    return await apiFetch('/admin/wallets')
  } catch (e) {
    console.warn('[API] fetchAllWallets failed:', e.message)
    return null
  }
}

/* ─────────────────────────────────────────────────────────
   AI / RL SIMULATION STEP
───────────────────────────────────────────────────────── */

/**
 * Call the Python AI service /v1/predict endpoint to get the next RL action.
 * Maps the frontend SimState into PredictRequest format.
 * Returns a SimStep-shaped object or null on failure.
 */
export async function fetchRlStep(current, actionIdx) {
  try {
    const multipliers = [-0.20, 0.00, 0.10, 0.20, 0.30]
    const ACTION_MULTIPLIERS_BACKEND = [1.00, 1.04, 1.09, 1.13, 1.17, 1.22, 1.26, 1.30, 1.35, 1.40]

    const payload = {
      user_id:             _userId ? String(_userId) : 'demo_user',
      current_limit:       current.creditLimit,
      utilization_30d:     current.utilization,
      payment_ratio_30d:   Math.max(0, 1 - current.pd * 5), // approximate from PD
      util_trend_3m:       (current.utilization - 0.42),    // delta from initial
      months_on_book:      Math.max(1, current.step),
      hazard_rate:         current.pd,
    }

    const res = await apiFetch('/v1/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    // Map response → frontend SimStep shape
    const backendMultiplier = res.multiplier ?? 1.0
    const newLimit = Math.max(1000, Math.round(current.creditLimit * backendMultiplier))
    const utilizationDelta = (Math.random() - 0.5) * 0.06
    const newUtilization   = Math.min(1, Math.max(0.05, current.utilization + utilizationDelta))
    const newPd            = Math.min(0.25, Math.max(0.005, res.hazard_rate ?? current.pd))
    const newApr           = Math.max(9, Math.min(29.9, 12 + newPd * 220 + (Math.random() - 0.5) * 0.4))
    const reward           = +(newUtilization * 0.6 - newPd * 4 + (backendMultiplier - 1) * 0.5).toFixed(3)

    // Remap backend action_code (0-9) → frontend action idx (0-4) by closest multiplier
    const m = backendMultiplier
    const frontendAction = m <= 1.00 ? 0 : m <= 1.04 ? 2 : m <= 1.09 ? 2 : m <= 1.13 ? 2 : m <= 1.17 ? 3 : 4

    return {
      step:        current.step + 1,
      creditLimit: newLimit,
      utilization: +newUtilization.toFixed(3),
      pd:          +newPd.toFixed(4),
      reward,
      apr:         +newApr.toFixed(2),
      action:      frontendAction,
      // Extra backend data surfaced for display
      _backendExplanation: res.explanation,
      _backendMultiplier:  backendMultiplier,
      _backendActionCode:  res.action_code,
      _backendConfidence:  res.confidence,
    }
  } catch (e) {
    console.warn('[API] fetchRlStep failed – will use local sim:', e.message)
    return null
  }
}

/* ─────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────── */

/** Map backend Transaction entity → frontend transaction shape */
export function mapBackendTransaction(tx) {
  const amount = parseFloat(tx.amount ?? 0)
  const isCredit = tx.type === 'CREDIT' || tx.type === 'REVERSAL' || amount > 0
  return {
    id:       tx.transactionId ?? tx.id ?? String(Math.random()),
    date:     tx.createdAt ? tx.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    merchant: tx.description || tx.type || 'Transaction',
    amount:   isCredit ? Math.abs(amount) : -Math.abs(amount),
    category: tx.type === 'PURCHASE' ? 'Purchase'
            : tx.type === 'REVERSAL' ? 'Credit'
            : tx.type ?? 'Transaction',
    type:     isCredit ? 'credit' : 'debit',
  }
}

/** Map backend Wallet entity → frontend wallet shape */
export function mapBackendWallet(w) {
  if (!w) return null
  const available = parseFloat(w.availableCredits ?? 0)
  const locked    = parseFloat(w.lockedCredits    ?? 0)
  return {
    balance:           available,
    availableCredit:   available,
    usedCredit:        locked,
    totalCreditLimit:  available + locked,
    currency:          w.currency ?? 'VEX',
  }
}

/** Map backend MetricsResponse → bankerRiskMetrics shape */
export function mapBackendMetrics(m) {
  if (!m) return null
  const totalExposure = parseFloat(m.totalAvailableCredits ?? 0) + parseFloat(m.totalLockedCredits ?? 0)
  return {
    avgPd:           (m.averageRiskScore   ?? 0.031),
    portfolioApr:    16.4,  // not in backend metrics; keep as-is
    defaultRate30d:  (m.highRiskUserPercentage ?? 0.8) / 100,
    reserveRatio:    0.12,
    totalExposure,
    totalUsers:      m.totalUsers ?? 0,
    activeUsers:     m.activeUsers ?? 0,
  }
}
