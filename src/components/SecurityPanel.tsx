"use client";

import { useRef, useState } from "react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CHAIN_NAMES } from "@/lib/tokenRegistry";
import { useTransactionHistory, formatTxValue, formatRelativeTime } from "@/lib/useTransactionHistory";
import { useTokenApprovals } from "@/lib/useTokenApprovals";

// Reusable Mavin card wrapper
function GlassCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    const cardRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!cardRef.current) return;
        gsap.fromTo(cardRef.current,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay }
        );
    }, []);

    return (
        <div ref={cardRef} className={`relative overflow-hidden rounded-2xl backdrop-blur-[12px] bg-black/40 border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] opacity-0 ${className}`}>
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none mix-blend-overlay z-0">
                <filter id="noise-sec"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" /></filter>
                <rect width="100%" height="100%" filter="url(#noise-sec)" fill="white" />
            </svg>
            <div className="relative z-10">{children}</div>
        </div>
    );
}

export default function SecurityPanel() {
    const account = useActiveAccount();
    const activeChain = useActiveWalletChain();
    const chainId = activeChain?.id || 1;
    const chainName = activeChain ? (CHAIN_NAMES[activeChain.id] || activeChain.name || "Unknown") : "Not connected";

    const { transactions, isLoading: txLoading, error: txError, nativeSymbol } = useTransactionHistory(account?.address, chainId);
    const { approvals, isLoading: approvalsLoading, revokeApproval } = useTokenApprovals(account?.address, chainId);

    const [revokingId, setRevokingId] = useState<string | null>(null);

    const handleRevoke = async (tokenAddress: `0x${string}`, spenderAddress: `0x${string}`) => {
        if (!account) return;
        const id = `${tokenAddress}-${spenderAddress}`;
        setRevokingId(id);
        const success = await revokeApproval(tokenAddress, spenderAddress, account);
        if (!success) {
            alert("Revoke failed. Check the console for details.");
        }
        setRevokingId(null);
    };

    return (
        <section className="w-full">
            <h2 className="text-white/60 text-sm font-geist-sans tracking-[0.3em] uppercase mb-8 ml-2">
                Security Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wallet Guard */}
                <GlassCard className="md:col-span-2" delay={0}>
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-white/40 text-xs font-geist-sans tracking-[0.2em] uppercase font-semibold">
                            Wallet Guard
                        </span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${account ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"}`} />
                            <span className="text-white/60 text-xs font-geist-sans">
                                {account ? "Connected" : "Disconnected"}
                            </span>
                        </div>
                    </div>

                    {account ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-white/30 text-[10px] font-geist-sans tracking-widest uppercase">Address</span>
                                <span className="text-white text-sm font-geist-mono tracking-tight">
                                    {account.address.slice(0, 10)}...{account.address.slice(-8)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-white/30 text-[10px] font-geist-sans tracking-widest uppercase">Active Chain</span>
                                <span className="text-white text-sm font-geist-sans">{chainName}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-white/30 text-[10px] font-geist-sans tracking-widest uppercase">Chain ID</span>
                                <span className="text-white text-sm font-geist-mono">{activeChain?.id || "—"}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <span className="text-white/30 text-sm font-geist-sans">
                                Connect your wallet to view security details
                            </span>
                        </div>
                    )}
                </GlassCard>

                {/* Token Approvals */}
                <GlassCard delay={0.1}>
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-white/40 text-xs font-geist-sans tracking-[0.2em] uppercase font-semibold">
                            Token Approvals
                        </span>
                        {approvalsLoading && (
                            <span className="text-white/20 text-[10px] font-geist-sans animate-pulse">Scanning...</span>
                        )}
                    </div>

                    {!account ? (
                        <div className="text-center py-6">
                            <span className="text-white/20 text-sm font-geist-sans">Connect wallet to scan</span>
                        </div>
                    ) : approvals.length === 0 && !approvalsLoading ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2">
                            <span className="text-emerald-400/60 text-2xl">✓</span>
                            <span className="text-white/30 text-sm font-geist-sans text-center">
                                No active token approvals found
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                            {approvals.map((approval) => {
                                const id = `${approval.tokenAddress}-${approval.spenderAddress}`;
                                return (
                                    <div key={id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-white text-sm font-geist-sans">{approval.tokenSymbol}</span>
                                            <span className="text-white/30 text-[10px] font-geist-sans">{approval.spenderName}</span>
                                            <span className={`text-[10px] font-geist-mono ${approval.allowance === "Unlimited" ? "text-amber-400/60" : "text-white/20"}`}>
                                                {approval.allowance}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(approval.tokenAddress, approval.spenderAddress)}
                                            disabled={revokingId === id}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400/80 text-[10px] font-geist-sans tracking-widest uppercase hover:bg-red-500/20 transition-all disabled:opacity-30 cursor-pointer"
                                        >
                                            {revokingId === id ? "Revoking..." : "Revoke"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GlassCard>

                {/* Transaction History */}
                <GlassCard delay={0.2}>
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-white/40 text-xs font-geist-sans tracking-[0.2em] uppercase font-semibold">
                            Recent Transactions
                        </span>
                        {txLoading && (
                            <span className="text-white/20 text-[10px] font-geist-sans animate-pulse">Loading...</span>
                        )}
                    </div>

                    {!account ? (
                        <div className="text-center py-6">
                            <span className="text-white/20 text-sm font-geist-sans">Connect wallet to view</span>
                        </div>
                    ) : txError ? (
                        <div className="text-center py-6">
                            <span className="text-red-400/60 text-sm font-geist-sans">{txError}</span>
                        </div>
                    ) : transactions.length === 0 && !txLoading ? (
                        <div className="text-center py-6">
                            <span className="text-white/20 text-sm font-geist-sans">No transactions found</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                            {transactions.slice(0, 10).map((tx) => {
                                const isSent = tx.from.toLowerCase() === account.address.toLowerCase();
                                const isError = tx.isError === "1";
                                return (
                                    <div key={tx.hash} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-red-500" : isSent ? "bg-amber-400" : "bg-emerald-400"}`} />
                                            <div className="flex flex-col">
                                                <span className="text-white/80 text-sm font-geist-sans">
                                                    {isError ? "Failed" : isSent ? "Sent" : "Received"}
                                                </span>
                                                <span className="text-white/20 text-[10px] font-geist-mono">
                                                    {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-white/60 text-xs font-geist-mono">
                                                {formatTxValue(tx.value, nativeSymbol)}
                                            </span>
                                            <span className="text-white/20 text-[10px] font-geist-sans">{formatRelativeTime(tx.timeStamp)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GlassCard>
            </div>
        </section>
    );
}
