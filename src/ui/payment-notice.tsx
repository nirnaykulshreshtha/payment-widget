/**
 * PaymentNotice Component
 *
 * A reusable notice/alert component for displaying informational messages,
 * warnings, success states, and errors within the payment widget.
 *
 * This component serves as the single source of truth for all notice/alert
 * displays in the payment widget. It supports:
 * - Multiple visual variants (info, success, warning, destructive)
 * - Optional icon display with custom styling
 * - Heading and description text
 * - Custom children content
 *
 * @module ui/payment-notice
 */

import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Visual tone variants for the notice component.
 * Maps to CSS classes: payment-notice--info, payment-notice--success, etc.
 */
export type NoticeVariant = 'info' | 'success' | 'warning' | 'destructive';

/**
 * CSS class mapping for notice variants.
 * Each variant applies specific styling via CSS custom properties.
 */
const NOTICE_VARIANTS: Record<NoticeVariant, string> = {
  info: 'payment-notice--info',
  success: 'payment-notice--success',
  warning: 'payment-notice--warning',
  destructive: 'payment-notice--destructive',
};

/**
 * Props for the PaymentNotice component.
 *
 * @property {NoticeVariant} variant - Visual tone of the notice. Defaults to 'info'.
 * @property {ElementType} icon - Optional leading icon component. Receives className prop.
 * @property {string} iconClassName - Additional CSS classes for the icon element.
 * @property {ReactNode} heading - Optional heading text rendered above the description.
 * @property {ReactNode} description - Optional description text rendered beneath the heading.
 * @property {ReactNode} children - Custom content to render inside the notice body.
 * @property {string} role - ARIA role. Defaults to 'status' if not provided.
 */
export interface PaymentNoticeProps extends HTMLAttributes<HTMLDivElement> {
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

/**
 * PaymentNotice Component
 *
 * A flexible notice component for displaying contextual messages in the payment widget.
 * Supports multiple variants, icons, headings, and descriptions.
 *
 * @param {PaymentNoticeProps} props - Component props
 * @returns {JSX.Element} Rendered notice component
 *
 * @example
 * ```tsx
 * <PaymentNotice
 *   variant="info"
 *   icon={Info}
 *   heading="Processing payment"
 *   description="Please wait while we process your transaction."
 * />
 * ```
 *
 * @example
 * ```tsx
 * <PaymentNotice
 *   variant="success"
 *   icon={CheckCircle2}
 *   description="Payment successful!"
 * />
 * ```
 */
export function PaymentNotice({
  className,
  variant = 'info',
  icon: Icon,
  iconClassName,
  heading,
  description,
  children,
  role,
  ...props
}: PaymentNoticeProps) {
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

/**
 * Legacy export name for backward compatibility.
 * @deprecated Use PaymentNotice instead. This will be removed in a future version.
 */
export const Notice = PaymentNotice;

/**
 * Legacy export name for backward compatibility.
 * @deprecated Use PaymentNoticeProps instead. This will be removed in a future version.
 */
export type NoticeProps = PaymentNoticeProps;
