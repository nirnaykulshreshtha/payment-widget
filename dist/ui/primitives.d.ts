import type { ComponentPropsWithoutRef, ElementType, HTMLAttributes, ReactNode } from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'default' | 'destructive' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'icon' | 'lg';
type NoticeVariant = 'info' | 'success' | 'warning' | 'destructive';
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
interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Visual tone of the notice. Maps to shadcn-inspired alert styles.
     */
    variant?: NoticeVariant;
    /**
     * Optional leading icon. Receives the standard `className` prop for sizing and color.
     */
    icon?: ElementType<{
        className?: string;
    }>;
    /**
     * Additional class names to apply to the icon element.
     */
    iconClassName?: string;
    /**
     * Optional heading rendered above the description/body content.
     */
    heading?: ReactNode;
    /**
     * Description text rendered beneath the title when `children` are not supplied.
     */
    description?: ReactNode;
}
export declare function Notice({ className, variant, icon: Icon, iconClassName, heading, description, children, role, ...props }: NoticeProps): import("react/jsx-runtime").JSX.Element;
export {};
