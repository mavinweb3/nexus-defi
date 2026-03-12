"use client";

import { useRef } from "react";
import { useActiveWalletChain } from "thirdweb/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CHAIN_NAMES, SUPPORTED_CHAIN_IDS } from "@/lib/tokenRegistry";
import { useLocalStorage } from "@/lib/useLocalStorage";

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
        <div ref={cardRef} className={`relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-white/[0.02] border border-white/[0.08] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.8)] opacity-0 ${className}`}>
            <div className="relative z-10">{children}</div>
        </div>
    );
}

// Working toggle persisted to localStorage
function ToggleSwitch({ label, storageKey, defaultEnabled = false }: { label: string; storageKey: string; defaultEnabled?: boolean }) {
    const [enabled, setEnabled] = useLocalStorage(storageKey, defaultEnabled);

    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-white/80 text-sm font-geist-sans">{label}</span>
            <button
                onClick={() => setEnabled(!enabled)}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${enabled ? "bg-emerald-500/30 border-emerald-500/50" : "bg-white/5 border-white/10"} border`}
                aria-label={`Toggle ${label}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${enabled ? "left-[22px] bg-emerald-400" : "left-0.5 bg-white/40"}`} />
            </button>
        </div>
    );
}

export default function SettingsPanel() {
    const activeChain = useActiveWalletChain();

    return (
        <section className="w-full">
            <h2 className="text-white/60 text-sm font-geist-sans tracking-[0.3em] uppercase mb-8 ml-2">
                Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Network Preferences */}
                <GlassCard delay={0}>
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-white/40 text-xs font-geist-sans tracking-[0.2em] uppercase font-semibold">
                            Network Preferences
                        </span>
                    </div>

                    <div className="mb-4">
                        <span className="text-white/30 text-[10px] font-geist-sans tracking-widest uppercase">Active Network</span>
                        <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className={`w-2 h-2 rounded-full ${activeChain ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-white/20"}`} />
                            <span className="text-white text-sm font-geist-sans">
                                {activeChain ? (CHAIN_NAMES[activeChain.id] || activeChain.name) : "Not connected"}
                            </span>
                            {activeChain && (
                                <span className="text-white/30 text-[10px] font-geist-mono ml-auto">
                                    ID: {activeChain.id}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <span className="text-white/30 text-[10px] font-geist-sans tracking-widest uppercase">Supported Chains</span>
                        <p className="text-white/20 text-[10px] font-geist-sans mt-1 mb-2">
                            Switch chains in your wallet app to change networks
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            {SUPPORTED_CHAIN_IDS.map((chainId) => (
                                <div
                                    key={chainId}
                                    className={`px-3 py-2 rounded-lg text-xs font-geist-sans transition-all ${activeChain?.id === chainId
                                            ? "bg-white/10 text-white border border-white/20"
                                            : "bg-white/5 text-white/40 border border-white/5"
                                        }`}
                                >
                                    <span className="block">{CHAIN_NAMES[chainId]}</span>
                                    <span className="text-[10px] text-white/20 font-geist-mono">#{chainId}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                {/* Display Preferences — persisted to localStorage */}
                <GlassCard delay={0.1}>
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-white/40 text-xs font-geist-sans tracking-[0.2em] uppercase font-semibold">
                            Display Preferences
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <ToggleSwitch label="Animate Balances" storageKey="mavin_animate_balances" defaultEnabled={true} />
                        <ToggleSwitch label="Show USD Values" storageKey="mavin_show_usd" defaultEnabled={true} />
                        <ToggleSwitch label="Compact Numbers" storageKey="mavin_compact_numbers" defaultEnabled={false} />
                    </div>

                    <p className="text-white/15 text-[10px] font-geist-sans mt-4 tracking-wider">
                        ✓ Preferences are saved and persist across sessions
                    </p>
                </GlassCard>

                {/* About */}
                <GlassCard className="md:col-span-2" delay={0.2}>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xl font-geist-sans tracking-tighter text-white font-bold">
                                MAVIN <span className="opacity-40 font-light">LABS</span>
                            </h3>
                            <span className="text-white/30 text-xs font-geist-sans">
                                Nexus DeFi Dashboard — Premium Web3 Portfolio Management
                            </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-white bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-geist-mono tracking-widest">
                                v0.1.0-alpha
                            </span>
                            <span className="text-white/20 text-[10px] font-geist-sans tracking-wider">
                                Powered by thirdweb v5
                            </span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </section>
    );
}
