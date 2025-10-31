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
    const availabilityLabel = option.canMeetTarget ? estimatedOutput : 'Insufficient balance';
    const unavailableMessage = (() => {
        if (!option.unavailabilityReason) {
            return `Top up your ${option.displayToken.symbol} on ${chainLabel} to enable this route.`;
        }
        switch (option.unavailabilityReason.kind) {
            case 'minDepositShortfall':
                return `Minimum deposit is ${formatTokenAmount(option.unavailabilityReason.requiredAmount, option.displayToken.decimals)} ${option.displayToken.symbol}.`;
            case 'quoteFetchFailed':
                return 'Unable to fetch a bridge quote right now. Try refreshing.';
            case 'insufficientBalance':
                return `Requires ${formatTokenAmount(option.unavailabilityReason.requiredAmount, option.displayToken.decimals)} ${option.displayToken.symbol}.`;
            case 'usdShortfall':
                return option.unavailabilityReason.availableUsd != null
                    ? `Requires approximately $${option.unavailabilityReason.requiredUsd.toFixed(2)} liquidity (you have $${option.unavailabilityReason.availableUsd.toFixed(2)}).`
                    : 'Requires additional liquidity to meet the minimum USD threshold.';
            default:
                return `Top up your ${option.displayToken.symbol} on ${chainLabel} to enable this route.`;
        }
    })();
    return (_jsxs("button", { type: "button", onClick: onSelect, className: cn('w-full rounded-2xl border border-border/60 bg-card/30 p-4 text-left transition hover:border-primary/50', isSelected && 'border-primary/60 bg-primary/10'), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TokenAvatar, { symbol: option.displayToken.symbol, logoUrl: option.displayToken.logoUrl }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 text-sm font-semibold", children: [_jsx("span", { children: option.displayToken.symbol }), _jsxs("span", { children: [formatTokenAmount(option.balance, option.displayToken.decimals), " ", option.displayToken.symbol] })] }), _jsxs("div", { className: "flex items-center justify-between gap-2 text-xs text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(ChainAvatar, { name: String(chainLabel), logoUrl: chainLogos.get(originChainId) }), chainLabel] }), _jsx("span", { className: cn(!option.canMeetTarget && 'text-destructive/80 font-medium'), children: availabilityLabel })] })] }), _jsx("svg", { className: "h-4 w-4 text-muted-foreground", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "9 18 15 12 9 6" }) })] }), _jsxs("div", { className: "mt-3 flex items-center justify-between gap-2", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: option.estimatedFillTimeSec && ['bridge', 'swap'].includes(option.mode)
                            ? _jsxs(_Fragment, { children: ["Est. fill time ", Math.round(option.estimatedFillTimeSec / 60), " min"] })
                            : null }), _jsx(Badge, { variant: "outline", className: "text-[10px] uppercase tracking-[0.2em]", children: option.mode })] }), !option.canMeetTarget && (_jsx("p", { className: "mt-2 text-[11px] text-muted-foreground", children: unavailableMessage }))] }));
}
export default OptionRow;
