# AutoLend — Complete Project Explanation

> Written for someone new to both **fintech** (financial technology) and **reinforcement learning** (RL).
> No assumed knowledge. Every concept is explained from scratch.

---

## Table of Contents

1. [What problem does this project solve?](#1-what-problem-does-this-project-solve)
2. [Key fintech concepts you need to know](#2-key-fintech-concepts-you-need-to-know)
3. [Key AI concepts you need to know](#3-key-ai-concepts-you-need-to-know)
4. [The big picture — how everything fits together](#4-the-big-picture--how-everything-fits-together)
5. [The AI brain — Reinforcement Learning agent (DQN)](#5-the-ai-brain--reinforcement-learning-agent-dqn)
6. [The risk sensor — Cox Survival Model](#6-the-risk-sensor--cox-survival-model)
7. [The simulation world — Credit Limit Environment](#7-the-simulation-world--credit-limit-environment)
8. [The banking backend — Spring Boot Java server](#8-the-banking-backend--spring-boot-java-server)
9. [The real-time pipeline — Kafka event streaming](#9-the-real-time-pipeline--kafka-event-streaming)
10. [The demo frontend — React single-page app](#10-the-demo-frontend--react-single-page-app)
11. [What each trained model file contains](#11-what-each-trained-model-file-contains)
12. [End-to-end story: one credit decision](#12-end-to-end-story-one-credit-decision)
13. [Why this matters — recruiter summary](#13-why-this-matters--recruiter-summary)

---

## 1. What problem does this project solve?

### The everyday problem

Imagine you have a **credit card**. It has a limit — say $5,000. That means you can spend up to $5,000 on credit, and pay it back later.

Now imagine you are the **bank** that issued that card. You face a constant trade-off:

| If you set the limit **too low** | If you set the limit **too high** |
|---|---|
| Customers can't spend much | Customers can spend a lot |
| You earn less in interest | You earn more in interest |
| Low risk of the customer not paying back | High risk of the customer defaulting (not paying back at all) |

Banks traditionally set credit limits **once** at account opening and barely change them. That is like setting a thermostat in January and never touching it again — the room will be too cold in summer and too hot in winter.

### AutoLend's answer

AutoLend replaces that static rule with a **dynamic, AI-driven system** that:

1. Watches each customer's behavior every month (spending, repayments, balance)
2. Asks: *"Given everything I know right now, what credit limit would make the bank the most money while keeping the risk of default acceptably low?"*
3. Adjusts the limit accordingly — in real time

The AI does this using **Reinforcement Learning** — a branch of machine learning inspired by how humans and animals learn through trial and error.

---

## 2. Key fintech concepts you need to know

### Credit limit
The maximum amount a customer can owe on their credit card at any moment. If your limit is $5,000 and you have spent $4,800, you only have $200 left to spend.

### Utilization ratio
```
Utilization = Balance / Credit Limit
```
Example: balance $2,100 / limit $5,000 = **42% utilization**.
- Low utilization: customer is not maxing out their card, lower risk
- Very high utilization (>80%): financial stress signal, higher risk

### Probability of Default (PD)
The **chance that a customer will stop paying back** what they owe. A PD of 3.5% means: "out of 100 similar customers, roughly 3 or 4 will fail to pay us back."

### APR (Annual Percentage Rate)
The yearly interest rate charged on outstanding balance. If your APR is 18% and you carry a $1,000 balance for a year, you owe the bank $180 in interest. This is the bank's **revenue source**.

### Default
When a customer stops making payments and the bank cannot recover the money. This is the bank's **biggest cost**.

### Recovery Rate (RR)
If someone defaults, banks can sometimes recover part of the money (e.g., through debt collection agencies). In AutoLend:
```
RR = max(0, 1 - log(creditLimit + 1) / 20)
```
Bigger limits lead to a lower recovery rate because bigger debts are harder to recover.

### DPD (Days Past Due)
How many days overdue a payment is. DPD = 0 means the customer is current. DPD > 30 is a serious warning sign.

### Double-entry ledger
The gold standard of accounting. Every financial transaction creates **two** entries: a debit in one account and a credit in another. This ensures money is never created or destroyed — it only moves. AutoLend's backend uses this to keep a perfect, legally compliant audit trail.

---

## 3. Key AI concepts you need to know

### Machine learning
A computer program that **learns patterns from data** instead of following hand-written rules.

### Reinforcement learning (RL)
A specific type of machine learning where an **agent** learns by interacting with an **environment**:

```
+--------------------------------------------------+
|                                                  |
|  Agent --- picks an action ---> Environment      |
|    ^                                  |          |
|    |                                  |          |
|    +---- receives reward + new state <+          |
|                                                  |
+--------------------------------------------------+
```

Think of a **video game character** that starts knowing nothing. It tries random moves, dies a lot, but slowly learns which moves get high scores. RL is the same idea applied to credit limits:

- **Agent** = the AI making credit-limit decisions
- **Environment** = a simulation of a customer's financial life
- **Action** = "increase limit by 10%", "keep it the same", "increase by 30%", etc.
- **Reward** = a score reflecting how profitable and safe the decision was
- **State** = the agent's view of the customer right now (utilization, PD, etc.)

### Q-values
The agent's internal score for every (state, action) pair. "If I am in *this* situation and take *this* action, how much total reward do I expect to get over time?" The agent always picks the action with the highest Q-value.

### DQN (Deep Q-Network)
Instead of storing Q-values in a giant table (which would need millions of rows), a **neural network** learns to predict them from the state. "Deep" means the network has multiple layers.

### Double DQN
A smarter version of DQN that uses **two separate networks** to avoid overestimating Q-values:
- **Policy network** — the network that is actively learning and picking actions
- **Target network** — a frozen copy used to calculate stable learning targets

### Dueling architecture
Inside the DQN, the network splits into two streams:
- **Value stream** — answers "how good is this situation in general?"
- **Advantage stream** — answers "how much better is action A compared to other actions?"

These two streams are combined into the final Q-value. This helps the agent learn faster because it can understand "this state is good" even before it knows which action is best.

### Epsilon-greedy exploration
Early in training, the agent explores randomly (epsilon = 1.0 = 100% random). Over time, epsilon decays to 5%. The agent mostly exploits what it has learned, but still tries new things 5% of the time to avoid getting stuck.

### Replay buffer
A memory bank of past experiences `(state, action, reward, next_state)`. During training, the agent randomly samples from this buffer (up to 100,000 stored transitions) and learns from mixed old and new experiences. This prevents the agent from "forgetting" old lessons.

### Survival analysis
A statistical technique from medicine originally used to ask "how long will a patient survive before dying?" AutoLend uses it to ask "how long will a customer survive before defaulting?"

---

## 4. The big picture — how everything fits together

```
+-----------------------------------------------------------------------+
|                         AUTOLEND SYSTEM                               |
|                                                                       |
|  +----------+     REST API     +------------------------------+       |
|  |  React   |<--------------->|  Spring Boot Backend (Java)  |       |
|  | Frontend |                 |  Port 8081                   |       |
|  +----------+                 +-------------+----------------+       |
|                                             |                         |
|                                     HTTP call to AI                   |
|                                             |                         |
|                              +-------------v----------------+         |
|                              |  Python AI Service (FastAPI) |         |
|                              |  Port 8000                   |         |
|                              |                              |         |
|                              |  +----------+ +-----------+  |         |
|                              |  | DQN Agent| | Cox Model |  |         |
|                              |  | (PyTorch)| |(lifelines)|  |         |
|                              |  +----+-----+ +-----+-----+  |         |
|                              |       |              |        |         |
|                              |  +----v--------------v-----+  |         |
|                              |  | Credit Limit Environment |  |         |
|                              |  | (Simulation World)       |  |         |
|                              |  +--------------------------+  |         |
|                              +------------------------------+         |
|                                                                       |
|  +----------+   +---------+   +------------------------------+        |
|  |PostgreSQL|   |  Redis  |   |  Apache Kafka (Event Bus)   |        |
|  |(database)|   | (cache) |   |  4 topics: transactions,    |        |
|  +----------+   +---------+   |  assets, users, notifs      |        |
|                                +------------------------------+        |
+-----------------------------------------------------------------------+
```

---

## 5. The AI brain — Reinforcement Learning agent (DQN)

**File:** `backend/ai_service/core/dqn_agent.py`
**Trained model saved as:** `models/rl_policy.pt`

### What does the agent see? (State — 5 numbers)

Every month, the agent receives a snapshot of the customer's situation as 5 numbers:

```python
state = [
  pd_t,           # Probability of default RIGHT NOW (e.g. 0.035 = 3.5%)
  utilization,    # How much of their limit they have used (0.0 to 1.5)
  util_trend_3m,  # Is utilization going up or down over 3 months?
  limit/max_limit, # Current limit as fraction of the $20,000 maximum
  cumulative_pd   # Total default risk accumulated over the customer's lifetime
]
```

Think of it as a doctor's chart: these 5 vital signs tell the AI everything it needs to make a decision.

### What can the agent do? (Action space — 10 choices)

The agent picks one of 10 actions, each a different limit multiplier:

| Action # | Multiplier | Effect on a $5,000 limit |
|---|---|---|
| 0 | x1.00 | No change — stays $5,000 |
| 1 | x1.04 | Small increase — $5,200 |
| 2 | x1.09 | $5,450 |
| 3 | x1.13 | $5,650 |
| 4 | x1.17 | $5,850 |
| 5 | x1.22 | $6,100 |
| 6 | x1.26 | $6,300 |
| 7 | x1.30 | $6,500 |
| 8 | x1.35 | $6,750 |
| 9 | x1.40 | Large increase — $7,000 |

Note: limits can only increase in the trained RL policy. The demo frontend adds decrease actions for visualization purposes.

### What score does it get? (Reward function)

This is the heart of the whole system. The reward tells the agent whether its decision was good or bad.

```
Revenue = CreditLimit x Utilization x (1 - PD) x APR_monthly
Loss    = CreditLimit x Utilization x PD x (1 - RecoveryRate)

Raw Reward   = Revenue - Loss
Final Reward = tanh(Raw Reward / 2000)   <- squishes to range [-1, +1]
```

In plain English:
- Revenue = how much interest the bank earns if the customer pays back
- Loss = how much the bank loses if the customer defaults
- A good decision (high utilization, low PD) = positive reward
- A bad decision where the customer defaults = reward of **-1.0** (maximum penalty, episode ends)

### How does it learn? (Double DQN update)

After every step, the agent stores the experience `(state, action, reward, next_state)` in its replay buffer. During training:

1. Sample 64 random experiences from the buffer
2. For each experience, ask: *"What Q-value does the policy network predict for the action we actually took?"*
3. Compare it to the **target**: `reward + 0.99 x Q(next_state, best_action_from_target_net)`
4. The difference is the **loss** — how wrong the prediction was
5. Backpropagate the loss through the neural network to improve the weights
6. Slowly copy policy network weights into target network (soft update with tau = 0.005)

The neural network architecture:

```
Input (5 numbers)
      |
  FC Layer (128 neurons) + ReLU activation
      |
  FC Layer (128 neurons) + ReLU activation
      |           |
  Value Head   Advantage Head
  (1 output)   (10 outputs, one per action)
      |           |
  Q(s,a) = Value + (Advantage - mean(Advantage))
            -> 10 Q-values, one per action
```

---

## 6. The risk sensor — Cox Survival Model

**File:** `backend/ai_service/core/cox_model.py`
**Trained model saved as:** `models/cox_model.pkl`

### What is it?

The Cox Proportional Hazards model was invented in 1972 by statistician David Cox to study **patient survival** in clinical trials. AutoLend borrows it to study **customer survival** — how long before they default.

### The formula (translated)

```
h(t|X) = h0(t) x exp(B1*util_avg_3m + B2*payment_ratio + B3*dpd_status + B4*macro_unemployment)
```

- `h(t|X)` = the **hazard rate** (instantaneous default risk at month t)
- `h0(t)` = the **baseline hazard** — default risk for a perfectly average customer
- The `exp(...)` part = a **multiplier** that makes risk go up or down based on the customer's data

The four risk factors:

| Factor | What it measures | Effect on default risk |
|---|---|---|
| `utilization_avg_3m` | 3-month average of balance/limit | Higher = more risk |
| `payment_ratio` | This month's repayments / last month's balance | Higher = less risk |
| `dpd_status` | Binary: did they miss a payment? (1=yes, 0=no) | Missed payment = much more risk |
| `macro_unemployment` | Economy-wide unemployment rate | Higher = more risk |

### How is it trained?

It is trained on **synthetic data** — 10,000 simulated customers, each running for up to 24 "months." For each customer, each month is one row in the dataset. The model learns the relationship between those 4 factors and when customers actually defaulted.

### What does the RL agent do with it?

Every month in the simulation, the environment feeds the customer's current data into the Cox model, which returns a **hazard rate** (the PD). This number goes directly into the RL state vector and the reward calculation. Without Cox, the agent would be flying blind.

---

## 7. The simulation world — Credit Limit Environment

**File:** `backend/ai_service/core/environment.py`

This is the "game world" where the RL agent trains. Since real bank data is not available for training, the environment **simulates millions of virtual customers**.

### The episode lifecycle

Each "episode" = one virtual customer's life (up to 24 months):

```
Month 0: Customer starts with $5,000 limit, random starting balance
         |
Month 1: Agent picks an action (e.g. increase limit to $5,450)
         |
         Environment simulates what the customer does:
           - Spends some money (random, based on customer type)
           - Makes a payment (mostly full if "good", partial if "risky")
         |
         Cox model calculates new PD
         |
         Reward is calculated
         |
         New state is returned to agent
         |
Month 2 -> ... -> Month 24 (or default, whichever comes first)
```

### The two customer types (hidden state)

The environment secretly assigns each virtual customer a type at the start:

| Type | Probability | Spending | Payments |
|---|---|---|---|
| "Good" | 70% | ~$1,000/month | Pays 95-100% of balance |
| "Risky" | 30% | ~$1,500/month (more variable) | Pays only 0-60% of balance |

The agent **cannot directly see** the customer type — it must infer it from state signals (utilization trend, payment ratio, PD). This is what makes the problem realistic.

### Default condition

If a customer's balance exceeds **150% of their credit limit**, they are declared in default:
- The episode ends immediately
- The agent receives a reward of **-1.0** (maximum punishment)

### What the data pipeline adds

**File:** `backend/ai_service/core/data_pipeline.py`

The data pipeline computes derived features needed by the Cox model:

- **Utilization trend (3-month):** Uses linear regression on the last 3 months of utilization to calculate whether spending is accelerating or decelerating
- **Macro unemployment:** `5.0 + 2.0 x sin(2*pi*t/60) + noise` — a sine wave simulating realistic economic cycles (roughly a 5-year boom-bust pattern)

---

## 8. The banking backend — Spring Boot Java server

**Port:** 8081

This is the real-world banking system that would go live in production. It handles:

### User accounts and authentication

Every user and banker logs in with a **JWT (JSON Web Token)** — a digitally signed ticket that proves who you are. The token expires after a set time, and every API call must include it.

### The double-entry ledger

When you buy something on credit, the backend does not just subtract a number. It:

1. Creates a **DEBIT** entry in your `AVAILABLE_CREDITS` account
2. Creates a **CREDIT** entry in a `LOCKED_CREDITS` account
3. When the merchant confirms the payment, moves it to the `EXTERNAL` account

This creates an **immutable audit trail** — every dollar is accounted for, forever. This is required by financial regulations.

### Credit limit as a live service

The `RiskScoreService` calculates your credit limit dynamically:

```java
baseLimit = max(1000, walletBalance * 0.5)
riskMultiplier = 1.0 + (1.0 - riskScore) * 2    // range: 1x to 3x
creditLimit = baseLimit * riskMultiplier
```

The risk score is cached in **Redis** for 15 minutes so the bank does not call the expensive AI service on every single transaction.

### The assets marketplace

Beyond credit, the app includes a mini-investment platform:

| Asset | Code | Price |
|---|---|---|
| Digital Gold | EGOLD | 500 VEX |
| Digital Silver | ESILVER | 50 VEX |
| NFT Collection | BAPE | 5,000 VEX |
| Quantum Token | QTOKEN | 25 VEX |
| Green Energy Fund | GEF | 1,000 VEX |

(VEX = VexCoin, the platform's demo currency)

### API structure

```
POST /auth/register         Create account
POST /auth/login            Get JWT token
GET  /admin/risk/{userId}   Banker views risk assessment
POST /admin/limit/{userId}  Banker manually adjusts limit
POST /api/assets/buy        Buy an asset
GET  /api/wallet            See your balance and credit
```

---

## 9. The real-time pipeline — Kafka event streaming

**What is Kafka?** Apache Kafka is a high-speed **messaging system**. Think of it as a postal service for computer systems — one service publishes a "letter" (an event), and any other service that subscribes to that "mailbox" (topic) receives it.

### Why does AutoLend need Kafka?

Without Kafka, the Java backend would have to talk directly to the Python AI service for every single transaction. That is slow and creates tight coupling. With Kafka:

- The Java backend publishes events (**fire and forget**)
- The Python AI service reads them at its own pace
- The dashboard updates in real time
- If the AI service is temporarily down, no events are lost (they queue up)

### The four Kafka topics

| Topic | Events | Publisher | Subscriber |
|---|---|---|---|
| `transactions` | PURCHASE_AUTHORIZED, SETTLED, REVERSED | Java backend | Risk service |
| `assets` | ASSET_PURCHASED, ASSET_SOLD | Java backend | Portfolio service |
| `users` | USER_REGISTERED, RISK_UPDATED | Java backend | Notification service |
| `notifications` | Custom alerts | Any service | Frontend via WebSocket |

### Performance target

- **5,000 requests per minute** peak throughput
- **< 1 second** end-to-end decision latency (Redis caching makes this achievable)

---

## 10. The demo frontend — React single-page app

**Directory:** `frontend/`
**Runs at:** http://localhost:5173

The frontend was completely rebuilt for this project. Here is what each piece does:

### DemoContext (the shared brain)

`src/context/DemoContext.jsx` holds all simulation state in a `useReducer`. This means both dashboards always show the same data — they are reading from one single source of truth.

### The simulation loop

The demo does not need a backend. The `simulateStep()` function in `mockData.js` is a **pure mathematical function** that computes the next state from the current state:

```js
function simulateStep(prev, actionIdx) {
  // Apply credit limit multiplier
  // Simulate utilization change (random walk)
  // Compute PD from utilization and limit
  // Compute APR from PD
  // Compute reward = f(utilization, PD, action)
  return nextState
}
```

### The Recharts charts

Four live charts update every time the user clicks "Step" or "Auto-Run":
- **Credit Limit over time** (line chart)
- **Utilization % and PD %** (two lines on one chart)
- **RL Reward per step** (bar chart — positive and negative bars)
- **APR over time** (line chart)

All charts use `animationDuration={500}` so each step animates smoothly.

### Auto-Run

The "Auto-Run" button uses `requestAnimationFrame` (not `setInterval`, which can pile up when the browser tab is hidden). It fires at most once every 800ms, and pauses gracefully when the tab is not visible.

### Design system

Every color, spacing, and border-radius comes from `design-tokens.css`, which implements the Coinbase-inspired design system defined in `DESIGN.md`. No hardcoded hex values appear anywhere in component CSS files.

---

## 11. What each trained model file contains

| File | Size | What is inside |
|---|---|---|
| `models/rl_policy.pt` | 311 KB | Trained neural network weights for the Double Dueling DQN. The "brain" trained for thousands of episodes. PyTorch `.pt` format. |
| `models/cox_model.pkl` | 1.4 MB | Fitted Cox Proportional Hazards model — the beta coefficients learned from synthetic data that quantify how each feature affects default risk. Python `pickle` format via the `lifelines` library. |
| `models/knn_model.pkl` | 22 KB | A K-Nearest Neighbors model used as a supplementary credit scoring approach for comparison. |

---

## 12. End-to-end story: one credit decision

Let us trace exactly what happens when a real customer makes a purchase and the system decides whether to raise their limit.

**Scenario:** Alex Rivera buys $289 on Amazon. He has been a good customer for 8 months.

```
Step 1 — TRANSACTION
  Alex clicks "Buy" on Amazon.
  Frontend sends POST /api/transactions/purchase to Java backend.

Step 2 — WALLET LOCK
  Java TransactionService:
    Checks Alex's available credit: $2,900 available (enough)
    LOCKS $289: available_credits -= 289, locked_credits += 289
    Creates two ledger entries (double-entry accounting)
    Status: AUTHORIZED

Step 3 — KAFKA EVENT
  Java backend publishes to Kafka topic "transactions":
  { eventType: "PURCHASE_AUTHORIZED", userId: "alex", amount: 289 }

Step 4 — RISK CHECK (async)
  RiskScoreService receives the Kafka event.
  Checks Redis: "risk_score:alex" -> CACHE MISS (>15 min since last update)
  Calls Python AI Service: POST http://localhost:8000/v1/predict

Step 5 — COX MODEL
  Python AI Service receives Alex's features:
    utilization_avg_3m: 0.42 (42% over 3 months)
    payment_ratio:      0.97 (pays 97% of balance)
    dpd_status:         0    (never missed a payment)
    macro_unemployment: 5.8%

  Cox model computes: hazard_rate = 0.028 (2.8% default probability)

Step 6 — DQN DECISION
  Agent receives state: [0.028, 0.42, -0.02, 0.25, 0.18]
  Policy network evaluates all 10 Q-values.
  Picks action 4 (x1.17 multiplier) as highest Q-value.
  Recommended new limit: $5,000 x 1.17 = $5,850

Step 7 — RESPONSE
  Python returns to Java:
  {
    action_code: 4,
    multiplier: 1.17,
    new_limit: 5850,
    hazard_rate: 0.028,
    explanation: "Increased limit by 17% due to good payment history"
  }

Step 8 — CACHE AND UPDATE
  Java caches risk_score in Redis (TTL: 15 min)
  Updates Alex's wallet: creditLimit = 5850
  Publishes "RISK_UPDATED" event to Kafka

Step 9 — SETTLEMENT
  Amazon confirms receipt -> Java settles the transaction:
  locked_credits -= 289, external += 289
  Status: SETTLED

Step 10 — FRONTEND UPDATE
  Kafka event reaches frontend WebSocket.
  Alex's dashboard updates: new limit $5,850, utilization 36%.
  Banker's dashboard: portfolio PD slightly improved.
```

**Total time: < 300 milliseconds** (< 1 second SLA met)

---

## 13. Why this matters — recruiter summary

This project demonstrates multiple sophisticated engineering domains working together:

### Fintech engineering
- Double-entry ledger (bank-grade accounting integrity)
- Credit risk management (PD modelling, recovery rates)
- Regulatory explainability (every decision is logged and traceable)
- Multi-currency wallet system with locked/available credit distinction

### Machine learning engineering
- **Reinforcement learning from scratch** — custom Gym-style environment, custom reward function, full training pipeline
- **Survival analysis** — Cox Proportional Hazards applied to financial risk (borrowed from biostatistics — the same mathematics used in cancer survival studies)
- **Neural network architecture** — Dueling DQN, implementing the Wang et al. (2016) research paper in PyTorch
- Trained models persisted and loaded at inference time

### Systems engineering
- **Event-driven microservices** — Java (Spring Boot) and Python (FastAPI) communicate via Kafka, not direct HTTP calls, so they can scale independently
- **Redis caching** — sub-50ms risk scores for high-throughput scenarios (5,000 req/min peak)
- **Apache Kafka** — 4 topics, async event streaming, designed for production-grade load

### Frontend engineering
- Full Coinbase-inspired design system built from scratch (CSS custom properties, no frameworks)
- RAF-based auto-simulation (no setInterval drift when browser tab is hidden)
- React `useReducer` for batched state updates (prevents chart lag on rapid simulation steps)
- All charts animated with smooth 500ms transitions, fully responsive

### The core insight

> Static credit limits are a solved problem from the 1970s. Dynamic AI-driven limits are the frontier.
> AutoLend shows a complete, production-architecture approach to that frontier — from the neural network
> weights in `models/rl_policy.pt` all the way to the live charts on the demo page.

---

*Written June 2026 · AutoLend · HTW Hackathon*
