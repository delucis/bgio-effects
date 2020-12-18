import { createContext } from 'react';
import type { Emitter } from 'mitt';

export const EffectsContext = createContext<Emitter | null>(null);

export const EffectsQueueContext = createContext<
  { clear: () => void; flush: () => void; size: number } | undefined
>(undefined);
