'use client';

/**
 * @fileoverview Utility component for copying text to clipboard with visual feedback.
 * Provides a reusable hook and component for copy-to-clipboard functionality.
 */

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib';

/**
 * Hook for managing copy-to-clipboard state and functionality.
 * 
 * @returns An object with copy state and copy function
 */
export function useCopyToClipboard(): {
  copied: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[copy-to-clipboard] Failed to copy text:', error);
    }
  }, []);

  return { copied, copy };
}

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
export function CopyButton({ 
  text, 
  label = 'Copy to clipboard',
  className,
  variant = 'inline',
  showText = false
}: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    copy(text);
  };

  const Icon = copied ? Check : Copy;
  const buttonLabel = copied ? 'Copied!' : label;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={buttonLabel}
        className={cn('pw-copy-button pw-copy-button--icon', className)}
        title={buttonLabel}
      >
        <Icon className="pw-copy-button__icon" />
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn('pw-copy-button pw-copy-button--text', className)}
      >
        <Icon className="pw-copy-button__icon" />
        {showText && <span className="pw-copy-button__text">{copied ? 'Copied!' : 'Copy'}</span>}
      </button>
    );
  }

  // Inline variant (default)
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={buttonLabel}
      className={cn('pw-copy-button pw-copy-button--inline', className)}
      title={buttonLabel}
    >
      <Icon className={cn('pw-copy-button__icon', copied && 'pw-copy-button__icon--success')} />
    </button>
  );
}

