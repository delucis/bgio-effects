import { createContext } from 'react';
import type { Emitter } from 'mitt';

export const EffectsContext = createContext<{
  emitter: Emitter | null;
  endEmitter: Emitter | null;
}>({ emitter: null, endEmitter: null });

export const EffectsQueueContext = createContext<
  | {
      clear: () => void;
      flush: () => void;
      update: () => void;
      size: number;
    }
  | undefined
>(undefined);
