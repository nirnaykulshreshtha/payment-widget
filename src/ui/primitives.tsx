import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type DivProps = ComponentPropsWithoutRef<'div'>;

type HeadingProps = ComponentPropsWithoutRef<'h3'>;

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'default' | 'sm' | 'icon';

export const Card = forwardRef<HTMLDivElement, DivProps>(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('payment-card', className)}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, DivProps>(function CardHeader({ className, ...props }, ref) {
  return (
    <div ref={ref} className={cn('payment-card__header', className)} {...props} />
  );
});

export const CardContent = forwardRef<HTMLDivElement, DivProps>(function CardContent({ className, ...props }, ref) {
  return (
    <div ref={ref} className={cn('payment-card__content', className)} {...props} />
  );
});

export const CardTitle = forwardRef<HTMLHeadingElement, HeadingProps>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3 ref={ref} className={cn('payment-card__title', className)} {...props} />
  );
});

const BADGE_VARIANTS: Record<string, string> = {
  default: 'payment-badge--default',
  outline: 'payment-badge--outline',
  secondary: 'payment-badge--secondary',
  destructive: 'payment-badge--destructive',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof BADGE_VARIANTS;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'payment-badge',
        BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.default,
        className,
      )}
      {...props}
    />
  );
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'payment-button--primary',
  secondary: 'payment-button--secondary',
  outline: 'payment-button--outline',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: 'payment-button--size-default',
  sm: 'payment-button--size-sm',
  icon: 'payment-button--size-icon',
};

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'default', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'payment-button',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  );
});

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('payment-skeleton', className)} />;
}
