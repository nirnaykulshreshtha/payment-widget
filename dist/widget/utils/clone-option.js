'use client';
export function clonePaymentOption(option) {
    return {
        ...option,
        displayToken: { ...option.displayToken },
        wrappedToken: option.wrappedToken ? { ...option.wrappedToken } : undefined,
        route: option.route ? { ...option.route } : undefined,
        swapRoute: option.swapRoute ? { ...option.swapRoute } : undefined,
        quote: option.quote
            ? {
                ...option.quote,
                limits: { ...option.quote.limits },
                raw: option.quote.raw,
            }
            : undefined,
        swapQuote: option.swapQuote
            ? {
                ...option.swapQuote,
                approvalTxns: option.swapQuote.approvalTxns.map((txn) => ({ ...txn })),
                raw: option.swapQuote.raw,
            }
            : undefined,
    };
}
