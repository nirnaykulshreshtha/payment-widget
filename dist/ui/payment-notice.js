import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../lib/cn';
/**
 * CSS class mapping for notice variants.
 * Each variant applies specific styling via CSS custom properties.
 */
const NOTICE_VARIANTS = {
    info: 'payment-notice--info',
    success: 'payment-notice--success',
    warning: 'payment-notice--warning',
    destructive: 'payment-notice--destructive',
};
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
export function PaymentNotice({ className, variant = 'info', icon: Icon, iconClassName, heading, description, children, role, ...props }) {
    const resolvedRole = role ?? 'status';
    return (_jsxs("div", { role: resolvedRole, className: cn('payment-notice', NOTICE_VARIANTS[variant], className), ...props, children: [Icon ? _jsx(Icon, { className: cn('payment-notice__icon', iconClassName), "aria-hidden": true }) : null, _jsxs("div", { className: "payment-notice__body", children: [heading ? _jsx("p", { className: "payment-notice__title", children: heading }) : null, description ? _jsx("p", { className: "payment-notice__description", children: description }) : null, children] })] }));
}
/**
 * Legacy export name for backward compatibility.
 * @deprecated Use PaymentNotice instead. This will be removed in a future version.
 */
export const Notice = PaymentNotice;
