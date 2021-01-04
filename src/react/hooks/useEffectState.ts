import { useState } from 'react';
import type { EffectsPluginConfig, EffectState } from '../../types';
import { useEffectListener } from './useEffectListener';

type EffectStateReturn<
  C extends EffectsPluginConfig,
  K extends keyof C['effects']
> = readonly [EffectState<C['effects'][K]> | undefined, boolean];

/**
 * Subscribe to the latest value of a particular effect.
 * This hook is sugar around `useEffectListener` and `useState`.
 * @param effectType - Name of the effect to subscribe to.
 * @return - Tuple of `[effectState: any, isActive: boolean]`.
 * Will be `[undefined, false]` on initial render.
 * `isActive` is true for the length of the effect’s duration.
 */
export function useEffectState<
  C extends EffectsPluginConfig,
  K extends keyof C['effects']
>(effectType: K, _config?: C): EffectStateReturn<C, K> {
  const [state, setState] = useState<EffectState<C['effects'][K]>>();
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
