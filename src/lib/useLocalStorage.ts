"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook that syncs React state with localStorage.
 * SSR-safe: reads from localStorage only after mount.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(defaultValue);
    const [hydrated, setHydrated] = useState(false);

    // Read from localStorage after mount (SSR-safe)
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item !== null) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.warn(`useLocalStorage: Error reading key "${key}"`, error);
        }
        setHydrated(true);
    }, [key]);

    // Write to localStorage whenever value changes (after hydration)
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setStoredValue((prev) => {
            const nextValue = value instanceof Function ? value(prev) : value;
            try {
                window.localStorage.setItem(key, JSON.stringify(nextValue));
                // Dispatch custom event for same-tab reactivity
                window.dispatchEvent(new CustomEvent("mavin-storage", { detail: { key, nextValue } }));
            } catch (error) {
                console.warn(`useLocalStorage: Error writing key "${key}"`, error);
            }
            return nextValue;
        });
    }, [key]);

    // Listen for storage changes from other components/tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                setStoredValue(JSON.parse(e.newValue));
            }
        };

        const handleCustomChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail.key === key) {
                setStoredValue(customEvent.detail.nextValue);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("mavin-storage", handleCustomChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("mavin-storage", handleCustomChange);
        };
    }, [key]);

    // Return default until hydrated to avoid hydration mismatch
    return [hydrated ? storedValue : defaultValue, setValue];
}
