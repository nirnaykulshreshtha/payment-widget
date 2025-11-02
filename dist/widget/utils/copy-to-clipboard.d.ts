/**
 * Hook for managing copy-to-clipboard state and functionality.
 *
 * @returns An object with copy state and copy function
 */
export declare function useCopyToClipboard(): {
    copied: boolean;
    copy: (text: string) => Promise<void>;
};
export interface CopyButtonProps {
    /** Text to copy to clipboard */
    text: string;
    /** Optional label for accessibility */
    label?: string;
    /** Optional className for styling */
    className?: string;
    /** Optional variant */
    variant?: 'icon' | 'text' | 'inline';
    /** Show text alongside icon */
    showText?: boolean;
}
/**
 * Button component that copies text to clipboard when clicked.
 * Shows visual feedback (checkmark) when copy is successful.
 */
export declare function CopyButton({ text, label, className, variant, showText }: CopyButtonProps): import("react/jsx-runtime").JSX.Element;
