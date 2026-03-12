"use client";

import { useActiveAccount, useWalletBalance, useActiveWalletChain } from "thirdweb/react";
import { defineChain } from "thirdweb";
import { useEffect, useRef, useCallback, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { client } from "../lib/client";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { usePrices } from "@/lib/usePrices";

// Utility: run the cryptographic scramble animation
function runScramble(
    el: HTMLDivElement,
    finalString: string,
    tickerSymbol: string
) {
    // 1. Determine common prefix to prevent full-str scrambling on small updates
    const oldText = el.innerText.replace(new RegExp(`\\s*${tickerSymbol}$`), "").trim();
    let commonPrefixLength = 0;

    if (oldText !== "—" && oldText !== "0.0000" && oldText.length > 0) {
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

    // @ts-ignore
    if (el._mavinScramble) el._mavinScramble.kill();

    // @ts-ignore
    el._mavinScramble = gsap.to(config, {
        progress: 1,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => {
            let scrambledString = "";
            for (let i = 0; i < finalString.length; i++) {
                const charAtI = finalString[i];
                // Lock common prefixes and punctuation
                if (i < commonPrefixLength || charAtI === "." || charAtI === ",") {
                    scrambledString += charAtI;
                    continue;
                }
                const cascadeThreshold = (i - commonPrefixLength) / (finalString.length - commonPrefixLength);
                if (config.progress >= 1 || config.progress > cascadeThreshold) {
                    scrambledString += charAtI;
                } else {
                    scrambledString += hexChars[Math.floor(Math.random() * hexChars.length)];
                }
            }
            el.innerText = `${scrambledString} ${tickerSymbol}`;
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
        { color: flashColor, textShadow: `0 0 16px ${flashColor}` },
        { color: "#ffffff", textShadow: "none", duration: 0.8, ease: "power2.out" }
    );
}

export default function HeroTicker() {
    const account = useActiveAccount();
    const activeChain = useActiveWalletChain();
    const { prices } = usePrices(["BTC", "ETH"]);

    const { data: balance, isLoading } = useWalletBalance({
        address: account?.address,
        client,
        chain: activeChain || defineChain(1),
    });

    const balanceRef = useRef<HTMLDivElement>(null);
    const prevBalanceRef = useRef<string | null>(null);

    // Read preferences
    const [animate] = useLocalStorage("mavin_animate_balances", true);
    const [compactNumbers] = useLocalStorage("mavin_compact_numbers", false);

    // GSAP Cryptographic Reveal
    useGSAP(() => {
        if (!balanceRef.current) return;

        let rawValue = balance ? parseFloat(balance.displayValue) : 0;
        let tickerSymbol = balance?.symbol || "—";
        let isSimulated = false;

        // High-Fidelity Simulation when disconnected or balance is zero
        if (!account || rawValue === 0) {
            const btcPrice = prices["BTC"]?.usd || 90500.20;
            const ethPrice = prices["ETH"]?.usd || 3100.45;
            
            // Add a micro-fluctuation based on the current millisecond to ensure 
            // the simulated total organically shifts and triggers the scramble effect
            const noise = (Date.now() % 1000) / 10000;
            rawValue = (btcPrice * 1.25) + (ethPrice * 3.5) + 140.50 + noise; // Organically ticks with WS and time
            tickerSymbol = "USD";
            isSimulated = true;
        }

        let finalString = isSimulated ? rawValue.toFixed(2) : rawValue.toFixed(4);
        
        if (compactNumbers && rawValue > 1000) {
            finalString = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(rawValue);
        }

        const currentNum = rawValue;
        const prevNum = prevBalanceRef.current ? parseFloat(prevBalanceRef.current) : null;

        if (animate) {
            if (prevBalanceRef.current === null || prevNum === null || isNaN(currentNum)) {
                runScramble(balanceRef.current, finalString, tickerSymbol);
            } else if (currentNum !== prevNum) {
                // For HeroTicker (Simulated Portfolio), we ONLY use scrambling, not red/green flashing.
                runScramble(balanceRef.current, finalString, tickerSymbol);
            }
        } else {
            balanceRef.current.innerText = `${finalString} ${tickerSymbol}`;
        }

        prevBalanceRef.current = rawValue.toString();
    }, [balance, animate, compactNumbers, prices, account]);

    // onClick: replay animation with current live balance
    const handleReplay = useCallback(() => {
        if (!balanceRef.current || !animate) return;
        
        let rawValue = balance ? parseFloat(balance.displayValue) : 0;
        let tickerSymbol = balance?.symbol || "—";
        let isSimulated = false;

        if (!account || rawValue === 0) {
            const btcPrice = prices["BTC"]?.usd || 90500.20;
            const ethPrice = prices["ETH"]?.usd || 3100.45;
            const noise = (Date.now() % 1000) / 10000;
            rawValue = (btcPrice * 1.25) + (ethPrice * 3.5) + 140.50 + noise;
            tickerSymbol = "USD";
            isSimulated = true;
        }

        let finalString = isSimulated ? rawValue.toFixed(2) : rawValue.toFixed(4);
        if (compactNumbers && rawValue > 1000) {
            finalString = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(rawValue);
        }

        // Force a full scramble from digit 1 by resetting displayed text
        balanceRef.current.innerText = "—";
        runScramble(balanceRef.current, finalString, tickerSymbol);
    }, [balance, animate, compactNumbers, prices, account]);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div
            className="group relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/[0.02] border border-white/[0.08] p-8 w-full max-w-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.8)] cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleReplay}
        >
            {/* Ambient inner glow */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-start w-full pointer-events-none">
                <div className="flex justify-between items-center w-full mb-4">
                    <span className="text-white/40 text-xs font-geist-sans tracking-[0.2em] uppercase font-semibold">
                        {(!account || !balance || parseFloat(balance.displayValue) === 0) ? "Simulated Portfolio" : "Live Portfolio Vault"}
                    </span>
                    <div className="flex items-center gap-3">
                        {isLoading && (
                            <span className="text-white/20 text-[10px] uppercase font-geist-sans tracking-widest animate-pulse">
                                Fetching...
                            </span>
                        )}
                        <span className="text-white/20 text-[10px] uppercase font-geist-sans tracking-widest group-hover:text-white/60 transition-colors">
                            Click to replay
                        </span>
                    </div>
                </div>

                <div
                    ref={balanceRef}
                    className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1] font-geist-sans drop-shadow-lg whitespace-nowrap"
                >
                    {isLoading ? "Fetching..." : "0.00"}
                </div>

                {!account && (
                    <div className="mt-6 flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse" />
                        <span className="text-white/40 text-sm font-geist-sans">Simulation Active</span>
                    </div>
                )}

                {account && balance && (
                    <div className="mt-4 flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        <span className="text-white/40 text-xs font-geist-sans">
                            {account.address.slice(0, 6)}...{account.address.slice(-4)} · {activeChain?.name || "Ethereum"}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
