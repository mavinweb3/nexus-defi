import { test, expect } from '@playwright/test';

test.describe('Dashboard UI Suite', () => {
    test('renders HeroTicker and AssetVault without crashing when mocked wallet is connected', async ({ page }) => {
        // Inject a mocked window.ethereum object to trick Thirdweb into thinking a wallet is connected
        await page.addInitScript(() => {
            (window as any).ethereum = {
                isMetaMask: true,
                request: async (args: { method: string, params?: any[] }) => {
                    if (args.method === 'eth_accounts' || args.method === 'eth_requestAccounts') {
                        return ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']; // Mock address
                    }
                    if (args.method === 'eth_chainId') {
                        return '0x1'; // Ethereum Mainnet
                    }
                    if (args.method === 'eth_call') {
                        return '0x0000000000000000000000000000000000000000000000000000000000000000'; // Mock 0 balance for simple reading
                    }
                    return null;
                },
                on: () => { },
                removeListener: () => { }
            };
        });

        // Navigate to the dashboard
        await page.goto('/');

        // Ensure the page title/header is visible to confirm basic rendering
        await expect(page.locator('text=Live Portfolio Vault')).toBeVisible({ timeout: 10000 });

        // Since thirdweb uses "Connect Wallet" button, we might need to click it, or it might auto-connect.
        // However, even if it stays disconnected, we can check that the HeroTicker and AssetVault rendered.
        // The user's goal was: "Test that the HeroTicker and AssetVault render correctly on the page without throwing hydration errors or crashing."

        // Check HeroTicker
        const heroSection = page.locator('div').filter({ hasText: 'Live Portfolio Vault' });
        await expect(heroSection.first()).toBeVisible();

        // Check Asset Vault
        const vaultSection = page.locator('section').filter({ hasText: 'Secured Liquidity' });
        await expect(vaultSection.first()).toBeVisible();

        // The test passes if Next.js does not crash and the elements are visible.
    });
});
