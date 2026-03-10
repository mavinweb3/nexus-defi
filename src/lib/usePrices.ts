"use client";

import { useState, useEffect, useRef } from "react";

interface PriceData {
    [tokenId: string]: {
        usd: number;
        change24h?: number;
        history: number[];
    };
}

// Map token symbols to CoinGecko IDs for REST fallback
const SYMBOL_TO_COINGECKO: Record<string, string> = {
    "BTC": "bitcoin",
    "WBTC": "bitcoin",
    "WETH": "ethereum",
    "USDC": "usd-coin",
    "USDC.e": "usd-coin",
    "LINK": "chainlink",
    "SOL": "solana",
    "AERO": "aerodrome-finance",
    "CAKE": "pancakeswap-token",
    "BTCB": "bitcoin",
    "cbBTC": "bitcoin",
    "ETH": "ethereum",
    "POL": "matic-network",
    "MATIC": "matic-network",
    "BNB": "binancecoin",
};

// Map token symbols to Binance USDT pairs for WebSocket streaming
const SYMBOL_TO_BINANCE: Record<string, string> = {
    "BTC": "btcusdt",
    "WBTC": "btcusdt", // Map wrapped to native for rough live tracking
    "WETH": "ethusdt",
    "ETH": "ethusdt",
    "SOL": "solusdt",
    "LINK": "linkusdt",
    "BNB": "bnbusdt",
    "MATIC": "maticusdt",
    "POL": "maticusdt", // Polygon migration
    "CAKE": "cakeusdt",
};

const CACHE_KEY = "mavin_price_cache";
const CACHE_TTL = 60_000; // 60 seconds

interface CacheEntry {
    data: Record<string, { usd: number; change24h: number }>;
    timestamp: number;
}

/**
 * Fetches USD prices for a list of token symbols.
 * 1. Pulls initial skeleton from CoinGecko REST (cached for 60s).
 * 2. Establishes a Binance WebSocket to overwrite supported tokens with sub-second live data, 
 *    tracking a rolling 20-tick history for dynamic sparklines.
 */
export function usePrices(symbols: string[]): {
    prices: Record<string, { usd: number; change24h: number; history: number[] }>;
    isLoading: boolean;
} {
    const [prices, setPrices] = useState<Record<string, { usd: number; change24h: number; history: number[] }>>({});
    const [isLoading, setIsLoading] = useState(true);

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (symbols.length === 0) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        // --- 1. Fetch Baseline from CoinGecko ---
        const fetchRestBaseline = async () => {
            let baseline: Record<string, { usd: number; change24h: number; history: number[] }> = {};

            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const entry: CacheEntry = JSON.parse(cached);
                    if (Date.now() - entry.timestamp < CACHE_TTL) {
                        for (const [key, val] of Object.entries(entry.data)) {
                            baseline[key] = { ...val, history: [val.usd] };
                        }
                    }
                }
            } catch {
                // Ignore cache parse errors
            }

            const geckoIds = [...new Set(symbols.map((s) => SYMBOL_TO_COINGECKO[s]).filter(Boolean))];

            if (geckoIds.length > 0 && Object.keys(baseline).length === 0) {
                const url = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds.join(",")}&vs_currencies=usd&include_24hr_change=true`;
                try {
                    const res = await fetch(url);
                    const data: Record<string, { usd: number; usd_24h_change?: number }> = await res.json();

                    const rawCacheOutput: Record<string, { usd: number; change24h: number }> = {};
                    for (const symbol of symbols) {
                        const geckoId = SYMBOL_TO_COINGECKO[symbol];
                        if (geckoId && data[geckoId]) {
                            const usd = data[geckoId].usd;
                            const change24h = data[geckoId].usd_24h_change || 0;

                            baseline[symbol] = { usd, change24h, history: [usd] };
                            rawCacheOutput[symbol] = { usd, change24h };
                        }
                    }

                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: rawCacheOutput, timestamp: Date.now() }));
                    } catch { /* no-op */ }
                } catch (err) {
                    console.warn("Mavin | Baseline REST fetch failed:", err);
                }
            }

            if (isMounted) {
                setPrices(prev => ({ ...prev, ...baseline }));
                setIsLoading(false);
            }
        };

        fetchRestBaseline();

        // --- 2. Establish High-Frequency WebSocket ---
        const binancePairs = symbols
            .map(s => SYMBOL_TO_BINANCE[s])
            .filter(Boolean);

        if (binancePairs.length > 0) {
            // Unify them into a stream payload using `@ticker` to receive `P` (percent change)
            const streams = [...new Set(binancePairs)].map(p => `${p}@ticker`).join('/');
            const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    const data = Array.isArray(payload) ? payload : [payload];

                    setPrices(prev => {
                        const next = { ...prev };
                        let updated = false;

                        for (const ticker of data) {
                            if (!ticker.s || !ticker.c || !ticker.P) continue;

                            const streamPair = ticker.s.toLowerCase(); // "BTCUSDT" -> "btcusdt"
                            const currentPrice = parseFloat(ticker.c);
                            const change24h = parseFloat(ticker.P); // From "@ticker" stream natively

                            for (const symbol of symbols) {
                                if (SYMBOL_TO_BINANCE[symbol] === streamPair) {
                                    if (next[symbol]?.usd !== currentPrice) {
                                        const oldHistory = next[symbol]?.history || [currentPrice];
                                        // Push to right, slice off the oldest to keep exactly 20 ticks
                                        const newHistory = [...oldHistory, currentPrice].slice(-20);

                                        next[symbol] = {
                                            usd: currentPrice,
                                            change24h: change24h,
                                            history: newHistory,
                                        };
                                        updated = true;
                                    }
                                }
                            }
                        }

                        return updated ? next : prev;
                    });

                } catch (e) {
                    // Ignore hyper-stream parse errors
                }
            };

            ws.onclose = () => console.log("Mavin | Live stream disconnected.");
        }

        return () => {
            isMounted = false;
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [symbols.join(",")]);

    return { prices, isLoading };
}

/**
 * Helper to format USD value with fixed styling
 */
export function formatUSD(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(4)}`;
}
