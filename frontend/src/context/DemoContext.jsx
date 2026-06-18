/**
 * DemoContext.jsx
 * Provides shared simulation state and live backend data to the entire app.
 * On mount: boots a demo session against the live backend (with mock fallback).
 * Step calls hit /v1/predict; wallet + transactions come from /api/*.
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  useState,
} from 'react'
import {
  initialSimState,
  demoUsers,
  userWallet       as mockWallet,
  transactions     as mockTransactions,
  lendingOpportunities,
  bankerRiskMetrics as mockBankerMetrics,
} from '../data/mockData'
import {
  ensureDemoSession,
  fetchWallet,
  fetchTransactions,
  fetchAdminMetrics,
  fetchRlStep,
  mapBackendWallet,
  mapBackendTransaction,
  mapBackendMetrics,
} from '../api'

/* ─────────── Context ─────────── */
const DemoContext = createContext(null)

/** @returns {import('./DemoContext').DemoContextValue} */
export const useDemo = () => {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}

/* ─────────── Reducer ─────────── */
const MAX_HISTORY = 40

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATE': {
      const next = action.payload
      const history = [...state.history, next].slice(-MAX_HISTORY)
      return { ...state, current: next, history }
    }
    case 'SET_ACTION':
      return { ...state, pendingAction: action.idx }
    case 'APPROVE_LOAN': {
      const opps = state.lendingOpportunities.map(o =>
        o.id === action.id ? { ...o, status: 'approved' } : o
      )
      return { ...state, lendingOpportunities: opps }
    }
    case 'REJECT_LOAN': {
      const opps = state.lendingOpportunities.map(o =>
        o.id === action.id ? { ...o, status: 'rejected' } : o
      )
      return { ...state, lendingOpportunities: opps }
    }
    case 'RESET':
      return initialReducerState()
    default:
      return state
  }
}

function initialReducerState() {
  return {
    current:              initialSimState,
    history:              [initialSimState],
    pendingAction:        1,           // default: keep stable
    lendingOpportunities: lendingOpportunities,
  }
}

/* ─────────── Provider ─────────── */
/**
 * DemoProvider wraps the app and provides:
 * - Live simulation state (RL step via backend with local fallback)
 * - Live wallet + transaction data (backend with mock fallback)
 * - Live banker risk metrics (backend with mock fallback)
 * @param {{ children: React.ReactNode }} props
 */
export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialReducerState)
  const autoRunRef  = useRef(false)
  const rafRef      = useRef(null)
  const lastTickRef = useRef(0)

  /* ── Live data from backend (with fallbacks) ── */
  const [backendReady,   setBackendReady]   = useState(false)
  const [sessionInfo,    setSessionInfo]    = useState(null)   // AuthResponse
  const [liveWallet,     setLiveWallet]     = useState(null)   // mapped wallet or null
  const [liveTransactions, setLiveTransactions] = useState(null) // mapped txns or null
  const [liveMetrics,    setLiveMetrics]    = useState(null)   // mapped metrics or null

  /* ── Boot: register/login demo user, then fetch live data ── */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // 1. Auth
      const session = await ensureDemoSession()
      if (cancelled) return
      setSessionInfo(session)

      if (session) {
        setBackendReady(true)

        // 2. Fetch wallet + transactions + metrics in parallel
        const [wallet, txns, metrics] = await Promise.all([
          fetchWallet(),
          fetchTransactions(),
          fetchAdminMetrics(),
        ])
        if (cancelled) return

        if (wallet)   setLiveWallet(mapBackendWallet(wallet))
        if (txns)     setLiveTransactions(txns.map(mapBackendTransaction))
        if (metrics)  setLiveMetrics(mapBackendMetrics(metrics))
      }
    })()
    return () => { cancelled = true }
  }, [])

  /* ── Manual step: try backend /v1/predict first, else local sim ── */
  const step = useCallback(async () => {
    const backendNext = await fetchRlStep(state.current, state.pendingAction)
    if (backendNext) {
      dispatch({ type: 'SET_STATE', payload: backendNext })
      // Refresh wallet after step (credit limit may have changed)
      fetchWallet().then(w => { if (w) setLiveWallet(mapBackendWallet(w)) })
    } else {
      // Local pure-function fallback
      const { simulateStep } = await import('../data/mockData')
      const next = simulateStep(state.current, state.pendingAction)
      dispatch({ type: 'SET_STATE', payload: next })
    }
  }, [state.current, state.pendingAction])

  /* ── Set pending RL action ── */
  const setAction = useCallback((idx) => {
    dispatch({ type: 'SET_ACTION', idx })
  }, [])

  /* ── Auto-run: RAF-based, ~800 ms per step ── */
  const startAutoRun = useCallback(() => {
    autoRunRef.current = true
    const tick = async (ts) => {
      if (!autoRunRef.current) return
      if (ts - lastTickRef.current > 800) {
        lastTickRef.current = ts
        // Call step-like logic inline so it captures fresh state
        const { simulateStep } = await import('../data/mockData')
        const backendNext = await fetchRlStep(state.current, state.pendingAction)
        const next = backendNext ?? simulateStep(state.current, state.pendingAction)
        dispatch({ type: 'SET_STATE', payload: next })
      }
      if (autoRunRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [state.current, state.pendingAction])

  const stopAutoRun = useCallback(() => {
    autoRunRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  /* ── Cleanup ── */
  useEffect(() => () => stopAutoRun(), [stopAutoRun])

  /* ── Loan controls ── */
  const approveLoan = useCallback((id) => dispatch({ type: 'APPROVE_LOAN', id }), [])
  const rejectLoan  = useCallback((id) => dispatch({ type: 'REJECT_LOAN', id }), [])

  /* ── Reset ── */
  const reset = useCallback(() => {
    stopAutoRun()
    dispatch({ type: 'RESET' })
  }, [stopAutoRun])

  /* ── Derived data: merge live + mock ── */
  const wallet       = liveWallet       ?? mockWallet
  const transactions = liveTransactions ?? mockTransactions
  const bankerRiskMetrics = liveMetrics ?? mockBankerMetrics

  // Sync credit limit from live wallet into simulation state on first load
  useEffect(() => {
    if (liveWallet && state.current.step === 0) {
      const totalLimit = liveWallet.totalCreditLimit || liveWallet.availableCredit
      if (totalLimit && totalLimit !== state.current.creditLimit) {
        dispatch({
          type: 'SET_STATE',
          payload: {
            ...state.current,
            creditLimit:  Math.round(totalLimit),
            step:         0,
          },
        })
      }
    }
  }, [liveWallet]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    /* Simulation */
    current:       state.current,
    history:       state.history,
    pendingAction: state.pendingAction,
    step,
    setAction,
    startAutoRun,
    stopAutoRun,
    reset,
    /* Users */
    users: demoUsers,
    /* Wallet / transactions – live or mock */
    wallet,
    transactions,
    /* Banker */
    lendingOpportunities: state.lendingOpportunities,
    bankerRiskMetrics,
    approveLoan,
    rejectLoan,
    /* Backend connection status */
    backendReady,
    sessionInfo,
    liveWallet,
    liveTransactions,
    liveMetrics,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
