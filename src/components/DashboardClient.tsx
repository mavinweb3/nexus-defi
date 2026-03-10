"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const HeroTicker = dynamic(() => import("@/components/HeroTicker"), { ssr: false });
const AssetVault = dynamic(() => import("@/components/AssetVault"), { ssr: false });
const ClientConnectButton = dynamic(() => import("@/components/ClientConnectButton"), { ssr: false });
const SecurityPanel = dynamic(() => import("@/components/SecurityPanel"), { ssr: false });
const SettingsPanel = dynamic(() => import("@/components/SettingsPanel"), { ssr: false });

type Section = "Dashboard" | "Assets" | "Security" | "Settings";

export default function DashboardClient() {
    const [activeSection, setActiveSection] = useState<Section>("Dashboard");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleNavigate = (section: string) => {
        setActiveSection(section as Section);
        setMobileMenuOpen(false);
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white antialiased overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col flex-shrink-0 z-20 backdrop-blur-[12px] bg-black/40">
                <div className="p-8 border-b border-white/10">
                    <h1 className="text-xl font-geist-sans tracking-tighter text-white font-bold">
                        MAVIN <span className="opacity-40 font-light">LABS</span>
                    </h1>
                </div>

                <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
                    {(["Dashboard", "Assets", "Security", "Settings"] as Section[]).map((item) => (
                        <button
                            key={item}
                            onClick={() => setActiveSection(item)}
                            className={`px-4 py-3 cursor-pointer font-geist-sans text-sm tracking-wide transition-all duration-300 text-left ${activeSection === item
                                ? "bg-white/5 border-l-2 border-white text-white rounded-r-xl"
                                : "text-white/40 hover:bg-white/5 hover:text-white rounded-xl border-l-2 border-transparent"
                                }`}
                        >
                            {item}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/10">
                    <ClientConnectButton />
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <aside
                        className="absolute left-0 top-0 bottom-0 w-64 backdrop-blur-[12px] bg-[#0a0a0a]/95 border-r border-white/10 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h1 className="text-xl font-geist-sans tracking-tighter text-white font-bold">
                                MAVIN <span className="opacity-40 font-light">LABS</span>
                            </h1>
                            <button onClick={() => setMobileMenuOpen(false)} className="text-white/40 hover:text-white text-xl cursor-pointer">✕</button>
                        </div>

                        <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
                            {(["Dashboard", "Assets", "Security", "Settings"] as Section[]).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => handleNavigate(item)}
                                    className={`px-4 py-3 cursor-pointer font-geist-sans text-sm tracking-wide transition-all text-left ${activeSection === item
                                        ? "bg-white/5 border-l-2 border-white text-white rounded-r-xl"
                                        : "text-white/40 hover:bg-white/5 hover:text-white rounded-xl border-l-2 border-transparent"
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </nav>

                        <div className="p-6 border-t border-white/10">
                            <ClientConnectButton />
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="text-white/60 hover:text-white transition-colors cursor-pointer text-lg"
                    >
                        ☰
                    </button>
                    <h1 className="text-sm font-geist-sans tracking-tighter text-white font-bold">
                        MAVIN <span className="opacity-40 font-light">LABS</span>
                    </h1>
                    <ClientConnectButton />
                </div>

                <div className="min-h-full max-w-7xl mx-auto pb-24 px-4 sm:px-8 xl:px-12 flex flex-col items-center justify-start relative z-10 pt-10 md:pt-12">
                    {/* Section Router */}
                    {activeSection === "Dashboard" && (
                        <>
                            <div className="w-full flex justify-center mb-16">
                                <HeroTicker />
                            </div>
                            <div className="w-full">
                                <AssetVault />
                            </div>
                        </>
                    )}

                    {activeSection === "Assets" && (
                        <div className="w-full">
                            <AssetVault />
                        </div>
                    )}

                    {activeSection === "Security" && (
                        <div className="w-full">
                            <SecurityPanel />
                        </div>
                    )}

                    {activeSection === "Settings" && (
                        <div className="w-full">
                            <SettingsPanel />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
