/**
 * ArchitectureDiagram.jsx
 * SVG diagram visualising: User ↔ Simulation Engine ↔ Banker
 * All styling inline for self-containment.
 */
import React from 'react'
import './ArchitectureDiagram.css'

function ArchitectureDiagram() {
  return (
    <section className="arch-section" id="architecture">
      <div className="container">
        <div className="arch-section__header">
          <div className="section-badge">Architecture</div>
          <h2 className="arch-section__title">How AutoLend Works</h2>
          <p className="arch-section__sub">
            A reinforcement learning agent (PPO) observes the credit environment and
            selects an action. The Cox survival model provides the probability-of-default
            signal used by both the reward function and the banker dashboard.
          </p>
        </div>

        {/* SVG Diagram */}
        <div className="arch-diagram-wrap">
          <svg
            viewBox="0 0 900 340"
            xmlns="http://www.w3.org/2000/svg"
            className="arch-svg"
            aria-label="AutoLend system architecture diagram"
          >
            {/* Background boxes */}
            {/* USER NODE */}
            <rect x="30" y="110" width="160" height="100" rx="16" fill="#16181c" />
            <text x="110" y="148" textAnchor="middle" fill="#a8acb3" fontSize="11" fontFamily="Inter,sans-serif">CUSTOMER</text>
            <text x="110" y="168" textAnchor="middle" fill="#ffffff" fontSize="16" fontFamily="Inter,sans-serif" fontWeight="400">User</text>
            <text x="110" y="188" textAnchor="middle" fill="#0052ff" fontSize="11" fontFamily="Inter,sans-serif">Requests Credit</text>

            {/* ENV NODE */}
            <rect x="230" y="60" width="200" height="200" rx="16" fill="#0052ff" opacity="0.12" stroke="#0052ff" strokeWidth="1.5" />
            <text x="330" y="100" textAnchor="middle" fill="#0052ff" fontSize="11" fontFamily="Inter,sans-serif" fontWeight="600">CORE ENGINE</text>
            <text x="330" y="125" textAnchor="middle" fill="#0a0b0d" fontSize="15" fontFamily="Inter,sans-serif" fontWeight="400">RL Environment</text>

            {/* RL Agent sub-box */}
            <rect x="248" y="138" width="164" height="48" rx="10" fill="#0052ff" />
            <text x="330" y="157" textAnchor="middle" fill="#fff" fontSize="11" fontFamily="Inter,sans-serif" fontWeight="600">RL Agent (PPO)</text>
            <text x="330" y="174" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="10" fontFamily="Inter,sans-serif">{"Selects action: -20% to +30%"}</text>

            {/* Cox model */}
            <rect x="248" y="198" width="164" height="40" rx="10" fill="#eef0f3" />
            <text x="330" y="214" textAnchor="middle" fill="#0a0b0d" fontSize="11" fontFamily="Inter,sans-serif" fontWeight="600">Cox Survival Model</text>
            <text x="330" y="230" textAnchor="middle" fill="#5b616e" fontSize="10" fontFamily="Inter,sans-serif">Computes PD(t)</text>

            {/* BANKER NODE */}
            <rect x="710" y="110" width="160" height="100" rx="16" fill="#16181c" />
            <text x="790" y="148" textAnchor="middle" fill="#a8acb3" fontSize="11" fontFamily="Inter,sans-serif">LOAN OFFICER</text>
            <text x="790" y="168" textAnchor="middle" fill="#ffffff" fontSize="16" fontFamily="Inter,sans-serif" fontWeight="400">Banker</text>
            <text x="790" y="188" textAnchor="middle" fill="#05b169" fontSize="11" fontFamily="Inter,sans-serif">Reviews Risk / Approves</text>

            {/* KAFKA NODE */}
            <rect x="495" y="140" width="140" height="60" rx="12" fill="#f7f7f7" stroke="#dee1e6" strokeWidth="1" />
            <text x="565" y="163" textAnchor="middle" fill="#5b616e" fontSize="11" fontFamily="Inter,sans-serif" fontWeight="600">Event Bus</text>
            <text x="565" y="180" textAnchor="middle" fill="#7c828a" fontSize="10" fontFamily="Inter,sans-serif">Kafka / WebSocket</text>

            {/* Arrows */}
            {/* User → Env */}
            <line x1="192" y1="160" x2="228" y2="160" stroke="#0052ff" strokeWidth="1.5" markerEnd="url(#arrow-blue)" strokeDasharray="4 2" />
            <text x="210" y="152" textAnchor="middle" fill="#0052ff" fontSize="9" fontFamily="Inter,sans-serif">obs.</text>

            {/* Env → User */}
            <line x1="228" y1="170" x2="192" y2="170" stroke="#a8acb3" strokeWidth="1.5" markerEnd="url(#arrow-gray)" strokeDasharray="4 2" />
            <text x="210" y="183" textAnchor="middle" fill="#7c828a" fontSize="9" fontFamily="Inter,sans-serif">limit</text>

            {/* Env → Kafka */}
            <line x1="432" y1="165" x2="493" y2="165" stroke="#dee1e6" strokeWidth="1.5" markerEnd="url(#arrow-gray2)" />

            {/* Kafka → Banker */}
            <line x1="637" y1="165" x2="708" y2="165" stroke="#dee1e6" strokeWidth="1.5" markerEnd="url(#arrow-gray2)" />

            {/* Banker → Env (feedback) */}
            <path d="M790,110 C790,60 330,60 330,60" stroke="#05b169" strokeWidth="1" fill="none" strokeDasharray="3 3" markerEnd="url(#arrow-green)" />
            <text x="560" y="52" textAnchor="middle" fill="#05b169" fontSize="9" fontFamily="Inter,sans-serif">Policy feedback</text>

            {/* Reward label */}
            <text x="330" y="288" textAnchor="middle" fill="#0052ff" fontSize="10" fontFamily="Inter,sans-serif">Reward = f(utilization, PD, APR)</text>

            {/* Arrow markers */}
            <defs>
              <marker id="arrow-blue"  markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#0052ff" />
              </marker>
              <marker id="arrow-gray"  markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a8acb3" />
              </marker>
              <marker id="arrow-gray2" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#dee1e6" />
              </marker>
              <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#05b169" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Feature cards */}
        <div className="arch-features">
          {[
            { title: 'RL Agent (PPO)', body: 'Proximal Policy Optimisation learns to map credit states to limit-adjustment actions, maximising cumulative reward.' },
            { title: 'Cox Survival Model', body: 'Estimates time-to-default probability for every account, giving the RL reward function a risk-aware baseline.' },
            { title: 'Kafka Event Bus', body: 'Decouples the simulation engine from the dashboards. State updates stream in real time to both User and Banker views.' },
            { title: 'Dual Dashboards', body: 'User sees their live credit limit and utilization; Banker sees portfolio risk metrics and can approve or reject loans.' },
          ].map(f => (
            <div className="arch-feature-card" key={f.title}>
              <h3 className="arch-feature-card__title">{f.title}</h3>
              <p className="arch-feature-card__body">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ArchitectureDiagram
