/**
 * SimulationBoard.jsx
 * Core demo UI: action slider, Step/AutoRun controls, live metrics, Recharts.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useDemo } from '../context/DemoContext'
import { actionLabels } from '../data/mockData'
import './SimulationBoard.css'

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">Step {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="chart-tooltip__item" style={{ color: p.color }}>
          {p.name}: <span className="num">{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ─── Metric card ─── */
function MetricCard({ label, value, unit = '', trend, flash }) {
  const isUp   = trend === 'up'
  const isDown = trend === 'down'
  return (
    <div className={`metric-card ${flash ? 'metric-card--flash' : ''}`}>
      <span className="metric-card__label">{label}</span>
      <span className={`metric-card__value num ${isUp ? 'up' : ''} ${isDown ? 'down' : ''}`}>
        {value}{unit}
      </span>
      {trend && (
        <span className={`metric-card__trend ${isUp ? 'up' : 'down'}`}>
          {isUp ? '↑' : '↓'}
        </span>
      )}
    </div>
  )
}

/* ─── SimulationBoard ─── */
/**
 * @param {{ sectionRef: React.RefObject<HTMLElement> }} props
 */
function SimulationBoard({ sectionRef }) {
  const { current, history, pendingAction, step, setAction, startAutoRun, stopAutoRun, reset } = useDemo()
  const [isRunning, setIsRunning]   = useState(false)
  const [flashCards, setFlashCards] = useState(false)
  const prevLimitRef = useRef(current.creditLimit)

  /* Flash cards on every new step */
  useEffect(() => {
    if (current.step === 0) return
    setFlashCards(true)
    const t = setTimeout(() => setFlashCards(false), 600)
    return () => clearTimeout(t)
  }, [current.step])

  /* Trend calculation */
  const prevStep = history[history.length - 2]
  const limitTrend = prevStep ? (current.creditLimit > prevStep.creditLimit ? 'up' : current.creditLimit < prevStep.creditLimit ? 'down' : undefined) : undefined
  const pdTrend    = prevStep ? (current.pd < prevStep.pd ? 'up' : current.pd > prevStep.pd ? 'down' : undefined) : undefined

  const handleToggleAuto = useCallback(() => {
    if (isRunning) {
      stopAutoRun()
      setIsRunning(false)
    } else {
      startAutoRun()
      setIsRunning(true)
    }
  }, [isRunning, startAutoRun, stopAutoRun])

  const handleStep = useCallback(() => {
    if (!isRunning) step()
  }, [isRunning, step])

  const handleReset = useCallback(() => {
    stopAutoRun()
    setIsRunning(false)
    reset()
  }, [stopAutoRun, reset])

  /* Chart data */
  const chartData = history.map(h => ({
    step:        h.step,
    limit:       h.creditLimit,
    utilization: +(h.utilization * 100).toFixed(1),
    pd:          +(h.pd * 100).toFixed(3),
    reward:      +h.reward,
    apr:         +h.apr,
  }))

  return (
    <section className="sim-board" id="simulation" ref={sectionRef}>
      <div className="container">
        {/* Section header */}
        <div className="sim-board__header">
          <div className="section-badge">Simulation Engine</div>
          <h2 className="sim-board__title">Live RL Simulation</h2>
          <p className="sim-board__sub">
            Each step runs the RL agent on a virtual credit environment.
            Watch credit limits, utilisation, probability of default, and reward evolve.
          </p>
        </div>

        {/* Controls */}
        <div className="sim-board__controls">
          {/* Action selector */}
          <div className="sim-board__action-select">
            <label className="sim-board__action-label" htmlFor="action-select">
              RL Action
            </label>
            <div className="action-pills" id="action-select" role="group" aria-label="Select RL action">
              {actionLabels.map((label, idx) => (
                <button
                  key={idx}
                  className={`action-pill ${pendingAction === idx ? 'action-pill--active' : ''}`}
                  onClick={() => setAction(idx)}
                  disabled={isRunning}
                  aria-pressed={pendingAction === idx}
                >
                  {idx === 0 ? '−' : idx === 1 ? '=' : `+${[10, 20, 30][idx - 2]}%`}
                </button>
              ))}
            </div>
            <span className="sim-board__action-desc">{actionLabels[pendingAction]}</span>
          </div>

          {/* Control buttons */}
          <div className="sim-board__btns">
            <button
              id="btn-step"
              className="btn-primary"
              onClick={handleStep}
              disabled={isRunning}
            >
              Step →
            </button>
            <button
              id="btn-auto"
              className={`btn-secondary ${isRunning ? 'btn-secondary--active' : ''}`}
              onClick={handleToggleAuto}
            >
              {isRunning ? '⏸ Pause' : '▶ Auto-Run'}
            </button>
            <button
              id="btn-reset"
              className="btn-ghost"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>

          {/* Step counter */}
          <div className="sim-board__step-counter">
            <span className="sim-board__step-label">Step</span>
            <span className="sim-board__step-num num">{current.step}</span>
          </div>
        </div>

        {/* Metric cards */}
        <div className="metric-grid">
          <MetricCard
            label="Credit Limit"
            value={`$${current.creditLimit.toLocaleString()}`}
            trend={limitTrend}
            flash={flashCards}
          />
          <MetricCard
            label="Utilization"
            value={(current.utilization * 100).toFixed(1)}
            unit="%"
            trend={undefined}
            flash={flashCards}
          />
          <MetricCard
            label="Prob. of Default"
            value={(current.pd * 100).toFixed(2)}
            unit="%"
            trend={pdTrend}
            flash={flashCards}
          />
          <MetricCard
            label="RL Reward"
            value={current.reward}
            trend={current.reward >= 0 ? 'up' : 'down'}
            flash={flashCards}
          />
          <MetricCard
            label="APR"
            value={current.apr}
            unit="%"
            flash={flashCards}
          />
          <MetricCard
            label="Action"
            value={['−20%', '±0%', '+10%', '+20%', '+30%'][current.action] ?? '—'}
            flash={flashCards}
          />
        </div>

        {/* Charts */}
        <div className="chart-grid">
          {/* Credit Limit over time */}
          <div className="chart-card">
            <h3 className="chart-card__title">Credit Limit</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--colors-hairline)" vertical={false} />
                <XAxis dataKey="step" tick={{ fontSize: 11, fill: 'var(--colors-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--colors-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="limit"
                  name="Limit ($)"
                  stroke="var(--colors-primary)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Utilization & PD */}
          <div className="chart-card">
            <h3 className="chart-card__title">Utilization & PD (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--colors-hairline)" vertical={false} />
                <XAxis dataKey="step" tick={{ fontSize: 11, fill: 'var(--colors-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--colors-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="utilization" name="Utilization %" stroke="#f4b000" strokeWidth={2} dot={false} animationDuration={500} />
                <Line type="monotone" dataKey="pd"          name="PD %"          stroke="var(--colors-semantic-down)" strokeWidth={2} dot={false} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Reward */}
          <div className="chart-card">
            <h3 className="chart-card__title">RL Reward</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--colors-hairline)" vertical={false} />
                <XAxis dataKey="step" tick={{ fontSize: 11, fill: 'var(--colors-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--colors-muted)' }} tickLine={false} axisLine={false} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="var(--colors-hairline)" />
                <Bar
                  dataKey="reward"
                  name="Reward"
                  fill="var(--colors-primary)"
                  radius={[2, 2, 0, 0]}
                  animationDuration={500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* APR */}
          <div className="chart-card">
            <h3 className="chart-card__title">APR (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--colors-hairline)" vertical={false} />
                <XAxis dataKey="step" tick={{ fontSize: 11, fill: 'var(--colors-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--colors-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={42} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="apr" name="APR %" stroke="var(--colors-semantic-up)" strokeWidth={2} dot={false} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SimulationBoard
