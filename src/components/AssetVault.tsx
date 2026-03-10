"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useActiveAccount, useWalletBalance, useActiveWalletChain } from "thirdweb/react";
import { defineChain } from "thirdweb";
import { client } from "@/lib/client";
import { getTokensForChain, CHAIN_NAMES, type TokenConfig } from "@/lib/tokenRegistry";
import { useCustomTokens } from "@/lib/useCustomTokens";
import { usePrices, formatUSD } from "@/lib/usePrices";
import { useLocalStorage } from "@/lib/useLocalStorage";
import dynamic from "next/dynamic";
import { SiBitcoin, SiEthereum, SiSolana, SiBinance } from "react-icons/si";

const TokenSelector = dynamic(() => import("@/components/TokenSelector"), { ssr: false });

// Utility: run the cryptographic scramble animation
function runScramble(
    el: HTMLElement,
    finalString: string,
    prefix: string = ""
) {
    // 1. Determine common prefix (the unchanged digits we lock in place)
    const oldText = el.innerText.replace(prefix, "");
    let commonPrefixLength = 0;

    // Only lock prefix if it's not the initial mount 
    // And if strings are of similar magnitudes to keep it feeling like a 'tick'
    if (oldText !== "—" && oldText.length > 0) {
        for (let i = 0; i < Math.min(oldText.length, finalString.length); i++) {
            if (oldText[i] === finalString[i]) {
                commonPrefixLength++;
            } else {
                break;
            }
        }
    }

    const hexChars = "0123456789ABCDEF";
    const config = { progress: 0 };

    // Kill any existing GSAP tweens firing on this specific target to prevent overlap stutter
    // We attach the active tween onto the DOM element for direct manual control
    // @ts-ignore
    if (el._mavinScramble) el._mavinScramble.kill();

    // @ts-ignore
    el._mavinScramble = gsap.to(config, {
        progress: 1,
        // Shorten the duration drastically so it matches high-frequency WebSocket ticks cleanly
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => {
            let scrambledString = "";
            for (let i = 0; i < finalString.length; i++) {
                // If the digit is in the common prefix, or it's punctuation, lock it immediately
                const charAtI = finalString[i];
                if (i < commonPrefixLength || charAtI === "." || charAtI === ",") {
                    scrambledString += charAtI;
                    continue;
                }

                // If not locked, run standard cascade matrix scramble
                const cascadeThreshold = (i - commonPrefixLength) / (finalString.length - commonPrefixLength);
                if (config.progress >= 1 || config.progress > cascadeThreshold) {
                    scrambledString += charAtI;
                } else {
                    scrambledString += hexChars[Math.floor(Math.random() * hexChars.length)];
                }
            }
            el.innerText = `${prefix}${scrambledString}`;
        },
    });
}

// Utility: run the orderbook color flash animation for high-frequency ticks
function runFlash(el: HTMLElement, isUp: boolean) {
    // @ts-ignore
    if (el._mavinFlash) el._mavinFlash.kill();
    // @ts-ignore
    if (el._mavinScramble) el._mavinScramble.kill();

    const flashColor = isUp ? "#00FFA3" : "#FF3366";

    // @ts-ignore
    el._mavinFlash = gsap.fromTo(el,
        { color: flashColor, textShadow: `0 0 12px ${flashColor}` },
        { color: "#ffffff", textShadow: "none", duration: 0.8, ease: "power2.out" }
    );
}

// Placeholder cards when no wallet is connected
const PLACEHOLDER_CARDS = [
    { id: "p-btc", symbol: "BTC", name: "Bitcoin", icon: SiBitcoin, colSpan: "md:col-span-2 md:row-span-2", trend: "up" as const, sparkline: "M0 15 Q 40 12 80 15 T 160 10", mockPrice: 90500.20, priceChange: 5.2 },
    { id: "p-eth", symbol: "ETH", name: "Ethereum", icon: SiEthereum, colSpan: "md:col-span-1", trend: "up" as const, sparkline: "M0 10 Q 40 12 80 15 T 160 20", mockPrice: 3100.45, priceChange: 2.1 },
    { id: "p-sol", symbol: "SOL", name: "Solana", icon: SiSolana, colSpan: "md:col-span-1", trend: "up" as const, sparkline: "M0 25 Q 40 15 80 10 T 160 0", mockPrice: 145.10, priceChange: 8.4 },
    { id: "p-bnb", symbol: "BNB", name: "Binance Coin", icon: SiBinance, colSpan: "md:col-span-2", trend: "down" as const, sparkline: "M0 5 Q 40 15 80 12 T 160 20", mockPrice: 620.15, priceChange: -1.2 },
];

// ─── Live Token Card ─────────────────────────────────────────────────────────
function LiveTokenCard({
    token,
    walletAddress,
    chainId,
    usdPrice,
    priceChange,
    dynamicHistory,
    isCustom,
    preferences,
}: {
    token: { id: string; symbol: string; name: string; address: `0x${string}`; colSpan: string; trend: "up" | "down"; sparkline: string };
    walletAddress: string;
    chainId: number;
    usdPrice?: number;
    priceChange?: number;
    dynamicHistory?: number[];
    isCustom?: boolean;
    preferences: { showUsd: boolean; compactNumbers: boolean; animate: boolean };
}) {
    const { data: balance, isLoading } = useWalletBalance({
        address: walletAddress,
        client,
        chain: defineChain(chainId),
        tokenAddress: token.address,
    });

    const rawBalance = balance ? parseFloat(balance.displayValue) : 0;

    // Apply compact numbers preference to token balance
    const formattedTokenBalance = preferences.compactNumbers && rawBalance > 1000
        ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(rawBalance)
        : rawBalance.toFixed(4);

    const displayBalance = isLoading ? "…" : formattedTokenBalance;
    const usdValue = usdPrice ? rawBalance * usdPrice : undefined;
    const isLarge = token.colSpan.includes("col-span-2");

    // Apply Show USD preference
    let finalValueLabel = "Live Balance";
    if (isLoading) {
        finalValueLabel = "Querying chain...";
    } else if (preferences.showUsd && usdValue !== undefined) {
        finalValueLabel = formatUSD(usdValue);
    }

    return (
        <VaultCard
            id={token.id}
            name={token.name}
            symbol={balance?.symbol || token.symbol}
            balance={displayBalance}
            valueLabel={finalValueLabel}
            colSpan={token.colSpan}
            trend={priceChange !== undefined ? (priceChange >= 0 ? "up" : "down") : token.trend}
            sparkline={token.sparkline}
            dynamicHistory={dynamicHistory}
            isLarge={isLarge}
            isLoading={isLoading}
            priceChange={priceChange}
            isCustom={isCustom}
            preferences={preferences}
        />
    );
}

// ─── Base Card UI ────────────────────────────────────────────────────────────
function VaultCard({
    id, name, symbol, icon: Icon, balance, valueLabel, colSpan, trend, sparkline, isLarge, isLoading, priceChange, dynamicHistory, isCustom, preferences,
}: {
    id: string; name: string; symbol: string; icon?: React.ElementType; balance: string; valueLabel: string; colSpan: string;
    trend: "up" | "down"; sparkline: string; dynamicHistory?: number[]; isLarge: boolean; isLoading?: boolean; priceChange?: number; isCustom?: boolean; preferences?: { showUsd: boolean; compactNumbers: boolean; animate: boolean };
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const borderGlowRef = useRef<HTMLDivElement>(null);
    const balanceRef = useRef<HTMLSpanElement>(null);
    const hoverTl = useRef<gsap.core.Timeline>(null);
    const prevBalanceRef = useRef<string | null>(null);

    // Compute dynamic sparkline from websocket history if available
    let currentSparkline = sparkline;
    if (dynamicHistory && dynamicHistory.length > 1) {
        const min = Math.min(...dynamicHistory);
        const max = Math.max(...dynamicHistory);
        const range = max - min;

        // Base SVG projection boundaries
        const viewBoxWidth = 160;
        const viewBoxHeight = 30;

        // Calculate coordinates
        const stepX = viewBoxWidth / (dynamicHistory.length - 1);
        const pts = dynamicHistory.map((val, i) => {
            const x = i * stepX;
            // Handle flat lines cleanly
            const y = range === 0 ? viewBoxHeight / 2 : viewBoxHeight - ((val - min) / range) * viewBoxHeight;
            return { x, y };
        });

        // Construct bezier bezier smoothing
        currentSparkline = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const curr = pts[i];
            const prev = pts[i - 1];
            // Soft-curve the path instead of hard angular lines
            const cpX = prev.x + (curr.x - prev.x) / 2;
            currentSparkline += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
        }
    }

    useGSAP(() => {
        if (!cardRef.current || !borderGlowRef.current) return;
        const xTo = gsap.quickTo(cardRef.current, "x", { duration: 0.4, ease: "power3.out" });
        const yTo = gsap.quickTo(cardRef.current, "y", { duration: 0.4, ease: "power3.out" });
        const glowXTo = gsap.quickTo(borderGlowRef.current, "left", { duration: 0.2, ease: "power2.out" });
        const glowYTo = gsap.quickTo(borderGlowRef.current, "top", { duration: 0.2, ease: "power2.out" });

        hoverTl.current = gsap.timeline({ paused: true }).to(cardRef.current, { scale: 1.02, duration: 0.4, ease: "power3.out" });

        const handleMouseMove = (e: MouseEvent) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            xTo(((relX - rect.width / 2) / (rect.width / 2)) * 10);
            yTo(-4 + ((relY - rect.height / 2) / (rect.height / 2)) * 10);
            glowXTo(relX);
            glowYTo(relY);
        };
        const handleMouseEnter = () => { hoverTl.current?.play(); gsap.to(borderGlowRef.current, { opacity: 1, duration: 0.3 }); };
        const handleMouseLeave = () => { hoverTl.current?.reverse(); xTo(0); yTo(0); gsap.to(borderGlowRef.current, { opacity: 0, duration: 0.5 }); };

        const el = cardRef.current;
        el.addEventListener("mousemove", handleMouseMove);
        el.addEventListener("mouseenter", handleMouseEnter);
        el.addEventListener("mouseleave", handleMouseLeave);

        if (preferences?.animate && balanceRef.current && !isLoading && balance !== "—") {
            const isUsd = balance.startsWith("$");
            const finalVal = isUsd ? balance.substring(1) : balance;

            const currentNum = parseFloat(balance.replace(/[^0-9.-]+/g, ""));
            const prevNum = prevBalanceRef.current ? parseFloat(prevBalanceRef.current.replace(/[^0-9.-]+/g, "")) : null;

            if (prevBalanceRef.current === null || prevNum === null || isNaN(currentNum)) {
                runScramble(balanceRef.current, finalVal, isUsd ? "$" : "");
            } else if (currentNum !== prevNum) {
                runFlash(balanceRef.current, currentNum > prevNum);
            }
        }

        prevBalanceRef.current = balance;

        return () => {
            el.removeEventListener("mousemove", handleMouseMove);
            el.removeEventListener("mouseenter", handleMouseEnter);
            el.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [balance, isLoading, preferences?.animate]);

    return (
        <div ref={cardRef} className={`relative overflow-hidden rounded-2xl backdrop-blur-[12px] bg-black/40 border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] flex flex-col justify-between min-h-[180px] group ${colSpan}`} style={{ willChange: "transform" }}>
            <div ref={borderGlowRef} className="absolute w-[400px] h-[400px] bg-white/15 rounded-full blur-[60px] pointer-events-none opacity-0 mix-blend-screen -translate-x-1/2 -translate-y-1/2 z-0" />
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none mix-blend-overlay z-0">
                <filter id={`noise-${id}`}><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" /></filter>
                <rect width="100%" height="100%" filter={`url(#noise-${id})`} fill="white" />
            </svg>

            <div className="relative z-10 flex justify-between items-start w-full">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4 text-white/60" />}
                        <span className="text-white/40 text-xs font-geist-sans tracking-[0.2em] uppercase font-semibold">{name}</span>
                        {isCustom && <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-geist-mono tracking-wider">CUSTOM</span>}
                    </div>
                    <span className="text-white bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] inline-flex items-center justify-center font-geist-mono tracking-widest w-fit">{symbol}</span>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {priceChange !== undefined && (
                        <span className={`text-[10px] font-geist-mono ${priceChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
                        </span>
                    )}
                    <div className={`opacity-40 group-hover:opacity-100 transition-opacity duration-500 overflow-visible ${isLarge ? "w-32 h-16" : "w-20 h-8"}`}>
                        <svg viewBox="0 0 160 30" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                            <path d={currentSparkline} fill="none" stroke={trend === "up" ? "#00FFA3" : "#f87171"} strokeWidth="1.5" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-start w-full mt-8">
                <span ref={balanceRef} className={`font-bold text-white font-geist-sans tracking-[-0.05em] ${isLoading ? "animate-pulse text-white/40" : ""} ${isLarge ? "text-4xl md:text-5xl" : "text-3xl"}`}>{balance}</span>
                <span className="text-white/40 text-sm font-geist-sans mt-1">{valueLabel}</span>
            </div>
        </div>
    );
}

// ─── Hidden Balance Fetcher ──────────────────────────────────────────────────
function BalanceFetcher({
    token,
    walletAddress,
    chainId,
    onResult,
}: {
    token: { id: string; address: `0x${string}` | undefined };
    walletAddress: string;
    chainId: number;
    onResult: (id: string, balance: number) => void;
}) {
    const { data: balance, isLoading } = useWalletBalance({
        address: walletAddress,
        client,
        chain: defineChain(chainId),
        tokenAddress: token.address,
    });

    useEffect(() => {
        if (!isLoading) {
            onResult(token.id, balance ? parseFloat(balance.displayValue) : 0);
        }
    }, [isLoading, balance, token.id, onResult]);

    return null;
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function AssetVault() {
    const account = useActiveAccount();
    const activeChain = useActiveWalletChain();
    const chainId = activeChain?.id || 1;
    const chainName = CHAIN_NAMES[chainId] || activeChain?.name || "Unknown";

    const registryTokens = getTokensForChain(chainId);
    const { getTokensForChain: getCustomForChain } = useCustomTokens();
    const customTokens = getCustomForChain(chainId);

    // Collect all symbols for price fetching
    const allTokens = [
        ...registryTokens,
        ...customTokens.map((ct) => ({
            id: `custom-${ct.address}`,
            symbol: ct.symbol,
            name: ct.name,
            address: ct.address,
            colSpan: "md:col-span-1",
            trend: "up" as const,
            sparkline: "M0 15 Q 40 10 80 15 T 160 15",
            isCustom: true,
        })),
    ];

    // Extract unique symbols for price querying
    const allSymbols = [
        ...allTokens.map((t) => t.symbol),
        ...PLACEHOLDER_CARDS.map((c) => c.symbol),
    ];
    const { prices } = usePrices(allSymbols);

    // Read preferences
    const [animate] = useLocalStorage("mavin_animate_balances", true);
    const [showUsd] = useLocalStorage("mavin_show_usd", true);
    const [compactNumbers] = useLocalStorage("mavin_compact_numbers", false);
    const prefs = { animate, showUsd, compactNumbers };

    const [showTokenSelector, setShowTokenSelector] = useState(false);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // ─── Balance State Management ───
    const [balances, setBalances] = useState<Record<string, number>>({});
    const [loadedTokens, setLoadedTokens] = useState<Set<string>>(new Set());

    const handleBalanceResult = useCallback((id: string, val: number) => {
        setBalances((prev) => (prev[id] === val ? prev : { ...prev, [id]: val }));
        setLoadedTokens((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    // Reset balance tracking if chain or account changes
    useEffect(() => {
        setBalances({});
        setLoadedTokens(new Set());
    }, [chainId, account?.address]);

    if (!isMounted) return null;

    const isAllLoaded = account ? allTokens.every((t) => loadedTokens.has(t.id)) : true;
    const heldTokens = allTokens.filter((t) => (balances[t.id] || 0) > 0);
    const showPlaceholders = !account || (!isAllLoaded && heldTokens.length === 0) || (isAllLoaded && heldTokens.length === 0);

    return (
        <section className="w-full z-10 relative">
            {account && allTokens.map(t => (
                <BalanceFetcher
                    key={`fetcher-${chainId}-${t.id}`}
                    token={t}
                    walletAddress={account.address}
                    chainId={chainId}
                    onResult={handleBalanceResult}
                />
            ))}

            <div className="flex items-center justify-between mb-8 ml-2">
                <h2 className="text-white/60 text-sm font-geist-sans tracking-[0.3em] uppercase">
                    {showPlaceholders && account ? "Market Overview" : "Secured Liquidity"}
                </h2>
                <div className="flex items-center gap-4">
                    {account && (
                        <button
                            onClick={() => setShowTokenSelector(true)}
                            className="text-white/30 text-[10px] font-geist-sans tracking-widest uppercase hover:text-white/80 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <span>+ Manage Tokens</span>
                        </button>
                    )}
                    {account && (
                        <span className="text-white/20 text-[10px] font-geist-sans tracking-widest uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            {chainName}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 auto-rows-[minmax(160px,auto)] sm:auto-rows-[minmax(180px,auto)]">
                {showPlaceholders ? (
                    PLACEHOLDER_CARDS.map((card) => {
                        // Use real-time data if available, otherwise fallback to the mock price layout immediately
                        const liveUsd = prices[card.symbol]?.usd;
                        const liveChange = prices[card.symbol]?.change24h;

                        // Use the formatUSD hook from usePrices for consistency
                        const formattedPrice = liveUsd !== undefined
                            ? formatUSD(liveUsd)
                            : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(card.mockPrice);

                        return (
                            <VaultCard
                                key={card.id} id={card.id} name={card.name} symbol={card.symbol} icon={card.icon}
                                balance={formattedPrice} valueLabel="Market Insight" colSpan={card.colSpan}
                                trend={liveChange !== undefined ? (liveChange >= 0 ? "up" : "down") : card.trend}
                                sparkline={card.sparkline} isLarge={card.colSpan.includes("col-span-2")}
                                priceChange={liveChange !== undefined ? liveChange : card.priceChange}
                                dynamicHistory={prices[card.symbol]?.history}
                                preferences={prefs}
                            />
                        );
                    })
                ) : (
                    heldTokens.map((token) => (
                        <LiveTokenCard
                            key={`${chainId}-${token.id}`}
                            token={token}
                            walletAddress={account.address}
                            chainId={chainId}
                            usdPrice={prices[token.symbol]?.usd}
                            priceChange={prices[token.symbol]?.change24h}
                            dynamicHistory={prices[token.symbol]?.history}
                            isCustom={"isCustom" in token}
                            preferences={prefs}
                        />
                    ))
                )}
            </div>

            {(!account || (!isAllLoaded && heldTokens.length === 0) || (isAllLoaded && heldTokens.length === 0)) && (
                <div className="w-full mt-12 bg-black/40 backdrop-blur-[12px] rounded-2xl border border-white/10 p-6 flex justify-between items-center transition-all">
                    <span className="text-white/40 text-xs font-geist-sans tracking-[0.2em] uppercase">
                        {account ? "Portfolio Status" : "Connection Status"}
                    </span>
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${account ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'} animate-pulse`} />
                        <span className="text-white/80 text-sm font-geist-sans tracking-tight">
                            {!account ? "Wallet Disconnected — Showing Market Overview" : (!isAllLoaded ? "Querying Balances on-chain..." : "Wallet Empty — Showing Market Overview")}
                        </span>
                    </div>
                </div>
            )}

            {showTokenSelector && <TokenSelector onClose={() => setShowTokenSelector(false)} />}
        </section>
    );
}
