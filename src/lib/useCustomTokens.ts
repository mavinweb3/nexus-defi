"use client";

import { useLocalStorage } from "./useLocalStorage";

export interface CustomToken {
    address: `0x${string}`;
    symbol: string;
    name: string;
    decimals: number;
    chainId: number;
    addedAt: number;
}

const STORAGE_KEY = "mavin_custom_tokens";

/**
 * Hook to manage user's custom token list, persisted to localStorage.
 */
export function useCustomTokens() {
    const [tokens, setTokens] = useLocalStorage<CustomToken[]>(STORAGE_KEY, []);

    const addToken = (token: Omit<CustomToken, "addedAt">) => {
        setTokens((prev) => {
            // Prevent duplicates on same chain
            if (prev.some((t) => t.address.toLowerCase() === token.address.toLowerCase() && t.chainId === token.chainId)) {
                return prev;
            }
            return [...prev, { ...token, addedAt: Date.now() }];
        });
    };

    const removeToken = (address: string, chainId: number) => {
        setTokens((prev) =>
            prev.filter((t) => !(t.address.toLowerCase() === address.toLowerCase() && t.chainId === chainId))
        );
    };

    const getTokensForChain = (chainId: number) => {
        return tokens.filter((t) => t.chainId === chainId);
    };

    return { tokens, addToken, removeToken, getTokensForChain };
}
