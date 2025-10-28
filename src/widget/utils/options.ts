/**
 * @fileoverview Utility functions for payment option processing, including
 * priority-based filtering and option key generation.
 */

import type { PaymentOption, PaymentOptionMode } from '../../types';

/**
 * Route priority mapping for filtering duplicate options.
 * Lower numbers indicate higher priority.
 * 
 * Priority order: DIRECT > BRIDGE > SWAP
 * This ensures that when multiple routing options exist for the same token
 * on the same chain, only the highest priority option is displayed.
 */
export const ROUTE_PRIORITY: Record<PaymentOptionMode, number> = {
  direct: 1,
  bridge: 2,
  swap: 3,
} as const;

/**
 * Get the priority score for a given payment option mode.
 * Lower scores indicate higher priority.
 * 
 * @param mode - The payment option mode
 * @returns Priority score (1 = highest priority, 3 = lowest priority)
 */
export const getModePriority = (mode: PaymentOptionMode): number => {
  return ROUTE_PRIORITY[mode];
};

/**
 * Generate a unique key for a payment option based on its core identifying properties.
 * Used for deduplication and option tracking.
 * 
 * @param option - The payment option to generate a key for
 * @returns Unique string key for the option
 */
export const getOptionKey = (option: PaymentOption) =>
  `${option.id}:${option.mode}:${option.requiresWrap ? 'wrap' : 'nowrap'}`;

/**
 * Generate a grouping key for payment options based on token and chain.
 * Used to identify options that should be filtered by priority.
 * 
 * @param option - The payment option to generate a grouping key for
 * @returns Grouping key string (tokenAddress:originChainId)
 */
export const getOptionGroupKey = (option: PaymentOption): string => {
  const originChainId = option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId;
  return `${option.displayToken.address}:${originChainId}`;
};

/**
 * Filter payment options to show only the highest priority route for each token/chain combination.
 * 
 * When multiple routing options exist for the same token on the same chain,
 * this function keeps only the option with the highest priority mode.
 * 
 * Priority order: DIRECT > BRIDGE > SWAP
 * 
 * @param options - Array of payment options to filter
 * @returns Filtered array containing only the highest priority option for each group
 */
export const filterOptionsByPriority = (options: PaymentOption[]): PaymentOption[] => {
  console.debug('[route-priority-filtering] Starting priority filtering', {
    totalOptions: options.length,
  });

  // Group options by token address and origin chain ID
  const groupedOptions = new Map<string, PaymentOption[]>();
  
  for (const option of options) {
    const groupKey = getOptionGroupKey(option);
    if (!groupedOptions.has(groupKey)) {
      groupedOptions.set(groupKey, []);
    }
    groupedOptions.get(groupKey)!.push(option);
  }

  console.debug('[route-priority-filtering] Grouped options', {
    groupCount: groupedOptions.size,
    groups: Array.from(groupedOptions.entries()).map(([key, opts]) => ({
      groupKey: key,
      optionCount: opts.length,
      modes: opts.map(o => o.mode),
    })),
  });

  // For each group, select the option with the highest priority (lowest priority score)
  const filteredOptions: PaymentOption[] = [];
  
  for (const [groupKey, groupOptions] of groupedOptions) {
    if (groupOptions.length === 1) {
      // Single option in group, keep it
      filteredOptions.push(groupOptions[0]);
      console.debug('[route-priority-filtering] Single option group', {
        groupKey,
        mode: groupOptions[0].mode,
        token: groupOptions[0].displayToken.symbol,
      });
    } else {
      // Multiple options in group, select highest priority
      const selectedOption = groupOptions.reduce((highest, current) => {
        const currentPriority = getModePriority(current.mode);
        const highestPriority = getModePriority(highest.mode);
        
        if (currentPriority < highestPriority) {
          return current;
        }
        return highest;
      });

      filteredOptions.push(selectedOption);
      
      console.debug('[route-priority-filtering] Multi-option group filtered', {
        groupKey,
        selectedMode: selectedOption.mode,
        selectedToken: selectedOption.displayToken.symbol,
        availableModes: groupOptions.map(o => o.mode),
        filteredOutModes: groupOptions
          .filter(o => o.id !== selectedOption.id)
          .map(o => o.mode),
      });
    }
  }

  console.debug('[route-priority-filtering] Priority filtering completed', {
    originalCount: options.length,
    filteredCount: filteredOptions.length,
    removedCount: options.length - filteredOptions.length,
  });

  return filteredOptions;
};
