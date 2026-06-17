/**
 * mockData.js
 * Hard-coded seed data used for initial UI rendering and simulation reset.
 * All financial values are fictional and for demonstration purposes only.
 */

/** @typedef {{ step: number, creditLimit: number, utilization: number, pd: number, reward: number, apr: number }} SimStep */

/** Initial simulation state */
export const initialSimState = {
  step: 0,
  creditLimit: 5000,
  utilization: 0.42,
  pd: 0.035,          // Probability of Default (Cox model)
  reward: 0,
  apr: 18.5,
  action: 0,          // RL action index
}

/** Hard-coded demo users (no login required) */
export const demoUsers = {
  user: {
    id: 'demo_user',
    name: 'Alex Rivera',
    email: 'alex.rivera@demo.autolend',
    role: 'USER',
    avatar: 'AR',
    creditScore: 712,
    memberSince: '2022-03',
  },
  banker: {
    id: 'demo_banker',
    name: 'Jordan Kim',
    email: 'jordan.kim@autolend.bank',
    role: 'BANKER',
    avatar: 'JK',
    portfolio: '$4.2M',
    managedAccounts: 1_847,
  },
}

/** User wallet seed data */
export const userWallet = {
  balance: 2_847.50,
  availableCredit: 2_900,
  usedCredit: 2_100,
  totalCreditLimit: 5_000,
  currency: 'USD',
}

/** Transaction history seed */
export const transactions = [
  { id: 't1',  date: '2026-06-15', merchant: 'Whole Foods Market',   amount: -134.20, category: 'Groceries',     type: 'debit' },
  { id: 't2',  date: '2026-06-14', merchant: 'Netflix',               amount:  -15.99, category: 'Subscription',  type: 'debit' },
  { id: 't3',  date: '2026-06-13', merchant: 'Salary — TechCorp',     amount: 4200.00, category: 'Income',        type: 'credit' },
  { id: 't4',  date: '2026-06-12', merchant: 'Amazon',                amount: -289.95, category: 'Shopping',      type: 'debit' },
  { id: 't5',  date: '2026-06-11', merchant: 'Credit Payment',        amount:  500.00, category: 'Credit',        type: 'credit' },
  { id: 't6',  date: '2026-06-10', merchant: 'Starbucks',             amount:   -6.75, category: 'Food & Drink',  type: 'debit' },
  { id: 't7',  date: '2026-06-09', merchant: 'Spotify',               amount:  -10.99, category: 'Subscription',  type: 'debit' },
  { id: 't8',  date: '2026-06-08', merchant: 'Shell Gas Station',     amount:  -58.40, category: 'Transport',     type: 'debit' },
]

/** Banker lending opportunities */
export const lendingOpportunities = [
  { id: 'l1', userId: 'u_2841', name: 'Sam Chen',    creditScore: 748, requestedLimit: 8_000, pd: 0.018, apr: 14.5, status: 'pending' },
  { id: 'l2', userId: 'u_1923', name: 'Priya Nair',  creditScore: 692, requestedLimit: 3_500, pd: 0.041, apr: 19.9, status: 'pending' },
  { id: 'l3', userId: 'u_3302', name: 'Mike Torres', creditScore: 801, requestedLimit: 15_000, pd: 0.009, apr: 11.2, status: 'approved' },
  { id: 'l4', userId: 'u_0088', name: 'Yuki Tanaka', creditScore: 623, requestedLimit: 2_000, pd: 0.072, apr: 24.9, status: 'rejected' },
]

/** Banker risk portfolio metrics */
export const bankerRiskMetrics = {
  avgPd: 0.031,
  portfolioApr: 16.4,
  defaultRate30d: 0.008,
  totalExposure: 4_200_000,
  reserveRatio: 0.12,
}

/** RL action space labels */
export const actionLabels = [
  'Decrease limit (−20%)',
  'Keep stable (±0%)',
  'Increase limit (+10%)',
  'Increase limit (+20%)',
  'Increase limit (+30%)',
]

/** Generate the next simulation step (pure function – no backend) */
export function simulateStep(prev, actionIdx = 1) {
  const multipliers = [-0.20, 0.00, 0.10, 0.20, 0.30]
  const m = multipliers[actionIdx] ?? 0

  const newLimit = Math.max(1000, Math.round(prev.creditLimit * (1 + m)))
  const utilizationDelta = (Math.random() - 0.5) * 0.06
  const newUtilization = Math.min(1, Math.max(0.05, prev.utilization + utilizationDelta))

  const pdBase = 0.03 + newUtilization * 0.08 - (prev.creditLimit / 20_000)
  const newPd = Math.min(0.25, Math.max(0.005, pdBase + (Math.random() - 0.5) * 0.005))

  const newApr = Math.max(9, Math.min(29.9, 12 + newPd * 220 + (Math.random() - 0.5) * 0.4))

  // Reward: lower PD and higher utilization = good for bank
  const reward = (newUtilization * 0.6 - newPd * 4 + m * 0.5).toFixed(3)

  return {
    step: prev.step + 1,
    creditLimit: newLimit,
    utilization: +newUtilization.toFixed(3),
    pd: +newPd.toFixed(4),
    reward: +reward,
    apr: +newApr.toFixed(2),
    action: actionIdx,
  }
}
