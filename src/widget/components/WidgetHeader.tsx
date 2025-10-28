/**
 * @fileoverview Reusable header component for the payment widget providing
 * navigation, refresh, and history controls with aggressive logging support.
 * Supports both standard title/subtitle display and custom HTML components.
 */
import { ArrowLeft, History as HistoryIcon, RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '../../lib';
import { Button } from '../../ui/primitives';

export interface WidgetHeaderProps {
  /** Custom HTML component to render instead of title/subtitle */
  customComponent?: ReactNode;
  /** Title text - required if customComponent is not provided */
  title?: string;
  /** Subtitle text - optional */
  subtitle?: string;
  onBack?: () => void;
  onHistory?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * Renders the payment widget header with optional navigation and utility
 * actions. Supports both standard title/subtitle display and custom HTML components.
 * 
 * @param customComponent - Custom React component to render instead of title/subtitle
 * @param title - Title text (required if customComponent is not provided)
 * @param subtitle - Subtitle text (optional)
 * @param onBack - Callback for back button click
 * @param onHistory - Callback for history button click
 * @param onRefresh - Callback for refresh button click
 * @param isRefreshing - Whether refresh is in progress
 */
export function WidgetHeader({ 
  customComponent, 
  title, 
  subtitle, 
  onBack, 
  onHistory, 
  onRefresh, 
  isRefreshing 
}: WidgetHeaderProps) {
  // Validate that either customComponent or title is provided
  if (!customComponent && !title) {
    console.error('WidgetHeader: Either customComponent or title must be provided');
    return null;
  }

  console.log('WidgetHeader: Rendering with customComponent:', !!customComponent, 'title:', title);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {onBack && (
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="space-y-1">
          {customComponent ? (
            customComponent
          ) : (
            <>
              <h2 className="text-lg font-semibold leading-tight">{title}</h2>
              {subtitle && <p className="text-xs leading-snug text-muted-foreground">{subtitle}</p>}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        )}
        {onHistory && (
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={onHistory}>
            <HistoryIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
