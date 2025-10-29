import type { Abi, Address, Hex } from 'viem';
import type { PaymentConfig } from '../types';
export type ForwarderCallInput = {
    target: Address;
    value?: bigint | number | string;
    data?: Hex;
    abi?: Abi;
    functionName?: string;
    args?: readonly unknown[];
};
export type EncodedForwarderCall = {
    target: Address;
    value: bigint;
    data: Hex;
};
export type BuildCallForwarderTargetCallParams = {
    forwarderAddress: Address;
    calls: ForwarderCallInput[];
    allowFailure?: boolean;
    passthroughValue?: bigint | number | string;
};
export declare const callForwarderAbi: readonly [{
    readonly inputs: readonly [{
        readonly components: readonly [{
            readonly internalType: "address";
            readonly name: "target";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "value";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly internalType: "struct CallForwarder.ForwardCall[]";
        readonly name: "calls";
        readonly type: "tuple[]";
    }, {
        readonly internalType: "bool";
        readonly name: "allowFailure";
        readonly type: "bool";
    }];
    readonly name: "executeCalls";
    readonly outputs: readonly [{
        readonly internalType: "bool[]";
        readonly name: "successes";
        readonly type: "bool[]";
    }, {
        readonly internalType: "bytes[]";
        readonly name: "results";
        readonly type: "bytes[]";
    }];
    readonly stateMutability: "payable";
    readonly type: "function";
}];
type TargetContractCall = NonNullable<PaymentConfig['targetContractCall']>;
export declare function encodeForwarderCall(call: ForwarderCallInput): EncodedForwarderCall;
export declare function encodeForwarderCalls(calls: ForwarderCallInput[]): EncodedForwarderCall[];
export declare function buildCallForwarderExecuteCalldata(params: {
    calls: ForwarderCallInput[];
    allowFailure?: boolean;
}): {
    calldata: Hex;
    encodedCalls: EncodedForwarderCall[];
};
export declare function buildCallForwarderTargetCall(params: BuildCallForwarderTargetCallParams): {
    targetContractCall: TargetContractCall;
    encodedCalls: EncodedForwarderCall[];
};
export {};
