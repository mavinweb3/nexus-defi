// ─── Multi-Chain Token Registry ──────────────────────────────────────────────
// Maps chain IDs to well-known ERC-20 token contract addresses.
// When a wallet connects on any supported chain, the Asset Vault will 
// automatically resolve the correct contracts for that chain.

export interface TokenConfig {
    id: string;
    symbol: string;
    name: string;
    address: `0x${string}`;
    decimals: number;
    trend: "up" | "down";
    sparkline: string;
    colSpan: string;
}

// ─── Per-Chain Token Maps ────────────────────────────────────────────────────

const ETHEREUM_TOKENS: TokenConfig[] = [
    {
        id: "wbtc", symbol: "WBTC", name: "Wrapped Bitcoin",
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        decimals: 8, trend: "up", colSpan: "md:col-span-2 md:row-span-2",
        sparkline: "M0 20 Q 20 15 40 25 T 80 5 T 120 10 T 160 -5",
    },
    {
        id: "weth", symbol: "WETH", name: "Wrapped Ether",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        decimals: 18, trend: "down", colSpan: "md:col-span-1",
        sparkline: "M0 5 Q 20 10 40 5 T 80 15 T 120 20 T 160 25",
    },
    {
        id: "usdc", symbol: "USDC", name: "USD Coin",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6, trend: "up", colSpan: "md:col-span-1",
        sparkline: "M0 15 L 160 15",
    },
    {
        id: "link", symbol: "LINK", name: "Chainlink",
        address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        decimals: 18, trend: "up", colSpan: "md:col-span-2",
        sparkline: "M0 25 Q 30 20 60 5 T 120 15 T 160 -10",
    },
];

const POLYGON_TOKENS: TokenConfig[] = [
    {
        id: "wbtc", symbol: "WBTC", name: "Wrapped Bitcoin",
        address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
        decimals: 8, trend: "up", colSpan: "md:col-span-2 md:row-span-2",
        sparkline: "M0 20 Q 20 15 40 25 T 80 5 T 120 10 T 160 -5",
    },
    {
        id: "weth", symbol: "WETH", name: "Wrapped Ether",
        address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        decimals: 18, trend: "down", colSpan: "md:col-span-1",
        sparkline: "M0 5 Q 20 10 40 5 T 80 15 T 120 20 T 160 25",
    },
    {
        id: "usdc", symbol: "USDC.e", name: "USD Coin (Bridged)",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6, trend: "up", colSpan: "md:col-span-1",
        sparkline: "M0 15 L 160 15",
    },
    {
        id: "link", symbol: "LINK", name: "Chainlink",
        address: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
        decimals: 18, trend: "up", colSpan: "md:col-span-2",
        sparkline: "M0 25 Q 30 20 60 5 T 120 15 T 160 -10",
    },
];

const ARBITRUM_TOKENS: TokenConfig[] = [
    {
        id: "wbtc", symbol: "WBTC", name: "Wrapped Bitcoin",
        address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
        decimals: 8, trend: "up", colSpan: "md:col-span-2 md:row-span-2",
        sparkline: "M0 20 Q 20 15 40 25 T 80 5 T 120 10 T 160 -5",
    },
    {
        id: "weth", symbol: "WETH", name: "Wrapped Ether",
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        decimals: 18, trend: "down", colSpan: "md:col-span-1",
        sparkline: "M0 5 Q 20 10 40 5 T 80 15 T 120 20 T 160 25",
    },
    {
        id: "usdc", symbol: "USDC", name: "USD Coin",
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        decimals: 6, trend: "up", colSpan: "md:col-span-1",
        sparkline: "M0 15 L 160 15",
    },
    {
        id: "link", symbol: "LINK", name: "Chainlink",
        address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
        decimals: 18, trend: "up", colSpan: "md:col-span-2",
        sparkline: "M0 25 Q 30 20 60 5 T 120 15 T 160 -10",
    },
];

const OPTIMISM_TOKENS: TokenConfig[] = [
    {
        id: "wbtc", symbol: "WBTC", name: "Wrapped Bitcoin",
        address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
        decimals: 8, trend: "up", colSpan: "md:col-span-2 md:row-span-2",
        sparkline: "M0 20 Q 20 15 40 25 T 80 5 T 120 10 T 160 -5",
    },
    {
        id: "weth", symbol: "WETH", name: "Wrapped Ether",
        address: "0x4200000000000000000000000000000000000006",
        decimals: 18, trend: "down", colSpan: "md:col-span-1",
        sparkline: "M0 5 Q 20 10 40 5 T 80 15 T 120 20 T 160 25",
    },
    {
        id: "usdc", symbol: "USDC", name: "USD Coin",
        address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        decimals: 6, trend: "up", colSpan: "md:col-span-1",
        sparkline: "M0 15 L 160 15",
    },
    {
        id: "link", symbol: "LINK", name: "Chainlink",
        address: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6",
        decimals: 18, trend: "up", colSpan: "md:col-span-2",
        sparkline: "M0 25 Q 30 20 60 5 T 120 15 T 160 -10",
    },
];

const BASE_TOKENS: TokenConfig[] = [
    {
        id: "cbbtc", symbol: "cbBTC", name: "Coinbase Bitcoin",
        address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        decimals: 8, trend: "up", colSpan: "md:col-span-2 md:row-span-2",
        sparkline: "M0 20 Q 20 15 40 25 T 80 5 T 120 10 T 160 -5",
    },
    {
        id: "weth", symbol: "WETH", name: "Wrapped Ether",
        address: "0x4200000000000000000000000000000000000006",
        decimals: 18, trend: "down", colSpan: "md:col-span-1",
        sparkline: "M0 5 Q 20 10 40 5 T 80 15 T 120 20 T 160 25",
    },
    {
        id: "usdc", symbol: "USDC", name: "USD Coin",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6, trend: "up", colSpan: "md:col-span-1",
        sparkline: "M0 15 L 160 15",
    },
    {
        id: "aero", symbol: "AERO", name: "Aerodrome",
        address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
        decimals: 18, trend: "up", colSpan: "md:col-span-2",
        sparkline: "M0 25 Q 30 20 60 5 T 120 15 T 160 -10",
    },
];

const BSC_TOKENS: TokenConfig[] = [
    {
        id: "btcb", symbol: "BTCB", name: "Bitcoin BEP2",
        address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
        decimals: 18, trend: "up", colSpan: "md:col-span-2 md:row-span-2",
        sparkline: "M0 20 Q 20 15 40 25 T 80 5 T 120 10 T 160 -5",
    },
    {
        id: "weth", symbol: "ETH", name: "Binance ETH",
        address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
        decimals: 18, trend: "down", colSpan: "md:col-span-1",
        sparkline: "M0 5 Q 20 10 40 5 T 80 15 T 120 20 T 160 25",
    },
    {
        id: "usdc", symbol: "USDC", name: "USD Coin",
        address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        decimals: 18, trend: "up", colSpan: "md:col-span-1",
        sparkline: "M0 15 L 160 15",
    },
    {
        id: "cake", symbol: "CAKE", name: "PancakeSwap",
        address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
        decimals: 18, trend: "up", colSpan: "md:col-span-2",
        sparkline: "M0 25 Q 30 20 60 5 T 120 15 T 160 -10",
    },
];

// ─── Chain ID → Token Map ────────────────────────────────────────────────────
const CHAIN_TOKEN_MAP: Record<number, TokenConfig[]> = {
    1: ETHEREUM_TOKENS,   // Ethereum Mainnet
    137: POLYGON_TOKENS,    // Polygon
    42161: ARBITRUM_TOKENS,   // Arbitrum One
    10: OPTIMISM_TOKENS,   // Optimism
    8453: BASE_TOKENS,       // Base
    56: BSC_TOKENS,        // BNB Smart Chain
};

// ─── Chain Name Map (for display) ────────────────────────────────────────────
export const CHAIN_NAMES: Record<number, string> = {
    1: "Ethereum",
    137: "Polygon",
    42161: "Arbitrum",
    10: "Optimism",
    8453: "Base",
    56: "BNB Chain",
};

// ─── Exported lookup function ────────────────────────────────────────────────
export function getTokensForChain(chainId: number): TokenConfig[] {
    return CHAIN_TOKEN_MAP[chainId] || ETHEREUM_TOKENS; // fallback to ETH
}

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_TOKEN_MAP).map(Number);
