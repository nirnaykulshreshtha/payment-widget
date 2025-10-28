/**
 * PaymentWidget Example Usage
 *
 * Illustrates configuring the widget via the provider pattern so that setup
 * infrastructure is initialised once while rendering a single payment flow.
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Address } from 'viem';

import PaymentWidget, { PaymentWidgetProvider, createSetupConfig, getNetworkConfig } from './index';
import type { PaymentConfig, SetupConfig } from './types';
import { DEFAULT_WRAPPED_TOKEN_MAP } from './config';

const DEFAULT_AMOUNT = BigInt(11 * 1_000_000);

function buildExampleConfigs(isTestnet: boolean, walletClient?: SetupConfig['walletClient']) {
  const networkConfig = getNetworkConfig(isTestnet);
  const destinationChainId = isTestnet ? 84532 : 1;
  const targetTokenAddress = (isTestnet
    ? '0x4200000000000000000000000000000000000006'
    : '0xdAC17F958D2ee523a2206206994597C13D831ec7') as Address;

  const setupConfig = createSetupConfig({
    supportedChains: networkConfig.chains,
    walletClient,
    integratorId:
      (process.env.NEXT_PUBLIC_ACROSS_INTEGRATOR_ID as `0x${string}`) ??
      ('0x0000000000000000000000000000000000000000' as `0x${string}`),
    useTestnet: isTestnet,
    quoteRefreshMs: 45_000,
    wrappedTokenMap: DEFAULT_WRAPPED_TOKEN_MAP,
    tokenPricesUsd: {
      [destinationChainId]: {
        [targetTokenAddress.toLowerCase()]: 1,
      },
    },
    showUnavailableOptions: false,
  });

  const paymentConfig: PaymentConfig = {
    targetTokenAddress,
    targetChainId: destinationChainId,
    targetAmount: DEFAULT_AMOUNT,
    targetRecipient: walletClient?.account?.address as Address | undefined,
  };

  return { setupConfig, paymentConfig };
}

interface PaymentWidgetExampleProps {
  walletClient?: SetupConfig['walletClient'];
  isTestnet?: boolean;
  onPaymentComplete?: (reference: string) => void;
  onPaymentFailed?: (error: string) => void;
}

export function PaymentWidgetExample({
  walletClient,
  isTestnet = false,
  onPaymentComplete,
  onPaymentFailed,
}: PaymentWidgetExampleProps) {
  const { setupConfig, paymentConfig } = useMemo(
    () => buildExampleConfigs(isTestnet, walletClient),
    [isTestnet, walletClient],
  );

  return (
    <div className="w-full">
      <PaymentWidgetProvider setupConfig={setupConfig}>
        <PaymentWidget
          paymentConfig={paymentConfig}
          onPaymentComplete={onPaymentComplete}
          onPaymentFailed={onPaymentFailed}
          className="w-full"
        />
      </PaymentWidgetProvider>
    </div>
  );
}

export function PaymentWidgetTriggeredExample({
  walletClient,
  isTestnet = false,
  onPaymentComplete,
  onPaymentFailed,
}: PaymentWidgetExampleProps) {
  const { setupConfig, paymentConfig } = useMemo(
    () => buildExampleConfigs(isTestnet, walletClient),
    [isTestnet, walletClient],
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!walletClient) {
      setIsOpen(false);
    }
  }, [walletClient]);

  return (
    <div className="w-full space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!walletClient}
        className="inline-flex items-center justify-center rounded-md border border-current px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
      >
        Pay Now
      </button>

      {isOpen && walletClient ? (
        <div className="rounded-lg border border-dashed p-4">
          <div className="mb-3 text-sm font-medium text-neutral-500">Payment Widget</div>
          <PaymentWidgetProvider setupConfig={setupConfig}>
            <PaymentWidget
              paymentConfig={paymentConfig}
              onPaymentComplete={(reference) => {
                setIsOpen(false);
                onPaymentComplete?.(reference);
              }}
              onPaymentFailed={(error) => {
                setIsOpen(false);
                onPaymentFailed?.(error);
              }}
              className="w-full"
            />
          </PaymentWidgetProvider>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center rounded-md border border-current px-3 py-1.5 text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PaymentWidgetDialogExample({
  walletClient,
  isTestnet = false,
  onPaymentComplete,
  onPaymentFailed,
}: PaymentWidgetExampleProps) {
  const { setupConfig, paymentConfig } = useMemo(
    () => buildExampleConfigs(isTestnet, walletClient),
    [isTestnet, walletClient],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!walletClient) {
      setIsOpen(false);
    }
  }, [walletClient]);

  const handleClose = () => setIsOpen(false);

  const dialogContent = !mounted || !isOpen || !walletClient ? null : createPortal(
    <div className="payment-widget-dialog fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">Complete Your Payment</h3>
            <p className="text-xs text-neutral-500">
              This example mounts the widget inside a basic fullscreen dialog.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-current px-2.5 py-1 text-xs font-medium"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <PaymentWidgetProvider setupConfig={setupConfig}>
            <PaymentWidget
              paymentConfig={paymentConfig}
              onPaymentComplete={(reference) => {
                handleClose();
                onPaymentComplete?.(reference);
              }}
              onPaymentFailed={(error) => {
                handleClose();
                onPaymentFailed?.(error);
              }}
              className="w-full"
            />
          </PaymentWidgetProvider>
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <div className="w-full space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={!walletClient}
        className="inline-flex items-center justify-center rounded-md border border-current px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
      >
        Open Payment Dialog
      </button>
      {dialogContent}
    </div>
  );
}
