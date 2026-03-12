# Nexus DeFi Dashboard — Change Log (update.md)

All tracked changes made during the Glassmorphism Dashboard Overhaul session.

---

## Update 1 — Initial Glassmorphism Overhaul
**Date:** 2026-03-12  
**Status:** ✅ Complete

### Changes
- **`globals.css`**: Added `@theme` with `--color-background: #020202` and body background/color defaults.
- **`DashboardClient.tsx`**: 
  - Deepened base background to `bg-[#020202]`.
  - Added mesh gradient background layers (violet, indigo, teal blurred circles).
  - Added SVG noise overlay texture.
  - Updated sidebar to `backdrop-blur-3xl bg-black/20 border-white/[0.05]`.
  - Updated mobile sidebar/header with matching glassmorphism.
- **`HeroTicker.tsx`**: Updated card to `backdrop-blur-3xl bg-white/[0.02] border-white/[0.08]` with inner glow and heavy drop shadow.
- **`AssetVault.tsx`**: Updated VaultCard with identical glassmorphism treatment.
- **`SecurityPanel.tsx`** & **`SettingsPanel.tsx`**: Updated GlassCard with matching glassmorphism classes, removed inline SVG noise filter.

---

## Update 2 — Fix Broken SVG Noise Filter
**Date:** 2026-03-12  
**Status:** ✅ Complete

### Changes
- **`DashboardClient.tsx`**: Removed the inline SVG `feTurbulence` noise filter that was causing the entire screen to wash out into bright static.
- **`DashboardClient.tsx`**: Removed `mix-blend-screen` from the three mesh gradient layers to prevent color blowout.
- **`globals.css`**: Set explicit body `background-color` and `color` to prevent white background fallback.

---

## Update 3 — Subtle Green Glow + Ticker Animation Fix
**Date:** 2026-03-12  
**Status:** ✅ Complete

### Changes
- **`globals.css`**: Added `@keyframes roam` animation for a single emerald orb.
- **`DashboardClient.tsx`**: Replaced the three large mesh gradient divs with one small roaming emerald orb.
- **`HeroTicker.tsx`**: Changed the ticker so it *only* uses `runScramble` (not `runFlash`) when the simulated portfolio total changes.
- **`AssetVault.tsx`**: 
  - Added `valueLabelRef` to independently target the USD value label.
  - Token balance changes now use `runScramble`.
  - USD value changes now use `runFlash` (red/green flash for live market ticks).

---

## Update 4 — Dual Full-Screen Roaming Orbs + Realistic Data
**Date:** 2026-03-12  
**Status:** ✅ Complete

### Changes
- **`globals.css`**: Replaced single `roam` animation with two complex viewport-spanning `roam-1` and `roam-2` keyframes.
- **`DashboardClient.tsx`**: Added two large orbs (Emerald + Rose) with the new animations.
- **`AssetVault.tsx`**: Added pseudo-random decimal noise to simulated token balances so they no longer show static integers.
- **`HeroTicker.tsx`**: Added `Date.now()` micro-fluctuation to the simulated portfolio total to ensure the scramble effect triggers frequently.

---

## Update 5 — Precision Grid + Monochromatic Spotlight (Apple Approach)
**Date:** 2026-03-12  
**Status:** ✅ Complete

### Changes
- **`globals.css`**: 
  - Removed all `@keyframes roam-*` animations.
  - Added `.bg-grid-white` class (faint 1px white gridlines, 40px spacing, 5% opacity).
  - Added `.mask-radial-faded` class (radial gradient CSS mask fading grid to black at edges).
- **`DashboardClient.tsx`**: 
  - Changed base background from `#020202` to `#0A0A0A`.
  - Replaced dual roaming orbs with precision grid overlay + radial mask.
  - Added a fixed, massive `bg-slate-200/5 blur-[150px]` spotlight behind the Hero Ticker.

---

## Update 6 — Stable Sim Balances, Assets Transitions, Security Audit
**Date:** 2026-03-12  
**Status:** ✅ Complete

### Changes
- **`AssetVault.tsx`**:
  - Removed pseudo-random noise from simulated token balances. Token values are now permanently fixed: BTC=1.2513, ETH=3.5182, SOL=15.0741, BNB=2.5394. Only USD values tick with market data.
  - Added GSAP `fromTo(y:20, opacity:0)` entrance animation to the `<section>` wrapper, matching the transition effects used by SecurityPanel and SettingsPanel.

### Security Audit
- ✅ No `dangerouslySetInnerHTML` usage found.
- ✅ No `eval()` calls found.
- ✅ No hardcoded secrets, private keys, or API keys in source code.
- ✅ External fetch calls limited to CoinGecko REST and Etherscan V2.
- ✅ Binance WebSocket used for price streaming only (read-only).
- ✅ localStorage used only for price cache and user preferences (no sensitive data stored).
- ✅ All wallet interactions handled by thirdweb SDK (no raw key exposure).

### Documentation
- Created `PROJECT_DESCRIPTION.md` — comprehensive project context for chat/model transfer.
- Created `update.md` — this file, tracking all design changes chronologically.

---

## Update 7 — Thirdweb ConnectButton Hydration Fix
**Date:** 2026-03-12  
**Status:** ⚠️ Mitigated (thirdweb SDK limitation)

### Root Cause
This is an **internal thirdweb SDK bug** — their connected wallet modal renders a `CopyIcon` component (which is a `<button>`) inside a `Styled(button)` wrapper, violating HTML spec (`<button>` cannot be a descendant of `<button>`). This triggers a React hydration error in Next.js.

### Mitigation
- **`ClientConnectButton.tsx`**: Wrapped the thirdweb `<ConnectButton />` in a `<div suppressHydrationWarning>` to suppress immediate hydration warnings.
- The deep nesting warning in thirdweb's portal-rendered modal may still appear as a console warning since it's outside our control.

### Permanent Fix
This requires a fix from the thirdweb SDK team. Options:
1. Open an issue on [thirdweb GitHub](https://github.com/thirdweb-dev/js/issues) reporting the nested button in their `CopyIcon` component.
2. Wait for a thirdweb SDK update that resolves the internal nesting.
3. As a temporary workaround, the `suppressHydrationWarning` wrapper prevents the error from crashing the app.
