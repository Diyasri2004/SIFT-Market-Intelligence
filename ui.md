# Smart Market Watchlist — UI Spec

Design principle: this is not a stock ticker board. The default view answers one question — "what deserves my attention right now?" — not "list every number for every symbol."

## Screens

### 1. Watchlist (home)
- Top: "Since you last checked" digest strip — only symbols with a meaningful change, ranked by magnitude, not alphabetical. Empty state: "No major moves since your last visit" (not blank/nothing).
- Below: full watchlist as a list of symbol cards.
- Each card shows: symbol/name, current price, day change (%, color-coded), a small delta line specifically for "change since you last viewed this" (distinct from day change — these are different numbers and both matter).
- Staleness tag on any card serving cached/delayed data: e.g. "updated 4m ago" instead of pretending it's live.
- Add-symbol control: search box with autocomplete, always visible (sticky header or persistent button), not buried in a menu.
- Swipe/click to remove a symbol; confirm on remove to avoid accidental loss.

### 2. Symbol detail (on tap/click of a card)
- Larger price + change block at top.
- Simple line chart of recent price history (even a basic one is fine — don't over-invest here vs. the diff logic).
- "What changed" explanation in plain language: e.g. "Up 3.2% since you last checked (2 days ago), on volume 40% above average" — the reasoning, not just the number.
- Viewing this screen marks the symbol as "acknowledged" (updates the checkpoint) — make this visible, e.g. a brief "marked as seen" confirmation, so the mechanic isn't invisible/magic.

### 3. Empty / first-run state
- No watchlist yet → prompt to add first symbols, maybe 3-4 suggested popular tickers to reduce blank-page friction.

## States every screen needs
- Loading (skeleton, not spinner-only, so layout doesn't jump)
- Error (provider down): explicit message + last-known values if available, never a silent stale number
- Stale data: visible timestamp/badge, not hidden
- Empty (no watchlist / no meaningful changes)

## Visual/interaction notes
- Color-code change direction (green/red) but don't rely on color alone — include +/- sign and arrow icon for accessibility.
- Keep the digest strip visually distinct (card/banner style) from the regular list so it reads as "this is the summary" vs "this is the full list."
- Mobile-first layout: single column, cards stack, digest strip scrollable horizontally if multiple symbols changed.
- Avoid dashboard-clutter — resist adding every possible metric to each card. Show price, day change, since-last-checked delta, staleness. Everything else lives in the detail screen.

## Explicitly out of scope for v1 (note if asked, don't over-build)
- Real-time streaming/websockets (polling is fine and easier to reason about for a demo)
- Full auth system (anonymous device-based user is acceptable)
- News feed integration (mention as a "meaningful change" signal only if time allows)
