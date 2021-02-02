import { useState } from 'react';
import type { EffectsPluginConfig, EffectState } from '../../types';
import { useEffectListener } from './useEffectListener';

type EffectStateReturn<
  C extends EffectsPluginConfig,
  K extends keyof C['effects'],
  S
> = readonly [EffectState<C['effects'][K]> | S, boolean];

/**
 * Subscribe to the latest value of a particular effect.
 * This hook is sugar around `useEffectListener` and `useState`.
 * @param effectType - Name of the effect to subscribe to.
 * @param initialState - Value to use for state before effect first fires.
 * @return - Tuple of `[effectState: any, isActive: boolean]`.
 * `effectState` will be `undefined` on initial render if `initialState` is not set.
 * `isActive` is true for the length of the effect’s duration.
 */
export function useEffectState<
  C extends EffectsPluginConfig,
  K extends keyof C['effects'],
  S
>(effectType: K, initialState?: S, _config?: C): EffectStateReturn<C, K, S> {
  const [state, setState] = useState<EffectState<C['effects'][K]> | S>(
    initialState as S
  );
  const [isActive, setIsActive] = useState(false);

  useEffectListener(
    effectType as any,
    (payload: any) => {
      setState(payload);
      setIsActive(true);
    },
    [],
    () => setIsActive(false),
    []
  );

  return [state, isActive];
}
