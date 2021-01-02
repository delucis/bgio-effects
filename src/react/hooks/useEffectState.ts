import { useState } from 'react';
import type { EffectsPluginConfig, EffectState } from '../../types';
import { useEffectListener } from './useEffectListener';

type EffectStateReturn<
  C extends EffectsPluginConfig,
  K extends keyof C['effects']
> = readonly [EffectState<C['effects'][K]> | undefined, boolean];

/**
 * Subscribe to the latest value of a particular effect.
 * This hook is sugar around `useEffectListener`, `useState`, and `setTimeout`.
 * @param effectType - Name of the effect to subscribe to.
 * @param duration - Duration in seconds to flag this effect as “active” for.
 * @return Tuple of `[effectState: any, isActive: boolean]`. Will be `[undefined, false]` on initial render.
 */
export function useEffectState<
  C extends EffectsPluginConfig,
  K extends keyof C['effects']
>(effectType: K, duration = 0, _config?: C): EffectStateReturn<C, K> {
  const [state, setState] = useState<EffectState<C['effects'][K]>>();
  const [isActive, setIsActive] = useState(false);

  useEffectListener(
    effectType as any,
    (payload: any) => {
      setState(payload);
      setIsActive(true);
      const timeout = setTimeout(() => setIsActive(false), duration * 1000);
      return () => clearTimeout(timeout);
    },
    [duration]
  );

  return [state, isActive];
}
