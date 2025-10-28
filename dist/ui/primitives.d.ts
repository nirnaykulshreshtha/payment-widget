import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'default' | 'sm' | 'icon';
export declare const Card: import("react").ForwardRefExoticComponent<Omit<import("react").DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export declare const CardHeader: import("react").ForwardRefExoticComponent<Omit<import("react").DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export declare const CardContent: import("react").ForwardRefExoticComponent<Omit<import("react").DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export declare const CardTitle: import("react").ForwardRefExoticComponent<Omit<import("react").DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>, "ref"> & import("react").RefAttributes<HTMLHeadingElement>>;
declare const BADGE_VARIANTS: Record<string, string>;
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: keyof typeof BADGE_VARIANTS;
}
export declare function Badge({ className, variant, ...props }: BadgeProps): import("react/jsx-runtime").JSX.Element;
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}
export declare const Button: import("react").ForwardRefExoticComponent<ButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare function Skeleton({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export {};
