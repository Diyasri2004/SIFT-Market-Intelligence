# SIFT — Market Intelligence

A high-signal market intelligence watchlist engineered to answer one fundamental question: **"What changed since you last checked, and why does it matter?"**

Unlike standard financial dashboards that inundate users with raw numbers and ticker spam, SIFT isolates noise and highlights high-impact movements relative to when *you* personally last visited.

---

## 🏛 Architecture & System Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Vite Client UI                          │
│  - "Since You Last Checked" Digest Strip (Ranked by Magnitude)         │
│  - Dual Delta Watchlist Cards (Day Change % vs. Checkpoint Delta %)    │
│  - Autocomplete Search, Detail Modal with History Chart & ACK Toast    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API (x-device-id)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Node.js / Express Backend Engine                   │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Checkpoint Diff Engine│  │      Resilient Market Service        │  │
│  │ - Price % Thresholds  │  │ - Cache-First (30s TTL)              │  │
│  │ - Volume Spike Surge  │  │ - Provider Deduplication Polling     │  │
│  │ - Round Number Breaks │  │ - Stale-Data Graceful Fallbacks      │  │
│  │ - Magnitude Scorer    │  │ - Multi-Provider (Finnhub / Replay)  │  │
│  └───────────┬───────────┘  └──────────────────┬───────────────────┘  │
│              │                                 │                      │
│              ▼                                 ▼                      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                   SQLite / Embedded Storage                     │  │
│  │  - `users`                       - `price_snapshots` (append)   │  │
│  │  - `watchlist_items`             - `user_symbol_checkpoints`    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Architectural Decisions

### 1. The Checkpoint Persistence Model (`user_symbol_checkpoints`)
- **Problem**: Most ticker apps compute changes only against yesterday's market close ($Δ_{24h}$). If an investor checks their portfolio at 10:00 AM, checks again at 10:30 AM after a sudden rally, and then checks at 4:00 PM, $Δ_{24h}$ cannot tell them what transpired in the intervening hours.
- **Solution**: Every time a user opens a symbol detail or clicks "Mark All as Seen", the backend records a checkpoint timestamp and price in `user_symbol_checkpoints(user_id, symbol, last_viewed_at, last_seen_price)`.
- **Cross-Device Sync**: Because checkpoints reside in the database keyed by the user/device identifier, checking on mobile or desktop preserves the exact checkpoint state without relying on ephemeral localStorage.

### 2. Meaningful Change Logic & Magnitude Ranking
Rather than alphabetical sorting, changes are ranked by a composite **Magnitude Score**:
$$\text{Magnitude Score} = 2.0 \cdot |\%\Delta_{\text{checkpoint}}| + 3.0 \cdot \max(0, \text{Volume Ratio} - 1.0) + \text{Milestone Bonuses}$$

- **Triggers**:
  1. **Price Surge / Drop**: $|\%\Delta_{\text{checkpoint}}| \ge 2.0\%$
  2. **Volume Surge**: Current volume $\ge 1.5\times$ rolling 30-day average.
  3. **Milestone Breakout / Breakdown**: Crossing key psychological whole-number thresholds (e.g. $\$100, \$200, \$500, \$1000$) or breaking to new 52-Week Highs/Lows.
  4. **Natural Language Explanation Engine**: Translates triggers into plain English (e.g., *"Broke to near 52-Week High ($140.76), Up +5.8% since you last checked (4h ago) on volume 140% above avg"*).

### 3. Resilient Multi-Provider Market Service & Graceful Degradation
- **Polling Deduplication**: Polling queries `SELECT DISTINCT symbol FROM watchlist_items` so that even with thousands of users, external market APIs are called once per distinct ticker.
- **Cache-First & Stale Indicators**: Snapshots are cached in-memory with a 30s TTL. If provider requests fail, rate-limit thresholds are reached, or networks drop, the service serves the latest DB snapshot tagged with `isStale: true` and a visible `Stale` badge rather than erroring out or displaying misleading live flags.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Running Locally

1. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start Backend & Frontend Concurrently**:
   ```bash
   npm run dev
   ```
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:4000](http://localhost:4000)

3. **Run Backend Test Suite**:
   ```bash
   npm run test:backend
   ```

4. **Seed / Reset Demo Data**:
   ```bash
   npm run seed
   ```

---

## 🧪 What We Would Do With More Time
- **Webhooks & Push Notifications**: Notify users on mobile or desktop via Web Push when an asset in their watchlist crosses a personalized threshold while the app is closed.
- **Custom Alert Thresholds**: Allow users to fine-tune sensitivity thresholds per symbol (e.g., 5% for volatile crypto vs. 1% for index ETFs).
- **Correlated Catalyst Explanations**: Integrate SEC filings and financial news sentiment feeds into the natural language explanation engine.
