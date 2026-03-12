# Nexus DeFi Dashboard — Project Description

## Overview
**Nexus DeFi Dashboard** is a premium, glassmorphism-styled Web3 portfolio management dashboard built with **Next.js 16**, **React 19**, **Tailwind CSS 4**, **GSAP**, and **thirdweb**. It is designed to look and feel like a high-net-worth fintech terminal — inspired by Apple, Stripe, and top Awwwards/Dribbble entries.

The app connects to any EVM-compatible wallet via thirdweb, displays real-time token balances, live USD valuations streamed via Binance WebSocket, and provides transaction history and token approval management through Etherscan APIs.

When no wallet is connected (or the wallet balance is zero), the dashboard runs a **high-fidelity simulation mode** — displaying realistic static token holdings with live-ticking USD values and a cryptographic scrambling portfolio ticker, giving the impression of a fully live environment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS 4 (PostCSS plugin) |
| Animations | GSAP 3.x + @gsap/react |
| Web3 | thirdweb SDK v5 |
| Live Prices | CoinGecko REST (baseline) + Binance WebSocket (high-frequency ticks) |
| Tx History | Etherscan V2 API (multi-chain) |
| Icons | react-icons (SiBitcoin, SiEthereum, etc.) |

---

## File Structure

```
src/
├── app/
│   ├── globals.css          # Global styles: precision grid, radial mask, body defaults
│   ├── layout.tsx           # Root layout with ThirdwebProvider
│   └── page.tsx             # Entry point, renders DashboardClient
├── components/
│   ├── DashboardClient.tsx  # Main shell: sidebar, routing, background layers
│   ├── HeroTicker.tsx       # Simulated Portfolio card with GSAP scramble animation
│   ├── AssetVault.tsx       # Token cards grid (VaultCard, LiveTokenCard, BalanceFetcher)
│   ├── SecurityPanel.tsx    # Transaction history + token approval revocation
│   ├── SettingsPanel.tsx    # User preferences (animations, USD display, compact numbers)
│   ├── ClientConnectButton.tsx  # thirdweb wallet connect button wrapper
│   └── TokenSelector.tsx    # Modal for managing custom ERC-20 tokens
└── lib/
    ├── client.ts            # thirdweb client initialization
    ├── tokenRegistry.ts     # Per-chain token definitions (addresses, metadata)
    ├── usePrices.ts         # CoinGecko REST + Binance WebSocket price streaming
    ├── useCustomTokens.ts   # localStorage-backed custom token management
    ├── useLocalStorage.ts   # Generic localStorage hook with SSR safety
    ├── useTokenApprovals.ts # ERC-20 approval detection and revocation
    └── useTransactionHistory.ts  # Etherscan V2 transaction fetching
```

---

## Design System

### Background
- **Base**: Pure charcoal (`#0A0A0A`)
- **Precision Grid**: Faint 1px white gridlines (40px spacing, 5% opacity) with a CSS `radial-gradient` mask that fades the grid to pure black at the screen edges
- **Monochromatic Spotlight**: A single, massive, heavily blurred (`150px`) `bg-slate-200/5` glow fixed behind the Hero Ticker for subtle 3D depth

### Glassmorphism Cards
- `backdrop-blur-3xl` for maximum translucency
- `bg-white/[0.02]` for near-invisible fill
- `border border-white/[0.08]` for diamond-cut edge visibility
- `shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.8)]` for inner glow + deep drop shadow
- Each card has a gradient inner glow (`from-white/[0.08]`) at the top edge

### Animations
- **Hero Ticker**: Cryptographic hex scramble (`runScramble`) on every price tick, no red/green flashing
- **Vault Cards**: Token balances use scramble on mount; USD values flash green/red (`runFlash`) on live price ticks
- **Section Transitions**: GSAP `fromTo(y:16/20, opacity:0)` entrance animations on all panels (Security, Settings, Assets)
- **Card Hover**: 3D tilt via GSAP `quickTo` + radial border glow tracking cursor position

---

## Key Features

### 1. Simulation Mode (Disconnected Wallet)
- Displays static, realistic token holdings: 1.2513 BTC, 3.5182 ETH, 15.0741 SOL, 2.5394 BNB
- USD values tick in real-time from Binance WebSocket data
- Portfolio total scrambles with a cryptographic hex animation
- Sparkline charts render from rolling 20-tick WebSocket history

### 2. Live Portfolio (Connected Wallet)
- Reads on-chain token balances via thirdweb's `useWalletBalance`
- Supports multi-chain: Ethereum, Polygon, Arbitrum, Optimism, Base, BSC
- Custom ERC-20 token import via TokenSelector modal
- Balances update on chain/account change

### 3. Security Panel
- Transaction history from Etherscan V2 API
- ERC-20 token approval detection and one-click revocation
- GlassCard wrappers with staggered entrance animations

### 4. Settings Panel
- Toggle balance animations
- Toggle USD conversion display
- Toggle compact number formatting
- All preferences persisted to `localStorage`

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Optional | thirdweb client ID for wallet connection |
| `NEXT_PUBLIC_ETHERSCAN_API_KEY` | Optional | Etherscan API key for transaction history |

---

## Running Locally

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Security Profile (Audited)
- **No `dangerouslySetInnerHTML`** anywhere in the codebase
- **No `eval()`** calls
- **No hardcoded secrets or private keys** — all sensitive values use `NEXT_PUBLIC_` env vars
- **External API calls** are limited to: CoinGecko REST (price data), Binance WebSocket (live ticks), Etherscan V2 (tx history)
- **localStorage** usage is limited to: price cache (60s TTL), user preferences (animation/USD/compact toggles), custom token list
- All wallet interactions are handled exclusively through thirdweb SDK (no raw private key handling)
