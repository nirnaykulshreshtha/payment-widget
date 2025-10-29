import type { Abi, Address, Hex } from 'viem';
import { encodeFunctionData, isAddress, isHex } from 'viem';

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

export const callForwarderAbi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct CallForwarder.ForwardCall[]',
        name: 'calls',
        type: 'tuple[]',
      },
      {
        internalType: 'bool',
        name: 'allowFailure',
        type: 'bool',
      },
    ],
    name: 'executeCalls',
    outputs: [
      {
        internalType: 'bool[]',
        name: 'successes',
        type: 'bool[]',
      },
      {
        internalType: 'bytes[]',
        name: 'results',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
] as const satisfies Abi;

type TargetContractCall = NonNullable<PaymentConfig['targetContractCall']>;

export function encodeForwarderCall(call: ForwarderCallInput): EncodedForwarderCall {
  if (!isAddress(call.target)) {
    throw new Error(`Invalid target address: ${call.target}`);
  }

  const value = normalizeToBigInt(call.value);

  const hasEncodingInputs = call.abi && call.functionName;
  const hasPrebuiltData = typeof call.data === 'string';

  if (!hasEncodingInputs && !hasPrebuiltData) {
    throw new Error('Either `data` or (`abi` and `functionName`) must be provided for forwarder call encoding.');
  }

  if (hasEncodingInputs && hasPrebuiltData) {
    throw new Error('Provide either `data` or (`abi` and `functionName`), but not both.');
  }

  let data: Hex;
  if (hasPrebuiltData) {
    if (!isHex(call.data!, { strict: false })) {
      throw new Error('Forwarder call `data` must be a valid hex string.');
    }
    data = call.data!;
  } else {
    data = encodeFunctionData({
      abi: call.abi!,
      functionName: call.functionName!,
      args: call.args ?? [],
    });
  }

  return {
    target: call.target,
    value,
    data,
  };
}

export function encodeForwarderCalls(calls: ForwarderCallInput[]): EncodedForwarderCall[] {
  if (!calls.length) {
    throw new Error('At least one call must be provided to encode forwarder calls.');
  }

  return calls.map(encodeForwarderCall);
}

export function buildCallForwarderExecuteCalldata(params: {
  calls: ForwarderCallInput[];
  allowFailure?: boolean;
}): { calldata: Hex; encodedCalls: EncodedForwarderCall[] } {
  const encodedCalls = encodeForwarderCalls(params.calls);
  const calldata = encodeFunctionData({
    abi: callForwarderAbi,
    functionName: 'executeCalls',
    args: [encodedCalls, params.allowFailure ?? false],
  });

  return { calldata, encodedCalls };
}

export function buildCallForwarderTargetCall(
  params: BuildCallForwarderTargetCallParams,
): { targetContractCall: TargetContractCall; encodedCalls: EncodedForwarderCall[] } {
  if (!isAddress(params.forwarderAddress)) {
    throw new Error(`Invalid forwarder address: ${params.forwarderAddress}`);
  }

  const { calldata, encodedCalls } = buildCallForwarderExecuteCalldata({
    calls: params.calls,
    allowFailure: params.allowFailure,
  });

  const passthrough = normalizeToBigInt(params.passthroughValue);

  const targetContractCall: TargetContractCall = {
    target: params.forwarderAddress,
    callData: calldata,
  };

  if (passthrough > 0n) {
    targetContractCall.value = passthrough;
  }

  return { targetContractCall, encodedCalls };
}

function normalizeToBigInt(value: ForwarderCallInput['value'] | BuildCallForwarderTargetCallParams['passthroughValue']): bigint {
  if (value === undefined) {
    return 0n;
  }
  if (typeof value === 'bigint') {
    if (value < 0) {
      throw new Error('Forwarder call value cannot be negative.');
    }
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Error('Forwarder call value must be an integer when provided as a number.');
    }
    if (value < 0) {
      throw new Error('Forwarder call value cannot be negative.');
    }
    return BigInt(value);
  }
  if (typeof value === 'string') {
    if (value.trim().startsWith('-')) {
      throw new Error('Forwarder call value cannot be negative.');
    }
    if (value.includes('.')) {
      throw new Error('Forwarder call value must be an integer when provided as a string.');
    }
    const parsed = BigInt(value);
    if (parsed < 0) {
      throw new Error('Forwarder call value cannot be negative.');
    }
    return parsed;
  }
  throw new Error('Unsupported value type for forwarder call.');
}
