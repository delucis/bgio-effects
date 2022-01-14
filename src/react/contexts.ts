import { createContext } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { QueueAPI } from './types';
import type { EffectsEmitter } from '../emitter';

export const EffectsContext = createContext<EffectsEmitter<BoardProps> | null>(
  null
);

export const EffectsQueueContext = createContext<QueueAPI | undefined>(
  undefined
);

export const EffectsPropsContext = createContext<BoardProps | undefined>(
  undefined
);
