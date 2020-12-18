import { useContext } from 'react';
import { EffectsQueueContext } from '../contexts';
import { hookErrorMessage } from './utils';

/**
 * Get controls and data for the effects queue.
 * @return - { clear(), flush(), size }
 */
export function useEffectQueue() {
  const ctx = useContext(EffectsQueueContext);
  if (!ctx) throw new Error(hookErrorMessage('useEffectQueue'));
  return ctx;
}
