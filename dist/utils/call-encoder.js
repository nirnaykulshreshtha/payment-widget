import { encodeFunctionData, isAddress } from 'viem';
export function encodeForwarderCall(call) {
    if (!isAddress(call.target)) {
        throw new Error(`Invalid target address: ${call.target}`);
    }
    if (!(call.abi && call.functionName)) {
        throw new Error('Provide either `data` or (`abi` and `functionName`), but not both.');
    }
    let callData = encodeFunctionData({
        abi: call.abi,
        functionName: call.functionName,
        args: call.args ?? [],
    });
    return {
        target: call.target,
        value: call.value ?? 0n,
        callData,
    };
}
export function encodeCalls(calls) {
    if (!calls.length) {
        throw new Error('At least one call must be provided to encode calls.');
    }
    return calls.map(encodeForwarderCall);
}
