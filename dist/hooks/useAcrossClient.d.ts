import { AcrossClient } from '@across-protocol/app-sdk';
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
export declare function useAcrossClient({ integratorId, chains, useTestnet, apiUrl, indexerUrl, pollingInterval }: UseAcrossClientParams): UseAcrossClientReturn;
export {};
