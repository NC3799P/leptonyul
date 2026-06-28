# Polymarket Reverse Arbitrage Bot

TypeScript automation for my Polymarket reverse strategy on **15-minute BTC/ETH Up or Down** markets.

---

## My Polymarket account
<img width="815" height="291" alt="image" src="https://github.com/user-attachments/assets/0971eb6d-de7e-4f9a-82a1-14a2163db209" />


| | |
|---|---|
| **Profile** | [@odahoa](https://polymarket.com/@odahoa?tab=activity) |
| **Username** | `odahoa` |
| **Proxy wallet** | `0xe2511c9e41c5e762887e538b1d6e7221807aa237` |
| **Markets** | `btc-updown-15m`, `eth-updown-15m` |

All activity, positions, and PnL live on my profile:  
**https://polymarket.com/@odahoa?tab=activity**

This bot trades **from that account** — it automates what I already do manually. It is not copy trading and does not watch any other wallet.

---

## Overview

Polymarket runs 15-minute windows like:

> **Bitcoin Up or Down — 1:45PM–2:00PM ET**

Each window has two tokens:

| Token | Wins when |
|-------|-----------|
| **Up** | Price at end ≥ price at start |
| **Down** | Price at end < price at start |

Winning tokens pay **$1.00**. Losing tokens pay **$0.00**.

My strategy — the **reverse bot** — posts limit **BUY** orders on **both sides** every window:

1. **Cheap reversal side (7–10¢)** on the underdog outcome  
2. **Expensive hedge side (90–95¢)** on the favorite outcome  

That is the same pattern visible on my [activity tab](https://polymarket.com/@odahoa?tab=activity): round limit prices (7¢, 8¢, 10¢ … 95¢), 20–90 shares per fill, no sells — hold to resolution.

---

## Why "reverse"?

Early in a window, price often trends one way:

```
BTC pumps in first 10 minutes
  → Up token   ~90–97¢  (favorite)
  → Down token ~3–10¢   (underdog)
```

The crowd prices the underdog as nearly dead. The **reverse bet** is: *it flips before the window closes*.

| Leg | Outcome | Entry | If it wins |
|-----|---------|-------|------------|
| **Reverse** | Underdog | 7–10¢ | ~10–14× |
| **Hedge** | Favorite | 90–95¢ | ~5–11% |

Only one side pays $1 per window. I run both legs because:

- Cheap fills are rare but pay huge when they hit.
- Hedge fills are smaller profit but hit more often.
- Over hundreds of windows, a few reversals cover many losses.

---

## How I trade (manual → bot)

From my account history:

| Pattern | Detail |
|---------|--------|
| Markets | BTC & ETH 15m Up/Down only |
| Order type | Limit BUY only — never sell |
| Cheap leg | Fills at 7–10¢ (sometimes 5–25¢) on underdog |
| Hedge leg | Fills at 90–95¢ on favorite |
| Both sides | Same window — e.g. Down @ 95¢ and Up @ 15¢ |
| Size | 20–90 shares per order |

The bot replaces hand-placing every limit order each window.

---

## Bot logic

Every **5 seconds** (configurable):

```
1. Scan active btc-updown-15m / eth-updown-15m markets
2. Load Up & Down order books (CLOB API)
3. Underdog  = outcome with lower best ask
4. Favorite  = the other outcome
5. Post limit BUYs on underdog  @ 7¢, 8¢, 9¢, 10¢
6. Post limit BUYs on favorite  @ 90¢–95¢  (if hedge enabled)
7. Skip price levels already posted this session
```

### Cheap leg — underdog @ 7–10¢

```
Down best ask = 4¢  →  bot bids 7¢, 8¢, 9¢, 10¢ on Down
```

If Down reverses and wins:

```
90 shares × 8¢  =  $7.20 in
90 shares × $1  =  $90.00 out   →  +$82.80 (~1,150%)
```

### Hedge leg — favorite @ 90–95¢

```
Up best ask = 97¢  →  bot bids 90¢–95¢ on Up
```

If Up holds and wins:

```
52 shares × 95¢  =  $49.40 in
52 shares × $1   =  $52.00 out  →  +$2.60 (~5%)
```

---

## Example window

**Market:** Bitcoin Up or Down — 1:45–2:00 PM ET  
**BTC pumped early** → Up favored, Down cheap

| Token | Book | Bot posts |
|-------|------|-----------|
| Up (favorite) | ask 97¢ | BUY limits @ 90–95¢ |
| Down (underdog) | ask 4¢ | BUY limits @ 7–10¢ |

| Result | Cheap leg | Hedge leg |
|--------|-----------|-----------|
| Up wins | Down → $0 | Up → small profit |
| Down reverses | Down → big profit | Up → $0 |

---

## Return table

| Buy price | Payout | Return if win |
|-----------|--------|---------------|
| 7¢ | $1.00 | +1,329% |
| 8¢ | $1.00 | +1,150% |
| 9¢ | $1.00 | +1,011% |
| 10¢ | $1.00 | +900% |
| 95¢ | $1.00 | +5% |

Most 7–10¢ bets go to zero. Edge comes from occasional reversals at high multiples.

---

## Quick start

```bash
git clone https://github.com/abwhaoms502/polymarket-reverse-arbitrage-bot
cd reverse-bot
npm install
cp .env.example .env
npm start          # dry-run: logs orders, no submission
```

### Go live on @odahoa

```env
DRY_RUN=false
PRIVATE_KEY=0x...                                           # account signing key
FUNDER_ADDRESS=0xe2511c9e41c5e762887e538b1d6e7221807aa237   # @odahoa proxy wallet
SIGNATURE_TYPE=2
```

| `SIGNATURE_TYPE` | Use for |
|------------------|---------|
| `0` | EOA / MetaMask |
| `2` | Gnosis Safe proxy *(typical Polymarket account)* |
| `3` | POLY_1271 deposit wallet |

---

## Config

### Strategy

| Variable | Default | Description |
|----------|---------|-------------|
| `CHEAP_BUY_MIN` | `0.07` | Low end of reversal bids |
| `CHEAP_BUY_MAX` | `0.10` | High end of reversal bids |
| `CHEAP_ORDER_USDC` | `10` | USDC per cheap limit order |
| `ENABLE_EXPENSIVE_HEDGE` | `true` | Post 90–95¢ favorite bids |
| `EXPENSIVE_BUY_MIN` | `0.90` | Low end of hedge bids |
| `EXPENSIVE_BUY_MAX` | `0.95` | High end of hedge bids |
| `EXPENSIVE_ORDER_USDC` | `50` | USDC per hedge limit order |
| `MAX_SHARES_PER_ORDER` | `90` | Max shares per order |

### Markets & timing

| Variable | Default | Description |
|----------|---------|-------------|
| `MARKET_SLUG_PREFIXES` | `btc-updown-15m,eth-updown-15m` | Markets to scan |
| `POLL_INTERVAL_MS` | `5000` | Scan interval |
| `MINUTES_BEFORE_CLOSE_MIN` | `0` | Start trading N min into window |
| `MINUTES_BEFORE_CLOSE_MAX` | `15` | Stop trading N min before close |

Trade only late window (when cheap tokens show up):

```env
MINUTES_BEFORE_CLOSE_MIN=3
MINUTES_BEFORE_CLOSE_MAX=12
```

### Safety

| Variable | Default | Description |
|----------|---------|-------------|
| `DRY_RUN` | `true` | Log only — no real orders |

---

## Project layout

```
reverse-bot/
├── src/
│   ├── index.ts           # main loop
│   ├── market-scanner.ts  # active 15m markets + books
│   ├── strategy.ts        # underdog/favorite + limit prices
│   ├── trader.ts          # CLOB order submission
│   └── config.ts
├── .env.example
└── package.json
```

---

## Commands

```bash
npm start      # run bot
npm run dev    # run with hot reload
npm run build  # compile TypeScript
```

---

## Risks

- **Most cheap bids lose.** 7–10¢ tokens frequently expire worthless.
- **Limits may not fill.** Bidding 7¢ when ask is 4¢ waits for sellers.
- **Both legs can't both win.** One side always goes to $0.
- **Real money.** Test with `DRY_RUN=true` first.

---

## Links

- My profile: https://polymarket.com/@odahoa  
- My activity: https://polymarket.com/@odahoa?tab=activity  
- Polymarket settings: https://polymarket.com/settings  
