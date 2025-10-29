import type { Abi, Address, Hex } from 'viem';
export type CallInput = {
    target: Address;
    value?: bigint;
    abi?: Abi;
    functionName?: string;
    args?: readonly unknown[];
};
export type EncodedCall = {
    target: Address;
    value: bigint;
    callData: Hex;
};
export declare function encodeForwarderCall(call: CallInput): EncodedCall;
export declare function encodeCalls(calls: CallInput[]): EncodedCall[];
