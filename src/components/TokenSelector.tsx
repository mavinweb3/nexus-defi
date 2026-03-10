"use client";

import { useRef, useState } from "react";
import { useActiveWalletChain } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { defineChain } from "thirdweb";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { client } from "@/lib/client";
import { useCustomTokens, type CustomToken } from "@/lib/useCustomTokens";
import { CHAIN_NAMES } from "@/lib/tokenRegistry";

export default function TokenSelector({ onClose }: { onClose: () => void }) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const activeChain = useActiveWalletChain();
    const chainId = activeChain?.id || 1;
    const { tokens, addToken, removeToken, getTokensForChain } = useCustomTokens();

    const [addressInput, setAddressInput] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState("");
    const [fetchedToken, setFetchedToken] = useState<{ name: string; symbol: string; decimals: number } | null>(null);

    const chainTokens = getTokensForChain(chainId);

    // GSAP entrance
    useGSAP(() => {
        if (!overlayRef.current || !modalRef.current) return;
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modalRef.current, { y: 30, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: "power3.out", delay: 0.1 });
    }, []);

    const handleClose = () => {
        if (!overlayRef.current || !modalRef.current) { onClose(); return; }
        gsap.to(modalRef.current, { y: 20, opacity: 0, duration: 0.2 });
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, onComplete: onClose });
    };

    // Validate a token contract address by reading name(), symbol(), decimals()
    const handleValidate = async () => {
        if (!addressInput.match(/^0x[a-fA-F0-9]{40}$/)) {
            setError("Invalid address format. Must be 0x followed by 40 hex characters.");
            return;
        }

        setIsValidating(true);
        setError("");
        setFetchedToken(null);

        try {
            const contract = getContract({
                client,
                chain: defineChain(chainId),
                address: addressInput as `0x${string}`,
            });

            const [name, symbol, decimals] = await Promise.all([
                readContract({ contract, method: "function name() view returns (string)" }),
                readContract({ contract, method: "function symbol() view returns (string)" }),
                readContract({ contract, method: "function decimals() view returns (uint8)" }),
            ]);

            setFetchedToken({ name: name as string, symbol: symbol as string, decimals: Number(decimals) });
        } catch (err) {
            console.error("Token validation failed:", err);
            setError("Could not read token data. Is this a valid ERC-20 contract on this chain?");
        } finally {
            setIsValidating(false);
        }
    };

    const handleAdd = () => {
        if (!fetchedToken) return;
        addToken({
            address: addressInput as `0x${string}`,
            symbol: fetchedToken.symbol,
            name: fetchedToken.name,
            decimals: fetchedToken.decimals,
            chainId,
        });
        setAddressInput("");
        setFetchedToken(null);
    };

    return (
        <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center opacity-0" onClick={handleClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative w-full max-w-lg mx-4 rounded-2xl backdrop-blur-[12px] bg-[#0a0a0a] border border-white/10 p-6 shadow-[0_16px_64px_0_rgba(0,0,0,0.9)] opacity-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Noise */}
                <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none mix-blend-overlay z-0 rounded-2xl">
                    <filter id="noise-modal"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" /></filter>
                    <rect width="100%" height="100%" filter="url(#noise-modal)" fill="white" />
                </svg>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-white text-lg font-geist-sans tracking-tighter font-bold">Manage Tokens</h3>
                            <span className="text-white/30 text-xs font-geist-sans">
                                {CHAIN_NAMES[chainId] || "Unknown"} · Chain #{chainId}
                            </span>
                        </div>
                        <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors text-xl cursor-pointer">
                            ✕
                        </button>
                    </div>

                    {/* Add Token Input */}
                    <div className="mb-6">
                        <label className="text-white/30 text-[10px] font-geist-sans tracking-widest uppercase block mb-2">
                            Token Contract Address
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={addressInput}
                                onChange={(e) => { setAddressInput(e.target.value); setError(""); setFetchedToken(null); }}
                                placeholder="0x..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-geist-mono placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            />
                            <button
                                onClick={handleValidate}
                                disabled={isValidating || !addressInput}
                                className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/80 text-xs font-geist-sans tracking-widest uppercase hover:bg-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isValidating ? "..." : "Lookup"}
                            </button>
                        </div>

                        {error && (
                            <p className="text-red-400/80 text-xs font-geist-sans mt-2">{error}</p>
                        )}

                        {/* Fetched Token Preview */}
                        {fetchedToken && (
                            <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-geist-sans">{fetchedToken.name}</span>
                                    <span className="text-white/40 text-xs font-geist-mono">{fetchedToken.symbol} · {fetchedToken.decimals} decimals</span>
                                </div>
                                <button
                                    onClick={handleAdd}
                                    className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-geist-sans tracking-widest uppercase hover:bg-emerald-500/30 transition-all cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Current Custom Tokens */}
                    <div>
                        <span className="text-white/30 text-[10px] font-geist-sans tracking-widest uppercase block mb-3">
                            Your Custom Tokens ({chainTokens.length})
                        </span>

                        {chainTokens.length === 0 ? (
                            <div className="text-center py-6">
                                <span className="text-white/20 text-sm font-geist-sans">
                                    No custom tokens added on this chain
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                {chainTokens.map((token) => (
                                    <div key={`${token.chainId}-${token.address}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                <span className="text-[10px] font-geist-mono text-white/60">{token.symbol.slice(0, 3)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-geist-sans">{token.name}</span>
                                                <span className="text-white/30 text-[10px] font-geist-mono">
                                                    {token.address.slice(0, 8)}...{token.address.slice(-6)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeToken(token.address, token.chainId)}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400/80 text-[10px] font-geist-sans tracking-widest uppercase hover:bg-red-500/20 transition-all cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
