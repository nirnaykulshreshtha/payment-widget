'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Renders a selectable payment option row used in the options
 * view of the payment widget.
 */
import { ChevronRight } from 'lucide-react';
import { formatTokenAmount } from '../../utils/amount-format';
import { cn } from '../../lib';
import { TokenAvatar } from './avatars/TokenAvatar';
export function OptionRow({ option, targetAmount: _targetAmount, targetToken: _targetToken, chainLookup, chainLogos, targetSymbol: _targetSymbol, isSelected, onSelect, }) {
    const originChainId = option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId;
    const chainLabel = chainLookup.get(originChainId) ?? originChainId;
    const formattedBalance = `${formatTokenAmount(option.balance, option.displayToken.decimals)} ${option.displayToken.symbol}`;
    const modeLabel = option.mode === 'bridge' ? 'Bridge' : option.mode === 'swap' ? 'Swap' : 'Direct';
    const unavailableMessage = (() => {
        if (!option.unavailabilityReason) {
            return `Add more ${option.displayToken.symbol} on ${chainLabel} to use this option.`;
        }
        switch (option.unavailabilityReason.kind) {
            case 'minDepositShortfall':
                return `Minimum deposit is ${formatTokenAmount(option.unavailabilityReason.requiredAmount, option.displayToken.decimals)} ${option.displayToken.symbol}.`;
            case 'quoteFetchFailed':
                return "We couldn't check pricing for this option. Try refreshing.";
            case 'insufficientBalance':
                return `Requires ${formatTokenAmount(option.unavailabilityReason.requiredAmount, option.displayToken.decimals)} ${option.displayToken.symbol}.`;
            case 'usdShortfall':
                return option.unavailabilityReason.availableUsd != null
                    ? `You'll need about $${option.unavailabilityReason.requiredUsd.toFixed(2)} available (currently $${option.unavailabilityReason.availableUsd.toFixed(2)}).`
                    : "You'll need more funds in USD terms to use this option.";
            default:
                return `Add more ${option.displayToken.symbol} on ${chainLabel} to use this option.`;
        }
    })();
    return (_jsxs("button", { type: "button", onClick: onSelect, className: cn('pw-option-card', 'pw-option-card--checkout', isSelected && 'pw-option-card--active', !option.canMeetTarget && 'pw-option-card--unavailable'), "aria-label": `Select ${option.displayToken.symbol} payment option on ${chainLabel}`, "aria-pressed": isSelected, tabIndex: 0, children: [_jsxs("div", { className: "pw-option-card__grid", children: [_jsxs("div", { className: "pw-option-card__asset", children: [_jsx(TokenAvatar, { symbol: option.displayToken.symbol, logoUrl: option.displayToken.logoUrl }), _jsxs("div", { className: "pw-option-card__asset-meta", children: [_jsx("div", { className: "pw-option-card__symbol-row", children: _jsx("span", { className: "pw-option-card__symbol", children: option.displayToken.symbol }) }), _jsx("div", { className: "pw-option-card__chain", children: _jsx("span", { children: chainLabel }) })] })] }), _jsxs("div", { className: "pw-option-card__balance", children: [_jsx("span", { className: "pw-option-card__balance-label", children: "Available" }), _jsx("span", { className: "pw-option-card__balance-value", children: formattedBalance })] }), _jsx("div", { className: "pw-option-card__chevron", children: _jsx(ChevronRight, { "aria-hidden": true }) })] }), !option.canMeetTarget && (_jsx("p", { className: "pw-option-card__message", children: unavailableMessage }))] }));
}
export default OptionRow;
