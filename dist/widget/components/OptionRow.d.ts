import type { PaymentOption, TokenConfig } from '../../types';
export interface OptionRowProps {
    option: PaymentOption;
    targetAmount: bigint;
    targetToken: TokenConfig | null;
    chainLookup: Map<number, string | number>;
    chainLogos: Map<number, string | undefined>;
    targetSymbol: string;
    isSelected: boolean;
    onSelect: () => void;
}
export declare function OptionRow({ option, targetAmount, targetToken, chainLookup, chainLogos, targetSymbol, isSelected, onSelect }: OptionRowProps): import("react/jsx-runtime").JSX.Element;
export default OptionRow;
