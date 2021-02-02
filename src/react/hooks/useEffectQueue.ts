import { useContext } from 'react';
import { EffectsQueueContext } from '../contexts';
import { QueueAPI } from '../types';
import { hookErrorMessage } from './utils';

/**
 * Get controls and data for the effects queue.
 * @return `{ clear(), flush(), update(), size }`
 */
export function useEffectQueue(): QueueAPI {
  const ctx = useContext(EffectsQueueContext);
  if (!ctx) throw new Error(hookErrorMessage('useEffectQueue'));
  return ctx;
}
