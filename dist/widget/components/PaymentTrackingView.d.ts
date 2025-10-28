export interface PaymentTrackingViewProps {
    historyId: string;
    chainLookup: Map<number, string | number>;
    chainLogos: Map<number, string | undefined>;
}
export declare function PaymentTrackingView({ historyId, chainLookup, chainLogos }: PaymentTrackingViewProps): import("react/jsx-runtime").JSX.Element;
