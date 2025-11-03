import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

type DivProps = ComponentPropsWithoutRef<'div'>;

type HeadingProps = ComponentPropsWithoutRef<'h3'>;

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'default' | 'destructive' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'icon' | 'lg';
type NoticeVariant = 'info' | 'success' | 'warning' | 'destructive';

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
  default: 'payment-button--default',
  primary: 'payment-button--primary',
  secondary: 'payment-button--secondary',
  outline: 'payment-button--outline',
  destructive: 'payment-button--destructive',
  ghost: 'payment-button--ghost',
  link: 'payment-button--link',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: 'payment-button--size-default',
  sm: 'payment-button--size-sm',
  icon: 'payment-button--size-icon',
  lg: 'payment-button--size-lg',
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

const NOTICE_VARIANTS: Record<NoticeVariant, string> = {
  info: 'payment-notice--info',
  success: 'payment-notice--success',
  warning: 'payment-notice--warning',
  destructive: 'payment-notice--destructive',
};

interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Visual tone of the notice. Maps to shadcn-inspired alert styles.
   */
  variant?: NoticeVariant;
  /**
   * Optional leading icon. Receives the standard `className` prop for sizing and color.
   */
  icon?: ElementType<{ className?: string }>;
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

export function Notice({
  className,
  variant = 'info',
  icon: Icon,
  iconClassName,
  heading,
  description,
  children,
  role,
  ...props
}: NoticeProps) {
  const resolvedRole = role ?? 'status';

  return (
    <div
      role={resolvedRole}
      className={cn('payment-notice', NOTICE_VARIANTS[variant], className)}
      {...props}
    >
      {Icon ? <Icon className={cn('payment-notice__icon', iconClassName)} aria-hidden /> : null}
      <div className="payment-notice__body">
        {heading ? <p className="payment-notice__title">{heading}</p> : null}
        {description ? <p className="payment-notice__description">{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
