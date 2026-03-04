'use client';

/**
 * useApi — SWR-style data fetching hook with request deduplication
 *
 * Features:
 *  - Automatic request deduplication (same URL only fetches once)
 *  - Stale-while-revalidate caching (returns cached data instantly, refetches in background)
 *  - Consistent loading/error/data state for all API consumers
 *  - Integrates with authenticatedFetch for JWT + refresh token flow
 *  - Manual refetch via returned `mutate` callback
 *
 * Usage:
 *   const { data, error, isLoading, mutate } = useApi<Player[]>('/api/players');
 *   const { data: groups } = useApi<Group[]>('/api/player-groups');
 *
 *   // Skip the request conditionally:
 *   const { data } = useApi<Player>(playerId ? `/api/players/${playerId}` : null);
 *
 *   // Mutate (refetch) after a mutation:
 *   await authenticatedFetch(`${API_URL}/api/players/${id}`, { method: 'DELETE' });
 *   mutate(); // refetch the list
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { authenticatedFetch } from '@/lib/auth';
import { API_URL } from '@/lib/api';

// ─── In-flight request deduplication cache ───────────────────────────────────
// Prevents multiple components mounting simultaneously from triggering
// duplicate API calls for the same URL.
const inflightRequests = new Map<string, Promise<unknown>>();

// ─── Stale data cache (SWR pattern) ─────────────────────────────────────────
// Returns cached data immediately while revalidating in the background.
const dataCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

interface UseApiResult<T> {
    data: T | null;
    error: string | null;
    isLoading: boolean;
    mutate: () => void;
}

export function useApi<T = unknown>(path: string | null): UseApiResult<T> {
    const [data, setData] = useState<T | null>(() => {
        // Initialize from cache if available (instant render)
        if (path) {
            const cached = dataCache.get(path);
            if (cached) return cached.data as T;
        }
        return null;
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!path);
    const mountedRef = useRef(true);
    const fetchCountRef = useRef(0);

    const fetchData = useCallback(async () => {
        if (!path) {
            setData(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        const url = `${API_URL}${path}`;
        const thisFetch = ++fetchCountRef.current;

        // Return cached data immediately if fresh
        const cached = dataCache.get(path);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            setData(cached.data as T);
            setIsLoading(false);
            return;
        }

        // Show stale data while revalidating (don't show loading spinner)
        if (cached) {
            setData(cached.data as T);
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }

        try {
            // Deduplicate: if an identical request is already in flight, piggyback
            let promise = inflightRequests.get(url) as Promise<T> | undefined;
            if (!promise) {
                promise = (async () => {
                    const response = await authenticatedFetch(url);
                    if (!response.ok) {
                        throw new Error(`API error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })();
                inflightRequests.set(url, promise);
            }

            const result = await promise;

            // Only update state if this is still the latest fetch and component is mounted
            if (mountedRef.current && thisFetch === fetchCountRef.current) {
                setData(result as T);
                setError(null);
                setIsLoading(false);

                // Update cache
                dataCache.set(path, { data: result, timestamp: Date.now() });
            }
        } catch (err: unknown) {
            if (mountedRef.current && thisFetch === fetchCountRef.current) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsLoading(false);
            }
        } finally {
            inflightRequests.delete(url);
        }
    }, [path]);

    useEffect(() => {
        mountedRef.current = true;
        fetchData();
        return () => {
            mountedRef.current = false;
        };
    }, [fetchData]);

    const mutate = useCallback(() => {
        // Invalidate cache and refetch
        if (path) {
            dataCache.delete(path);
        }
        fetchData();
    }, [path, fetchData]);

    return { data, error, isLoading, mutate };
}

/**
 * Utility: invalidate all cached data
 * Useful after major state changes like org switching.
 */
export function invalidateAllApiCache() {
    dataCache.clear();
}
