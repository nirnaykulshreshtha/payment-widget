'use client';

import { useMemo } from 'react';
import { createAcrossClient, getAcrossClient, AcrossClient } from '@across-protocol/app-sdk';
import type { Chain } from 'viem';

interface UseAcrossClientParams {
  integratorId?: `0x${string}`;
  chains: Chain[];
  useTestnet?: boolean;
  apiUrl?: string;
  indexerUrl?: string;
  pollingInterval?: number;
}

interface UseAcrossClientReturn {
  client: AcrossClient | null;
  error: string | null;
}

export function useAcrossClient({ integratorId, chains, useTestnet, apiUrl, indexerUrl, pollingInterval }: UseAcrossClientParams): UseAcrossClientReturn {
  return useMemo(() => {
    if (!chains || chains.length === 0) {
      return { client: null, error: 'No chains configured for Across client' };
    }

    try {
      const options: Parameters<typeof createAcrossClient>[0] & {
        apiUrl?: string;
        indexerUrl?: string;
      } = {
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
    } catch (err) {
      try {
        const existing = getAcrossClient();
        return { client: existing, error: null };
      } catch (fallbackError) {
        const message = err instanceof Error ? err.message : 'Failed to initialise Across client';
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : undefined;
        return { client: null, error: fallbackMessage ? `${message}. ${fallbackMessage}` : message };
      }
    }
  }, [integratorId, chains, useTestnet, apiUrl, indexerUrl, pollingInterval]);
}
