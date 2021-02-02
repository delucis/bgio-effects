import { BoardProps } from 'boardgame.io/react';
import { useContext } from 'react';
import { EffectsPropsContext } from '../contexts';
import { hookErrorMessage } from './utils';

/**
 * Get current board props as maintained by the effects plugin
 * @return - The boardgame.io props including G and ctx
 */
export function useBoardProps(): BoardProps {
  const ctx = useContext(EffectsPropsContext);
  if (!ctx) throw new Error(hookErrorMessage('useBoardProps'));
  return ctx;
}
