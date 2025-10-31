'use client';
import { useMemo } from 'react';
import { createAcrossClient, getAcrossClient } from '@across-protocol/app-sdk';
export function useAcrossClient({ integratorId, chains, useTestnet, apiUrl, indexerUrl, pollingInterval }) {
    return useMemo(() => {
        if (!chains || chains.length === 0) {
            return { client: null, error: 'No networks configured for the payment service' };
        }
        try {
            const options = {
                integratorId,
                chains,
                useTestnet,
                pollingInterval,
            };
            if (apiUrl) {
                options.apiUrl = apiUrl;
            }
            if (indexerUrl) {
                options.indexerUrl = indexerUrl;
            }
            const client = createAcrossClient(options);
            return { client, error: null };
        }
        catch (err) {
            try {
                const existing = getAcrossClient();
                return { client: existing, error: null };
            }
            catch (fallbackError) {
                const message = err instanceof Error ? err.message : 'Failed to start the payment service';
                const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : undefined;
                return { client: null, error: fallbackMessage ? `${message}. ${fallbackMessage}` : message };
            }
        }
    }, [integratorId, chains, useTestnet, apiUrl, indexerUrl, pollingInterval]);
}
