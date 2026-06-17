# Project Demo & Frontend Revamp Plan

**Version:** alpha (auto‑generated on 2026‑06‑17)

---

## 1️⃣ Overall Goals

| # | Goal | Success Metric |
|---|------|----------------|
| 1 | **Show the whole project** in a premium, demo‑ready UI that instantly tells a visitor what the app does. | Visitor can understand the product in ≤ 30 seconds, with no confusion. |
| 2 | **Simulate the virtual credit‑limit environment** (the RL + Cox model) in the UI, with live‑updating charts/animations. | Demo runs end‑to‑end without backend errors and displays key metrics (credit limit, utilization, PD, reward) in real time. |
| 3 | **Remove the n8n agent** completely. | No `n8n` files or references remain; `package.json` scripts, Docker compose, and CI no longer mention it. |
| 4 | **Follow `design.md`** (Coinbase‑style system). | All colors, typography, spacing, components, and responsive breakpoints match the tokens in `design.md`. |
| 5 | **Create a recruiter‑friendly showcase** with animations, diagrams, and interactive simulation. | A short video walkthrough (≤ 2 min) can be recorded directly from the page; all interactions are intuitive. |
| 6 | **Drop the login system** – hard‑code a demo user & banker, present both roles on the same page. | No login UI appears; the demo shows two side‑by‑side dashboards (User & Banker) that synchronize with the same simulation. |

---

## 2️⃣ High‑Level Architecture (Frontend)

```
src/
├─ components/
│   ├─ HeroBand.jsx          ← dark/light hero band (design.md)
│   ├─ SimulationBoard.jsx   ← core demo UI (charts, controls)
│   ├─ UserDashboard.jsx     ← user‑view (wallet, transactions)
│   ├─ BankerDashboard.jsx   ← banker‑view (lending, risk)
│   ├─ Chart/
│   │   ├─ LineChart.jsx     ← Recharts line chart (util, PD)
│   │   └─ BarChart.jsx      ← Recharts bar chart (reward, APR)
│   └─ common/…              ← reusable UI (buttons, cards, badges)
├─ context/
│   └─ DemoContext.jsx       ← holds simulation state, hard‑coded users
├─ data/
│   └─ mockData.js           ← used for initial UI content
├─ pages/
│   ├─ Demo.jsx              ← **single entry point** (no routing)
│   └─ … (old pages can be removed)
└─ App.jsx                    ← only renders <Demo />
```

*All new components must use the token‑based CSS‑in‑JS (or plain CSS) defined in `design.md`.*

---

## 3️⃣ Detailed Tasks

### 3.1 Remove the n8n agent
| Sub‑task | Action |
|----------|--------|
| 3.1.1 | Delete any `frontend/src/n8n*` and `backend/n8n*` directories (keep the rest of the repo untouched). |
| 3.1.2 | Remove `n8n` entries from `docker-compose.yml` and any npm scripts (`"n8n:*"`). |
| 3.1.3 | Search the repo for the string `n8n` and delete remaining references (`grep -R "n8n"`). |
| 3.1.4 | Update README/PROJECT docs to note “n8n removed – demo runs locally”. |

### 3.2 Drop the login system
| Sub‑task | Action |
|----------|--------|
| 3.2.1 | Delete `src/pages/Login.jsx` and the `<Route path="/login" …>` entry in `App.jsx`. |
| 3.2.2 | In `src/context/DemoContext.jsx`, hard‑code two demo users: ```js const demoUsers = { user: {id:"demo_user"}, banker:{id:"demo_banker"} }; ``` |
| 3.2.3 | Expose the simulation state via React Context so both dashboards read the same data. |
| 3.2.4 | Remove any auth‑related dependencies (`jwt`, `axios` interceptors). |

### 3.3 Build the “Demo” page (single‑page app)
1. **Hero Section** – use `hero-band-dark` from `design.md`. Include headline, sub‑headline, and a primary pill CTA “Start Demo”.
2. **Simulation Board** (`SimulationBoard.jsx`) – controls (action slider, *Step* button, *Auto‑Run* toggle), live metrics, Recharts line & bar charts, smooth animation.
3. **User Dashboard** (`UserDashboard.jsx`) – wallet balance, transaction list, credit‑limit card (uses `asset-row`, `price‑up‑cell` / `price‑down‑cell`).
4. **Banker Dashboard** (`BankerDashboard.jsx`) – lending opportunities, risk metrics, mock “Approve/Reject” control.
5. **Layout** – two‑column grid on desktop, stacked on mobile; respect spacing tokens (`spacing.section`, `spacing.xl`).

### 3.4 UI Styling – Follow `design.md`
| Design Token | Where It Is Applied |
|--------------|---------------------|
| `colors.primary` & `button-primary` | Main CTA (“Start Demo”, “Step”, “Auto‑Run”). |
| `hero-band-dark` / `hero-band-light` | Hero section (dark for demo). |
| `rounded.pill` | All buttons, search pill, badge pills. |
| `rounded.xl` | Cards (`product‑ui‑card‑dark`, `feature‑card`). |
| `typography.display-mega` | Hero headline. |
| `typography.title-lg` / `title-md` | Section headings. |
| `typography.body-md` | Body copy, tooltip text. |
| `spacing.section` (96 px) | Vertical padding between major sections. |
| `spacing.xl` (32 px) | Internal card padding. |
| `colors.semantic‑up/down` | Price‑change cells (green/red). |
| Responsive breakpoints | Collapse to single column on mobile, hide side‑by‑side banker‑user view into tabs. |

All CSS should reference the tokens via custom properties, e.g. `background: var(--colors-primary);`.

### 3.5 Animation & Interaction
| Element | Animation |
|---------|-----------|
| **Hero CTA** | Scale‑up on hover (`transform: scale(1.05)`), subtle shadow. |
| **Simulation step** | Flash metric cards (background `rgba(0,82,255,0.1)`). |
| **Charts** | Recharts `animationDuration={500}` for line growth. |
| **Auto‑Run** | `requestAnimationFrame` stepping every 800 ms; pause on hover. |
| **Dashboard cards** | Fade‑in on mount, slide‑up when new data arrives (`transition: transform 0.4s`). |
| **Recruiter tour** | Top‑right “Tour” button triggers a guided tooltip sequence (use `react‑joyride` or custom overlay). |

All animations respect the `prefers-reduced-motion` media query.

### 3.6 Recruiter‑Focused Showcase
1. Sticky banner “Demo for Recruiters – Click to explore”.
2. Guided tour steps: Hero → Simulation Board → User Dashboard → Banker Dashboard.
3. Embed an SVG diagram (generated via `generate_image`) visualising data flow: `User ↔ Simulation ↔ Banker`.
4. Export button to download current simulation snapshot as JSON.

### 3.7 Code Clean‑up & Documentation
| Sub‑task | Action |
|----------|--------|
| 3.7.1 | Update `README.md` with new demo launch instructions (`npm install && npm run dev`). |
| 3.7.2 | Add a **`DEMO.md`** (or extend `plan.md`) that explains the architecture for future developers. |
| 3.7.3 | Ensure every component has a JSDoc comment describing props and behavior. |
| 3.7.4 | Run ESLint/Prettier to keep code style consistent. |
| 3.7.5 | Add a `scripts/clean.sh` that deletes the `n8n` folder and any unused pages. |

---

## 4️⃣ Milestones & Timeline
| Milestone | Scope | Estimated Time |
|-----------|-------|----------------|
| **M1 – Clean up** | Remove n8n, delete login pages, purge auth code. | 2 h |
| **M2 – Context & Mock Data** | Create `DemoContext`, hard‑code users, ensure data flow works. | 3 h |
| **M3 – UI Skeleton** | Build Hero, SimulationBoard, UserDashboard, BankerDashboard (static layout). | 5 h |
| **M4 – Styling** | Apply design tokens from `design.md`, verify responsive breakpoints. | 4 h |
| **M5 – Charts & Animation** | Integrate Recharts, add step/auto‑run logic, animation polish. | 4 h |
| **M6 – Recruiter Tour & Diagram** | Add guided tour, generate SVG diagram (`generate_image`). | 3 h |
| **M7 – Testing & Docs** | Manual demo run, fix bugs, update README/DEMO.md. | 3 h |
| **Total** | **≈ 24 hours** (≈ 3 working days). |

---

## 5️⃣ Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Backend‑API mismatch** – the simulation code may expect a live server. | Demo could crash. | Use the existing `environment.py` as a local Node‑Python bridge (via `child_process`) *or* mock the endpoint with a small Express stub that returns the same JSON structure. |
| **Design token drift** – CSS may diverge from `design.md`. | Visual inconsistency. | Create a `design-tokens.css` file that loads all tokens as custom properties, import it everywhere, and lint for unused tokens. |
| **Performance on auto‑run** – many chart updates could lag. | Poor UX. | Throttle chart updates to 1 fps; batch state updates with `useReducer`. |
| **Recruiter tour confusion** – too many steps. | Users drop off. | Keep the tour to ≤ 5 concise steps; make it optional. |

---

## 6️⃣ Next Steps (Immediate Action)
1. **Delete the n8n folder** (`frontend/src/n8n*`, `backend/n8n*`).  *(Will be done in a new branch, original files stay untouched.)*
2. **Remove login routes & pages** (`src/pages/Login.jsx`, `<Route path="/login">`).
3. **Create `src/context/DemoContext.jsx`** with hard‑coded users and a simple `useReducer` to hold simulation state.
4. **Add a placeholder `Demo.jsx` page** that renders `<HeroBand />` + `<SimulationBoard />` + `<UserDashboard />` + `<BankerDashboard />`.

*Once those foundations are in place, we can iterate on styling and the simulation interaction.*

---

*This plan is saved as `plan.md` at the repo root.*
