/**
 * Demo.jsx
 * Single-entry-point page. No routing.
 * Renders: TopNav → HeroBand → SimulationBoard → DualDashboards → ArchitectureDiagram → Footer
 */
import React, { useRef, useState, useCallback } from 'react'
import HeroBand from '../components/HeroBand'
import SimulationBoard from '../components/SimulationBoard'
import UserDashboard from '../components/UserDashboard'
import BankerDashboard from '../components/BankerDashboard'
import ArchitectureDiagram from '../components/ArchitectureDiagram'
import { useDemo } from '../context/DemoContext'
import './Demo.css'

/* ─── Top nav ─── */
function TopNav({ onTour }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { current } = useDemo()

  return (
    <nav className="top-nav" role="navigation" aria-label="Main navigation">
      <div className="container top-nav__inner">
        {/* Logo */}
        <a href="#" className="top-nav__logo" aria-label="AutoLend home">
          <span className="top-nav__logo-mark" aria-hidden="true">⬡</span>
          AutoLend
        </a>

        {/* Desktop links */}
        <ul className="top-nav__links" role="list">
          <li><a href="#simulation" className="top-nav__link">Simulation</a></li>
          <li><a href="#dashboards"  className="top-nav__link">Dashboards</a></li>
          <li><a href="#architecture" className="top-nav__link">Architecture</a></li>
        </ul>

        {/* Live indicator */}
        <div className="top-nav__live" aria-live="polite">
          <span className="live-dot" aria-hidden="true" />
          Step <span className="num">{current.step}</span>
        </div>

        {/* Tour button */}
        <button
          id="btn-tour"
          className="top-nav__tour-btn"
          onClick={onTour}
          aria-label="Start recruiter guided tour"
        >
          Tour ↗
        </button>

        {/* Mobile hamburger */}
        <button
          className="top-nav__hamburger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="top-nav__mobile-menu">
          <a href="#simulation"   onClick={() => setMenuOpen(false)}>Simulation</a>
          <a href="#dashboards"   onClick={() => setMenuOpen(false)}>Dashboards</a>
          <a href="#architecture" onClick={() => setMenuOpen(false)}>Architecture</a>
        </div>
      )}
    </nav>
  )
}

/* ─── Recruiter sticky banner ─── */
function RecruiterBanner({ onTour }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="recruiter-banner" role="banner">
      <span className="recruiter-banner__text">
        🎯 <strong>Demo for Recruiters</strong> — Click Tour to see a guided walkthrough
      </span>
      <button className="recruiter-banner__cta" onClick={onTour}>Start Tour</button>
      <button className="recruiter-banner__close" onClick={() => setDismissed(true)} aria-label="Dismiss banner">✕</button>
    </div>
  )
}

/* ─── Guided tour overlay ─── */
const TOUR_STEPS = [
  { target: '#hero-start-demo',  title: 'Start Here', body: 'Click "Start Demo" to scroll to the simulation engine. Hit Auto-Run to watch the RL agent in action.' },
  { target: '#simulation',       title: 'Simulation Engine', body: 'The RL agent (PPO) picks an action every step. Watch credit limits, utilization, PD, and reward evolve in real time.' },
  { target: '#dashboards',       title: 'Dual Dashboards', body: 'Left: the customer\'s live credit card. Right: the banker\'s risk portfolio and lending queue — both driven by the same simulation.' },
  { target: '#architecture',     title: 'Architecture', body: 'The SVG diagram shows how the RL environment, Kafka event bus, and dual dashboards connect end-to-end.' },
  { target: '#btn-export',       title: 'Export Snapshot', body: 'Download the current simulation state as JSON for offline analysis or portfolio presentation.' },
]

function TourOverlay({ step, onNext, onClose }) {
  if (step === null || step >= TOUR_STEPS.length) return null
  const { title, body } = TOUR_STEPS[step]
  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label={`Tour step ${step + 1}: ${title}`}>
      <div className="tour-card">
        <div className="tour-card__progress">
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={`tour-dot ${i === step ? 'tour-dot--active' : ''} ${i < step ? 'tour-dot--done' : ''}`} />
          ))}
        </div>
        <h3 className="tour-card__title">{title}</h3>
        <p className="tour-card__body">{body}</p>
        <div className="tour-card__actions">
          <button className="btn-primary" onClick={onNext}>
            {step < TOUR_STEPS.length - 1 ? 'Next →' : 'Finish'}
          </button>
          <button className="btn-ghost" onClick={onClose}>Skip tour</button>
        </div>
      </div>
      <div className="tour-backdrop" onClick={onClose} />
    </div>
  )
}

/* ─── Export snapshot ─── */
function exportSnapshot(current, history) {
  const data = { exportedAt: new Date().toISOString(), current, history }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `autolend-snapshot-step-${current.step}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/* ─── Demo page ─── */
function Demo() {
  const simRef   = useRef(null)
  const { current, history } = useDemo()
  const [tourStep, setTourStep] = useState(null)

  const handleStart = useCallback(() => {
    document.getElementById('simulation')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const startTour = useCallback(() => {
    setTourStep(0)
  }, [])

  const nextTourStep = useCallback(() => {
    setTourStep(prev => {
      const next = prev + 1
      if (next < TOUR_STEPS.length) {
        const target = document.querySelector(TOUR_STEPS[next].target)
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return next < TOUR_STEPS.length ? next : null
    })
  }, [])

  return (
    <>
      <RecruiterBanner onTour={startTour} />
      <TopNav onTour={startTour} />

      <main id="main-content">
        <HeroBand onStart={handleStart} />

        <SimulationBoard sectionRef={simRef} />

        {/* Dual dashboards section */}
        <section className="dashboards-section" id="dashboards">
          <div className="container">
            <div className="dashboards-section__header">
              <div className="section-badge">Dual View</div>
              <h2 className="dashboards-section__title">Two Perspectives, One Simulation</h2>
              <p className="dashboards-section__sub">
                The same RL state powers both the customer's credit card view and the
                banker's risk-management dashboard. No backend required — everything runs in-browser.
              </p>
            </div>
            <div className="dashboards-grid">
              <div className="dashboard-pane">
                <div className="dashboard-pane__label">
                  <span className="dashboard-pane__dot dashboard-pane__dot--user" />
                  Customer View
                </div>
                <UserDashboard />
              </div>
              <div className="dashboard-pane">
                <div className="dashboard-pane__label">
                  <span className="dashboard-pane__dot dashboard-pane__dot--banker" />
                  Banker View
                </div>
                <BankerDashboard />
              </div>
            </div>
          </div>
        </section>

        <ArchitectureDiagram />

        {/* CTA band */}
        <section className="cta-band">
          <div className="container cta-band__inner">
            <h2 className="cta-band__title">Ready to run it yourself?</h2>
            <p className="cta-band__sub">Clone the repo and start the demo with a single command.</p>
            <div className="cta-band__code">
              <code>git clone https://github.com/your-org/autolend &amp;&amp; cd autolend/frontend &amp;&amp; npm i &amp;&amp; npm run dev</code>
            </div>
            <div className="cta-band__actions">
              <button
                id="btn-export"
                className="btn-pill-cta"
                onClick={() => exportSnapshot(current, history)}
              >
                Export Snapshot ↓
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <span className="site-footer__logo">⬡ AutoLend</span>
          <span className="site-footer__copy">
            Built for HTW Hackathon 2026 · RL + Cox Survival Model · No backend required
          </span>
          <span className="site-footer__legal muted">Demo data only. Not financial advice.</span>
        </div>
      </footer>

      {/* Tour */}
      <TourOverlay
        step={tourStep}
        onNext={nextTourStep}
        onClose={() => setTourStep(null)}
      />
    </>
  )
}

export default Demo
