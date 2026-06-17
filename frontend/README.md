# AutoLend – Demo Frontend

A recruiter-ready, single-page demo of the **AutoLend** RL-powered dynamic credit limit system.
No login required. No backend needed. Everything runs in the browser.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173**.

## What You'll See

| Section | Description |
|---|---|
| **Hero** | Dark Coinbase-style hero explaining the product in ≤ 30 s |
| **Simulation Board** | RL environment — pick an action, click Step or Auto-Run |
| **User Dashboard** | Live credit card, wallet balance, and transaction list |
| **Banker Dashboard** | Portfolio risk metrics, lending queue with Approve/Reject |
| **Architecture Diagram** | SVG showing User ↔ Engine ↔ Kafka ↔ Banker data flow |
| **Export Snapshot** | Download current simulation state as JSON |
| **Recruiter Tour** | 5-step guided walkthrough via the Tour button |

## Tech Stack (Frontend)

- **React 18** + **Vite 5**
- **Recharts** for live charts (no backend required)
- **Vanilla CSS** with full Coinbase design-token system (`design-tokens.css`)
- **No auth**, **no n8n**, **no login screen**

## Architecture

See `DEMO.md` for a full description of the simulation engine, RL agent, and data flow.
