import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Custom payment status header component that displays payment type,
 * chain flow, and status in a compact, visually appealing format matching the
 * design requirements. Uses the common StatusDisplay component for consistent
 * status rendering across the payment widget.
 */
import { ArrowRight } from 'lucide-react';
import { TokenAvatar } from './avatars/TokenAvatar';
import { ChainAvatar } from './avatars/ChainAvatar';
import { StatusDisplay } from '../../components/StatusDisplay';
/**
 * Renders a custom payment status header with payment type, chain flow indicators,
 * and status badge matching the specified design requirements.
 *
 * @param entry - Payment history entry containing status and chain information
 * @param chainLookup - Map of chain IDs to chain names for display
 * @param chainLogos - Map of chain IDs to logo URLs for display
 */
export function PaymentStatusHeader({ entry, chainLookup, chainLogos }) {
    console.log('PaymentStatusHeader: Rendering header for entry:', {
        id: entry.id,
        mode: entry.mode,
        status: entry.status,
        originChainId: entry.originChainId,
        destinationChainId: entry.destinationChainId
    });
    const originChainName = chainLookup.get(entry.originChainId) ?? entry.originChainId;
    const destinationChainName = chainLookup.get(entry.destinationChainId) ?? entry.destinationChainId;
    // Determine payment type display
    const paymentType = entry.mode === 'bridge'
        ? 'Cross-network payment'
        : entry.mode === 'swap'
            ? 'Swap and send'
            : 'Direct payment';
    console.log('PaymentStatusHeader: Rendering header for entry:', {
        id: entry.id,
        mode: entry.mode,
        status: entry.status,
        originChainId: entry.originChainId,
        destinationChainId: entry.destinationChainId,
        inputToken: entry.inputToken.symbol,
        outputToken: entry.outputToken.symbol
    });
    return (_jsxs("div", { className: "pw-status-header", children: [_jsxs("div", { className: "pw-status-header__flow", children: [_jsxs("div", { className: "pw-avatar-stack", children: [_jsx(TokenAvatar, { symbol: entry.inputToken.symbol, logoUrl: entry.inputToken.logoUrl, className: "pw-avatar--small" }), _jsx(TokenAvatar, { symbol: entry.outputToken.symbol, logoUrl: entry.outputToken.logoUrl, className: "pw-avatar--small" })] }), _jsxs("div", { className: "pw-status-header__text", children: [_jsx("div", { className: "pw-status-header__title", children: paymentType }), _jsxs("div", { className: "pw-status-header__chains", children: [_jsx(ChainAvatar, { name: String(originChainName), logoUrl: chainLogos.get(entry.originChainId) }), _jsx(ArrowRight, { className: "pw-status-header__direction" }), _jsx(ChainAvatar, { name: String(destinationChainName), logoUrl: chainLogos.get(entry.destinationChainId) })] })] })] }), _jsx(StatusDisplay, { status: entry.status, showOriginalStatus: false, showSimplifiedStatus: true })] }));
}
