'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { formatTokenAmount } from '../../utils/amount-format';
import { cn } from '../../lib';
import { Badge } from '../../ui/primitives';
import { ChainAvatar } from './avatars/ChainAvatar';
import { TokenAvatar } from './avatars/TokenAvatar';
export function OptionRow({ option, targetAmount, targetToken, chainLookup, chainLogos, targetSymbol, isSelected, onSelect }) {
    const originChainId = option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId;
    const chainLabel = chainLookup.get(originChainId) ?? originChainId;
    const estimatedOutput = option.mode === 'bridge' && option.quote
        ? `${formatTokenAmount(option.quote.outputAmount, targetToken?.decimals ?? option.displayToken.decimals)} ${targetSymbol}`
        : option.mode === 'swap' && option.swapQuote
            ? `${formatTokenAmount(option.swapQuote.expectedOutputAmount, targetToken?.decimals ?? option.displayToken.decimals)} ${targetSymbol}`
            : option.mode === 'direct'
                ? `${formatTokenAmount(option.quote?.outputAmount ?? targetAmount, targetToken?.decimals ?? option.displayToken.decimals)} ${targetSymbol}`
                : '—';
    const availabilityLabel = option.canMeetTarget ? estimatedOutput : 'Not enough balance';
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
    return (_jsxs("button", { type: "button", onClick: onSelect, className: cn('pw-option-card', isSelected && 'pw-option-card--active', !option.canMeetTarget && 'pw-option-card--unavailable'), "aria-label": `Select ${option.displayToken.symbol} payment option on ${chainLabel}`, "aria-pressed": isSelected, tabIndex: 0, children: [_jsxs("div", { className: "pw-option-card__header", children: [_jsx(TokenAvatar, { symbol: option.displayToken.symbol, logoUrl: option.displayToken.logoUrl }), _jsxs("div", { className: "pw-option-card__summary", children: [_jsxs("div", { className: "pw-option-card__title-row", children: [_jsx("span", { children: option.displayToken.symbol }), _jsxs("span", { children: [formatTokenAmount(option.balance, option.displayToken.decimals), " ", option.displayToken.symbol] })] }), _jsxs("div", { className: "pw-option-card__meta", children: [_jsxs("span", { className: "pw-option-card__chain", children: [_jsx(ChainAvatar, { name: String(chainLabel), logoUrl: chainLogos.get(originChainId) }), _jsx("span", { children: chainLabel })] }), _jsx("span", { className: cn('pw-option-card__availability', !option.canMeetTarget && 'pw-option-card__availability--warning'), children: availabilityLabel })] })] }), _jsx("svg", { className: "pw-option-card__chevron", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: _jsx("polyline", { points: "9 18 15 12 9 6" }) })] }), _jsxs("div", { className: "pw-option-card__footer", children: [_jsx("p", { className: "pw-option-card__detail", children: option.estimatedFillTimeSec && ['bridge', 'swap'].includes(option.mode)
                            ? _jsxs(_Fragment, { children: ["Est. fill time ", Math.round(option.estimatedFillTimeSec / 60), " min"] })
                            : null }), _jsx(Badge, { variant: "outline", className: "pw-option-card__badge", children: option.mode === 'bridge' ? 'Bridge' : option.mode === 'swap' ? 'Swap' : 'Direct' })] }), !option.canMeetTarget && (_jsx("p", { className: "pw-option-card__message", children: unavailableMessage }))] }));
}
export default OptionRow;
