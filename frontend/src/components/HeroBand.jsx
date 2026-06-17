/**
 * HeroBand.jsx
 * Full-bleed dark hero with headline, sub-headline, and "Start Demo" CTA.
 * Follows design.md hero-band-dark spec.
 */
import React, { useRef } from 'react'
import './HeroBand.css'

/**
 * @param {{ onStart: () => void }} props
 */
function HeroBand({ onStart }) {
  const heroRef = useRef(null)

  return (
    <section className="hero-band" ref={heroRef} aria-label="AutoLend hero">
      {/* Ambient dot-grid background */}
      <div className="hero-band__grid" aria-hidden="true" />

      {/* Floating accent orbs */}
      <div className="hero-band__orb hero-band__orb--1" aria-hidden="true" />
      <div className="hero-band__orb hero-band__orb--2" aria-hidden="true" />

      <div className="container hero-band__inner">
        {/* Badge */}
        <div className="hero-band__badge">
          <span className="hero-band__badge-dot" aria-hidden="true" />
          RL + Cox Survival Model · Live Simulation
        </div>

        {/* Headline */}
        <h1 className="hero-band__headline">
          Credit limits that<br />
          <span className="hero-band__accent">think for themselves.</span>
        </h1>

        {/* Sub-headline */}
        <p className="hero-band__sub">
          AutoLend uses reinforcement learning and survival analysis to
          dynamically optimise credit limits — maximising revenue while
          minimising default risk. In real time.
        </p>

        {/* CTAs */}
        <div className="hero-band__ctas">
          <button
            id="hero-start-demo"
            className="btn-pill-cta"
            onClick={onStart}
          >
            Start Demo
          </button>
          <button
            className="btn-outline-dark"
            onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See Architecture
          </button>
        </div>

        {/* Floating dashboard mockup */}
        <div className="hero-band__mockup" aria-hidden="true">
          <div className="mockup-card mockup-card--main">
            <div className="mockup-card__header">
              <span className="mockup-dot mockup-dot--g" />
              <span className="mockup-dot mockup-dot--y" />
              <span className="mockup-dot mockup-dot--r" />
              <span className="mockup-label">AutoLend · Live</span>
            </div>
            <div className="mockup-card__body">
              <div className="mockup-metric">
                <span className="mockup-metric__label">Credit Limit</span>
                <span className="mockup-metric__value">$5,000</span>
              </div>
              <div className="mockup-metric">
                <span className="mockup-metric__label">Utilization</span>
                <span className="mockup-metric__value up">42.0%</span>
              </div>
              <div className="mockup-metric">
                <span className="mockup-metric__label">Prob. of Default</span>
                <span className="mockup-metric__value down">3.5%</span>
              </div>
            </div>
            <div className="mockup-bar-row">
              <div className="mockup-bar" style={{ width: '42%', background: '#0052ff' }} />
            </div>
          </div>
          <div className="mockup-card mockup-card--secondary">
            <div className="mockup-chip">RL Agent</div>
            <div className="mockup-arrow">→ Increase +10%</div>
            <div className="mockup-reward">Reward: +0.14</div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-band__scroll-cue" aria-hidden="true">
        <div className="scroll-cue__line" />
      </div>
    </section>
  )
}

export default HeroBand
