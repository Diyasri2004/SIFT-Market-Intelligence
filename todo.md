# Smart Market Watchlist — TODO

Goal: not just a stock tracker — a watchlist that tells you what changed since you last checked, and why it matters.

## Phase 0 — Setup
- [x] Init repo structure: `/frontend`, `/backend`, `/shared`
- [x] Pick stack: React (frontend), Node/Express or FastAPI (backend), Postgres/SQLite (persistence), Redis/Memory (cache/rate-limit)
- [x] Pick a market data provider (e.g. Finnhub / Twelve Data / Alpha Vantage) — confirm free-tier rate limits before building around it
- [x] Env config + `.env.example`, basic CI lint/test step

## Phase 1 — Data model & persistence
- [x] `users` table (even if auth is minimal/anonymous device id for the demo)
- [x] `watchlist_items` table: user_id, symbol, added_at
- [x] `price_snapshots` table: symbol, price, volume, timestamp (append-only, for diffing)
- [x] `user_symbol_checkpoints` table: user_id, symbol, last_viewed_at, last_seen_price — this is what makes "what changed since you last checked" possible
- [x] Migration scripts + seed data for demo

## Phase 2 — Backend API
- [x] `POST /watchlist` add symbol, `DELETE /watchlist/:symbol`, `GET /watchlist` list
- [x] `GET /market/:symbol` latest price/volume/day-change, with cache-first + provider fallback
- [x] `GET /watchlist/digest` — the core endpoint: for each symbol, diff current state vs. checkpoint, return "meaningful" changes only
- [x] `POST /watchlist/:symbol/ack` — update checkpoint after user views (marks it "seen")
- [x] Background job: poll provider on an interval, write to `price_snapshots`, respect rate limits (batch requests, backoff)

## Phase 3 — "What counts as meaningful" logic
- [x] Define thresholds: % price move since last checkpoint (e.g. >2%), volume spike vs. rolling average, crossing a round-number/52-week level
- [x] Make thresholds configurable per symbol or per user (stretch)
- [x] Rank/sort changes by magnitude, not alphabetically — surface the thing that matters most first
- [x] Write down the reasoning for chosen thresholds (this is a judged criterion — be ready to explain it)

## Phase 4 — Frontend
- [x] Watchlist view: add/remove symbol (with search/autocomplete if time allows)
- [x] Symbol card: current price, day change, "since you last checked" delta, staleness indicator
- [x] "What's new" digest view: only symbols with meaningful change, grouped/ranked
- [x] Persist checkpoint client-side call on view (hits `/ack`) so cross-device state stays in sync via backend, not localStorage
- [x] Loading / empty / error states for every screen

## Phase 5 — Edge cases & resilience
- [x] Provider timeout/failure → serve last cached value + explicit "stale since X" label, never silently show wrong data
- [x] Conflicting data from two providers (if using fallback) → pick a resolution rule, document it
- [x] Market closed / after-hours → don't flag normal pre-market drift as "meaningful"
- [x] Empty watchlist, first-time user, symbol delisted/invalid ticker
- [x] Rate-limit exhaustion → degrade gracefully (serve cache, queue refresh) instead of erroring

## Phase 6 — Scale & multi-user considerations
- [x] Dedupe polling: fetch each symbol once regardless of how many users watch it (shared snapshot table already supports this)
- [x] Pagination/virtualization for large watchlists
- [x] Index checkpoints table on (user_id, symbol) for fast digest queries

## Phase 7 — Polish & submission
- [x] README: architecture diagram, key decisions (meaningful-change definition, persistence model, stale-data handling), what you'd do with more time
- [x] Remove dead code / TODOs, add basic tests for the diff logic (this is the core IP of the app)
- [x] Record demo walkthrough if required
