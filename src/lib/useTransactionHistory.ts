"use client";

import { useState, useEffect } from "react";

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
    isError: string;
    functionName: string;
}

// Block explorer API endpoints per chain
const EXPLORER_APIS: Record<number, string> = {
    1: "https://api.etherscan.io/api",
    137: "https://api.polygonscan.com/api",
    42161: "https://api.arbiscan.io/api",
    10: "https://api-optimistic.etherscan.io/api",
    8453: "https://api.basescan.org/api",
    56: "https://api.bscscan.com/api",
};

const NATIVE_SYMBOLS: Record<number, string> = {
    1: "ETH", 137: "POL", 42161: "ETH", 10: "ETH", 8453: "ETH", 56: "BNB",
};

const NATIVE_DECIMALS = 18;

/**
 * Fetches the last N transactions for a wallet address on a given chain.
 * Uses free-tier block explorer APIs (rate-limited).
 */
export function useTransactionHistory(
    address: string | undefined,
    chainId: number,
    count: number = 10
): {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    nativeSymbol: string;
} {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const nativeSymbol = NATIVE_SYMBOLS[chainId] || "ETH";

    useEffect(() => {
        if (!address) {
            setTransactions([]);
            return;
        }

        const apiBase = EXPLORER_APIS[chainId];
        if (!apiBase) {
            setError(`No explorer API for chain ${chainId}`);
            return;
        }

        setIsLoading(true);
        setError(null);

        const etherscanKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

        // V1 explorers are deprecated. We must use Etherscan V2 for all chains.
        let url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${count}&sort=desc`;

        if (etherscanKey) {
            url += `&apikey=${etherscanKey}`;
        }

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "1" && Array.isArray(data.result)) {
                    setTransactions(data.result);
                } else if (data.message === "No transactions found") {
                    setTransactions([]);
                } else if (data.message === "NOTOK" || data.status === "0") {
                    const errMsg = typeof data.result === "string" ? data.result : String(data.result || "");

                    if (errMsg.includes("rate limit") || errMsg.includes("Max rate limit reached")) {
                        setError("Explorer API rate limit reached. Try again later.");
                    } else if (errMsg.includes("Invalid API Key") || errMsg.includes("Missing")) {
                        setError("Etherscan API key required. Add NEXT_PUBLIC_ETHERSCAN_API_KEY to your .env.local file.");
                    } else if (errMsg.includes("Free API access is not supported for this chain")) {
                        setError(`Etherscan Free Tier does not support ${nativeSymbol}. Upgrade your Etherscan plan or switch to Ethereum.`);
                    } else if (errMsg.includes("deprecated V1")) {
                        setError("Etherscan API key required for transaction history. Please add NEXT_PUBLIC_ETHERSCAN_API_KEY to your .env.local file.");
                    } else {
                        setError(errMsg || "Explorer API error");
                    }
                    setTransactions([]);
                } else {
                    setError(data.message || "Failed to fetch transactions");
                }
                setIsLoading(false);
            })
            .catch((err) => {
                console.warn("Mavin | Tx history fetch failed:", err);
                setError("Network error fetching transactions");
                setIsLoading(false);
            });
    }, [address, chainId, count]);

    return { transactions, isLoading, error, nativeSymbol };
}

/**
 * Format wei value to human-readable
 */
export function formatTxValue(weiValue: string, symbol: string): string {
    const value = parseFloat(weiValue) / Math.pow(10, NATIVE_DECIMALS);
    if (value === 0) return "0 " + symbol;
    if (value < 0.001) return `< 0.001 ${symbol}`;
    return `${value.toFixed(4)} ${symbol}`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: string): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - parseInt(timestamp, 10);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(parseInt(timestamp, 10) * 1000).toLocaleDateString();
}
