/**
 * DemoContext.jsx
 * Provides shared simulation state and hard-coded demo users to the entire app.
 * Uses useReducer for batched state updates (avoids chart lag).
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import {
  initialSimState,
  demoUsers,
  userWallet,
  transactions,
  lendingOpportunities,
  bankerRiskMetrics,
  simulateStep,
} from '../data/mockData'

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
    case 'STEP': {
      const next = simulateStep(state.current, action.actionIdx)
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
    current: initialSimState,
    history: [initialSimState],
    pendingAction: 1,           // default: keep stable
    lendingOpportunities: lendingOpportunities,
  }
}

/* ─────────── Provider ─────────── */
/**
 * DemoProvider wraps the app and provides simulation state + controls.
 * @param {{ children: React.ReactNode }} props
 */
export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialReducerState)
  const autoRunRef = useRef(false)
  const rafRef = useRef(null)
  const lastTickRef = useRef(0)

  /* Manual step */
  const step = useCallback(() => {
    dispatch({ type: 'STEP', actionIdx: state.pendingAction })
  }, [state.pendingAction])

  /* Set the pending RL action */
  const setAction = useCallback((idx) => {
    dispatch({ type: 'SET_ACTION', idx })
  }, [])

  /* Auto-run: RAF-based, ~800 ms per step */
  const startAutoRun = useCallback(() => {
    autoRunRef.current = true
    const tick = (ts) => {
      if (!autoRunRef.current) return
      if (ts - lastTickRef.current > 800) {
        lastTickRef.current = ts
        dispatch({ type: 'STEP', actionIdx: autoRunRef.current ? 1 : 1 })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopAutoRun = useCallback(() => {
    autoRunRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  /* Cleanup */
  useEffect(() => () => stopAutoRun(), [stopAutoRun])

  /* Loan controls */
  const approveLoan = useCallback((id) => dispatch({ type: 'APPROVE_LOAN', id }), [])
  const rejectLoan  = useCallback((id) => dispatch({ type: 'REJECT_LOAN', id }), [])

  /* Reset */
  const reset = useCallback(() => {
    stopAutoRun()
    dispatch({ type: 'RESET' })
  }, [stopAutoRun])

  const value = {
    /* Simulation */
    current:      state.current,
    history:      state.history,
    pendingAction: state.pendingAction,
    step,
    setAction,
    startAutoRun,
    stopAutoRun,
    reset,
    /* Users */
    users:        demoUsers,
    /* Wallet / transactions */
    wallet:       userWallet,
    transactions,
    /* Banker */
    lendingOpportunities: state.lendingOpportunities,
    bankerRiskMetrics,
    approveLoan,
    rejectLoan,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
