import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PaymentWidget Example Usage
 *
 * Illustrates configuring the widget via the provider pattern so that setup
 * infrastructure is initialised once while rendering a single payment flow.
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import PaymentWidget, { PaymentWidgetProvider, createSetupConfig, getNetworkConfig } from './index';
import { DEFAULT_WRAPPED_TOKEN_MAP, ZERO_INTEGRATOR_ID } from './config';
const DEFAULT_AMOUNT = BigInt(11 * 1_000_000);
function buildExampleConfigs(isTestnet, walletClient) {
    const networkConfig = getNetworkConfig(isTestnet);
    const destinationChainId = isTestnet ? 84532 : 1;
    const targetTokenAddress = (isTestnet
        ? '0x4200000000000000000000000000000000000006'
        : '0xdAC17F958D2ee523a2206206994597C13D831ec7');
    const setupConfig = createSetupConfig({
        supportedChains: networkConfig.chains,
        walletClient,
        integratorId: process.env.NEXT_PUBLIC_ACROSS_INTEGRATOR_ID ??
            ZERO_INTEGRATOR_ID,
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
    const paymentConfig = {
        targetTokenAddress,
        targetChainId: destinationChainId,
        targetAmount: DEFAULT_AMOUNT,
        targetRecipient: walletClient?.account?.address,
    };
    return { setupConfig, paymentConfig };
}
export function PaymentWidgetExample({ walletClient, isTestnet = false, onPaymentComplete, onPaymentFailed, }) {
    const { setupConfig, paymentConfig } = useMemo(() => buildExampleConfigs(isTestnet, walletClient), [isTestnet, walletClient]);
    return (_jsx("div", { className: "w-full", children: _jsx(PaymentWidgetProvider, { setupConfig: setupConfig, children: _jsx(PaymentWidget, { paymentConfig: paymentConfig, onPaymentComplete: onPaymentComplete, onPaymentFailed: onPaymentFailed, className: "w-full" }) }) }));
}
export function PaymentWidgetTriggeredExample({ walletClient, isTestnet = false, onPaymentComplete, onPaymentFailed, }) {
    const { setupConfig, paymentConfig } = useMemo(() => buildExampleConfigs(isTestnet, walletClient), [isTestnet, walletClient]);
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        if (!walletClient) {
            setIsOpen(false);
        }
    }, [walletClient]);
    return (_jsxs("div", { className: "w-full space-y-4", children: [_jsx("button", { type: "button", onClick: () => setIsOpen(true), disabled: !walletClient, className: "inline-flex items-center justify-center rounded-md border border-current px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60", children: "Pay Now" }), isOpen && walletClient ? (_jsxs("div", { className: "rounded-lg border border-dashed p-4", children: [_jsx("div", { className: "mb-3 text-sm font-medium text-neutral-500", children: "Payment Widget" }), _jsx(PaymentWidgetProvider, { setupConfig: setupConfig, children: _jsx(PaymentWidget, { paymentConfig: paymentConfig, onPaymentComplete: (reference) => {
                                setIsOpen(false);
                                onPaymentComplete?.(reference);
                            }, onPaymentFailed: (error) => {
                                setIsOpen(false);
                                onPaymentFailed?.(error);
                            }, className: "w-full" }) }), _jsx("div", { className: "mt-3 flex justify-end", children: _jsx("button", { type: "button", onClick: () => setIsOpen(false), className: "inline-flex items-center justify-center rounded-md border border-current px-3 py-1.5 text-xs font-medium", children: "Close" }) })] })) : null] }));
}
export function PaymentWidgetDialogExample({ walletClient, isTestnet = false, onPaymentComplete, onPaymentFailed, }) {
    const { setupConfig, paymentConfig } = useMemo(() => buildExampleConfigs(isTestnet, walletClient), [isTestnet, walletClient]);
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
    const dialogContent = !mounted || !isOpen || !walletClient ? null : createPortal(_jsx("div", { className: "payment-widget-dialog fixed inset-0 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between border-b px-6 py-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: "Complete Your Payment" }), _jsx("p", { className: "text-xs text-neutral-500", children: "This example mounts the widget inside a basic fullscreen dialog." })] }), _jsx("button", { type: "button", onClick: handleClose, className: "rounded-md border border-current px-2.5 py-1 text-xs font-medium", children: "Close" })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: _jsx(PaymentWidgetProvider, { setupConfig: setupConfig, children: _jsx(PaymentWidget, { paymentConfig: paymentConfig, onPaymentComplete: (reference) => {
                                handleClose();
                                onPaymentComplete?.(reference);
                            }, onPaymentFailed: (error) => {
                                handleClose();
                                onPaymentFailed?.(error);
                            }, className: "w-full" }) }) })] }) }), document.body);
    return (_jsxs("div", { className: "w-full space-y-4", children: [_jsx("button", { type: "button", onClick: () => setIsOpen(true), disabled: !walletClient, className: "inline-flex items-center justify-center rounded-md border border-current px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60", children: "Open Payment Dialog" }), dialogContent] }));
}
