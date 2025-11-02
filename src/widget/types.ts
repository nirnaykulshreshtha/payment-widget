/**
 * @fileoverview Shared type definitions used by the payment widget views and
 * supporting utilities.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { Hex } from 'viem';

import type { PaymentHistoryStatus, PaymentOption, PaymentOptionMode, TokenConfig } from '../types';

import { WIDGET_STATUS_LABELS, WIDGET_TIMELINE_STAGE_FLOW, WIDGET_RESOLVED_STATUSES } from './utils/view-constants';

export const STATUS_LABELS = WIDGET_STATUS_LABELS;
export const TIMELINE_STAGE_FLOW = WIDGET_TIMELINE_STAGE_FLOW;
export const RESOLVED_STATUSES = WIDGET_RESOLVED_STATUSES;

/**
 * View stack entry representation used for orchestrating the widget screens.
 */
export type PaymentView =
  | { name: 'loading' }
  | { name: 'options' }
  | { name: 'details' }
  | { name: 'history' }
  | { name: 'tracking'; historyId: string }
  | { name: 'success'; reference?: string; historyId?: string; summary?: PaymentResultSummary }
  | { name: 'failure'; reason: string; historyId?: string };

/**
 * Summary of the most recent payment execution used by success/failure views
 * and callbacks supplied to integrators.
 */
export interface PaymentResultSummary {
  mode: PaymentOptionMode;
  input: {
    amount: bigint;
    token: TokenConfig;
  };
  output?: {
    amount: bigint;
    token: TokenConfig | null;
  };
  depositTxHash?: Hex | null;
  fillTxHash?: Hex | null;
  wrapTxHash?: Hex | null;
  swapTxHash?: Hex | null;
  approvalTxHashes?: Hex[];
  originChainId?: number;
  destinationChainId?: number;
}

export interface PayOptionsViewProps {
  options: PaymentOption[];
  onSelect: (option: PaymentOption) => void;
  selectedOptionId: string | null;
  targetAmountLabel: string;
  targetSymbol: string;
  targetChainLabel: string | number;
  targetAmount: bigint;
  targetToken: TokenConfig | null;
  chainLookup: Map<number, string | number>;
  chainLogos: Map<number, string | undefined>;
  lastUpdated: number | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewHistory: () => void;
  accountConnected: boolean;
  plannerError?: string | null;
}

export interface RenderedPaymentView {
  content: ReactNode;
  headerConfig: {
    showRefresh: boolean;
    showHistory: boolean;
  };
}

export interface PaymentDetailsViewProps {
  option: PaymentOption;
  targetToken: TokenConfig | null;
  targetAmount: bigint;
  maxSlippageBps?: number;
  chainLookup: Map<number, string | number>;
  chainLogos: Map<number, string | undefined>;
  wrapTxHash: Hex | null;
  depositTxHash: Hex | null;
  swapTxHash: Hex | null;
  approvalTxHashes: Hex[];
  isExecuting: boolean;
  onExecute: () => void;
  onChangeAsset: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export interface WidgetViewRenderConfig {
  view: PaymentView;
  planner: {
    stageDefinitions: { id: string; label: string }[];
    loadingStage: string;
    completedStages: string[];
    lastUpdated: number | null;
    isLoading: boolean;
    error: string | null;
  };
  options: PaymentOption[];
  selectedOption: PaymentOption | null;
  targetAmount: bigint;
  targetSymbol: string;
  targetChainLabel: string | number;
  targetToken: TokenConfig | null;
  chainLookup: Map<number, string | number>;
  chainLogos: Map<number, string | undefined>;
  formattedTargetAmount: string;
  wrapTxHash: Hex | null;
  txHash: Hex | null;
  swapTxHash: Hex | null;
  approvalTxHashes: Hex[];
  isExecuting: boolean;
  isClearingHistory: boolean;
  onSelectOption: (option: PaymentOption) => void;
  onExecutePayment: () => void;
  onChangeAsset: () => void;
  onResetToOptions: () => void;
  onViewHistory: () => void;
  accountConnected: boolean;
  onOpenTracking: (historyId: string) => void;
  onClearHistory: () => void;
  onCloseResult: () => void;
  onRetry: () => void;
  onRefresh: () => void;
  pushView: (view: PaymentView) => void;
  maxSlippageBps?: number;
}
