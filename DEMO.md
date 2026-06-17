# DEMO.md – AutoLend Architecture for Developers

## Overview

AutoLend is a fintech simulation platform that uses **Reinforcement Learning (PPO)** and a
**Cox Proportional Hazards survival model** to dynamically optimise credit limits in real time.

This document describes the demo-frontend architecture for developers and contributors.

---

## Component Tree

```
App.jsx
└── DemoProvider (context/DemoContext.jsx)
    └── Demo.jsx (pages/Demo.jsx)
        ├── RecruiterBanner
        ├── TopNav
        ├── HeroBand (components/HeroBand.jsx)
        ├── SimulationBoard (components/SimulationBoard.jsx)
        │   ├── Action pills (5 RL actions)
        │   ├── Step / Auto-Run / Reset controls
        │   ├── 6× MetricCard (credit limit, utilization, PD, reward, APR, action)
        │   └── 4× Recharts (LineChart × 3, BarChart × 1)
        ├── UserDashboard (components/UserDashboard.jsx)
        │   ├── Wallet balance card
        │   ├── Credit limit bar (live from simulation)
        │   └── Transaction list (asset-row pattern)
        ├── BankerDashboard (components/BankerDashboard.jsx)
        │   ├── Portfolio risk metrics
        │   ├── Live simulation tie-in card
        │   └── Lending opportunity rows (Approve / Reject)
        ├── ArchitectureDiagram (components/ArchitectureDiagram.jsx)
        │   ├── SVG diagram (User ↔ RL Engine ↔ Kafka ↔ Banker)
        │   └── 4× Feature cards
        ├── CTA band (export snapshot)
        ├── Footer
        └── TourOverlay (5-step guided tour)
```

---

## State Management

`DemoContext.jsx` uses `useReducer` (not `useState`) to batch all simulation updates,
preventing unnecessary chart re-renders:

| Action       | Effect                                           |
|--------------|--------------------------------------------------|
| `STEP`       | Runs `simulateStep()` → appends to history       |
| `SET_ACTION` | Updates the pending RL action index              |
| `APPROVE_LOAN` | Marks a lending opportunity as approved        |
| `REJECT_LOAN`  | Marks a lending opportunity as rejected        |
| `RESET`      | Restores the initial simulation state            |

Auto-run uses `requestAnimationFrame` capped at 800 ms intervals (not `setInterval`) to
avoid accumulating ticks when the tab is hidden.

---

## Simulation Model (`data/mockData.js`)

`simulateStep(prev, actionIdx)` is a **pure function** — no side effects, no API calls.

```
actionIdx 0 → credit limit × 0.80  (−20%)
actionIdx 1 → credit limit × 1.00  (±0%)
actionIdx 2 → credit limit × 1.10  (+10%)
actionIdx 3 → credit limit × 1.20  (+20%)
actionIdx 4 → credit limit × 1.30  (+30%)

PD  = f(utilization, creditLimit)  + Gaussian noise
APR = f(PD)
Reward = 0.6 × utilization − 4 × PD + 0.5 × actionMultiplier
```

---

## Design System

All visual tokens live in `src/design-tokens.css` and are derived directly from `DESIGN.md`
(Coinbase design system analysis). Every component uses `var(--token-name)` exclusively.
No hardcoded hex values in component CSS files.

---

## Adding Backend Integration

To connect a real Python/FastAPI simulation backend:

1. Replace `simulateStep()` in `mockData.js` with an async `fetch('/api/step', { method: 'POST', body: JSON.stringify({ action: actionIdx }) })`.
2. Update `DemoContext.jsx` `step` callback to `await` the API response.
3. The rest of the UI picks up changes automatically through context.

---

## n8n Removal

The `n8n` workflow agent has been removed per the plan. No `n8n` references remain in:
- `frontend/` (this directory)
- `docker-compose.yml` (n8n service was never added here)
- `package.json` scripts

---

*Generated from `plan.md` · AutoLend · HTW Hackathon 2026*
