"use client";

import { useState, useEffect } from "react";
import { getContract, readContract, prepareContractCall, sendTransaction } from "thirdweb";
import { defineChain } from "thirdweb";
import { client } from "@/lib/client";
import { getTokensForChain } from "@/lib/tokenRegistry";

// Common DeFi router/spender addresses to check for approvals
const COMMON_SPENDERS: Record<string, string> = {
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D": "Uniswap V2 Router",
    "0xE592427A0AEce92De3Edee1F18E0157C05861564": "Uniswap V3 Router",
    "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F": "SushiSwap Router",
    "0x1111111254EEB25477B68fb85Ed929f73A960582": "1inch Router",
};

export interface TokenApproval {
    tokenName: string;
    tokenSymbol: string;
    tokenAddress: `0x${string}`;
    spenderName: string;
    spenderAddress: `0x${string}`;
    allowance: string; // "unlimited" or formatted amount
    chainId: number;
}

/**
 * Checks ERC-20 allowances for the user's tokens against common spenders.
 */
export function useTokenApprovals(
    walletAddress: string | undefined,
    chainId: number
): {
    approvals: TokenApproval[];
    isLoading: boolean;
    revokeApproval: (tokenAddress: `0x${string}`, spenderAddress: `0x${string}`, account: any) => Promise<boolean>;
} {
    const [approvals, setApprovals] = useState<TokenApproval[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!walletAddress) {
            setApprovals([]);
            return;
        }

        const tokens = getTokensForChain(chainId);
        if (tokens.length === 0) return;

        setIsLoading(true);

        const checkApprovals = async () => {
            const results: TokenApproval[] = [];
            const spenderEntries = Object.entries(COMMON_SPENDERS);

            for (const token of tokens) {
                for (const [spenderAddr, spenderName] of spenderEntries) {
                    try {
                        const contract = getContract({
                            client,
                            chain: defineChain(chainId),
                            address: token.address,
                        });

                        const allowance = await readContract({
                            contract,
                            method: "function allowance(address owner, address spender) view returns (uint256)",
                            params: [walletAddress as `0x${string}`, spenderAddr as `0x${string}`],
                        });

                        const allowanceBigInt = BigInt(allowance.toString());

                        if (allowanceBigInt > BigInt(0)) {
                            // Max uint256 = unlimited
                            const isUnlimited = allowanceBigInt >= BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935") / BigInt(2);

                            results.push({
                                tokenName: token.name,
                                tokenSymbol: token.symbol,
                                tokenAddress: token.address,
                                spenderName,
                                spenderAddress: spenderAddr as `0x${string}`,
                                allowance: isUnlimited ? "Unlimited" : (Number(allowanceBigInt) / Math.pow(10, token.decimals)).toFixed(2),
                                chainId,
                            });
                        }
                    } catch {
                        // Contract may not exist on this chain, skip
                    }
                }
            }

            setApprovals(results);
            setIsLoading(false);
        };

        checkApprovals();
    }, [walletAddress, chainId]);

    const revokeApproval = async (
        tokenAddress: `0x${string}`,
        spenderAddress: `0x${string}`,
        account: any
    ): Promise<boolean> => {
        try {
            const contract = getContract({
                client,
                chain: defineChain(chainId),
                address: tokenAddress,
            });

            const transaction = prepareContractCall({
                contract,
                method: "function approve(address spender, uint256 amount)",
                params: [spenderAddress, BigInt(0)],
            });

            await sendTransaction({ account, transaction });

            // Remove from local state after successful revocation
            setApprovals((prev) =>
                prev.filter((a) => !(a.tokenAddress === tokenAddress && a.spenderAddress === spenderAddress))
            );

            return true;
        } catch (error) {
            console.error("Revoke failed:", error);
            return false;
        }
    };

    return { approvals, isLoading, revokeApproval };
}
